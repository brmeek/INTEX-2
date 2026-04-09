import { useEffect, useMemo, useState } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import {
  PROVINCE_DATA,
  CITY_COORDINATES,
  REGION_COORDINATES,
  ALL_PROVINCES,
  mapSafehousesToProvinces,
  getRiskColor,
  getRiskLabel,
  type ProvinceData,
} from "@/data/traffickingData";
import {
  computeCoverageGaps,
  TIER_COLORS,
  TIER_LABELS,
} from "@/data/coverageGapData";
import { cn } from "@/lib/utils";

type MetricKey = "riskScore" | "reportedIncidents" | "serviceGaps";

interface SafehouseApi {
  safehouseId: number;
  safehouseName: string | null;
  location: string | null;
  region: string | null;
  capacity: number | null;
  currentOccupancy: number | null;
  status: string | null;
}

const METRIC_CONFIG: Record<MetricKey, { label: string; unit: string; max: number; colors: string[]; description: string; thresholds: string; examples: string }> = {
  riskScore: {
    label: "Risk Score",
    unit: "/ 100",
    max: 100,
    colors: ["#22c55e", "#facc15", "#f97316", "#dc2626", "#991b1b"],
    description: "A composite score (0–100) measuring a province's overall vulnerability to human trafficking and abuse. Factors include poverty rate, proximity to trafficking corridors, presence of exploitative industries, migration patterns, and law enforcement capacity.",
    thresholds: "0–34 Minimal · 35–49 Low · 50–64 Moderate · 65–79 High · 80–100 Critical",
    examples: "A province with high migration outflows, weak local policing, and documented recruiter activity would score 75+.",
  },
  reportedIncidents: {
    label: "Reported Incidents",
    unit: "cases",
    max: 500,
    colors: ["#dbeafe", "#93c5fd", "#3b82f6", "#1d4ed8", "#1e3a5f"],
    description: "The total number of reported cases involving trafficking, domestic abuse, child exploitation, forced labor, or online sexual exploitation originating from or occurring within the province.",
    thresholds: "Ranges from single digits in remote provinces to 400+ in major urban centers",
    examples: "Online sexual exploitation of children, labor trafficking through illegal recruitment agencies, domestic violence cases referred by barangay officials.",
  },
  serviceGaps: {
    label: "Service Gap Index",
    unit: "/ 100",
    max: 100,
    colors: ["#86efac", "#fb923c", "#ea580c", "#c2410c", "#7c2d12"],
    description: "Measures how underserved a province is (0–100) based on the availability of shelters, counseling, legal aid, medical services, and livelihood programs for survivors relative to demand.",
    thresholds: "0–34 Well-served · 35–49 Some gaps · 50–64 Moderate · 65–79 Significant · 80–100 Severe",
    examples: "A province with no shelter within 100 km, no trauma-trained counselors, and limited legal aid would score 80+.",
  },
};

const safehouseIcon = new L.DivIcon({
  html: `<div style="
    background: #2B4570;
    border: 3px solid #fff;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  "><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>`,
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function getMetricColor(value: number, metric: MetricKey): string {
  const cfg = METRIC_CONFIG[metric];
  const ratio = Math.min(value / cfg.max, 1);
  const idx = Math.min(Math.floor(ratio * cfg.colors.length), cfg.colors.length - 1);
  return cfg.colors[idx];
}

function getCircleRadius(value: number, metric: MetricKey): number {
  const cfg = METRIC_CONFIG[metric];
  const ratio = Math.min(value / cfg.max, 1);
  return 8 + ratio * 22;
}

function ResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

function Legend({ metric }: { metric: MetricKey }) {
  const cfg = METRIC_CONFIG[metric];
  const labels =
    metric === "riskScore"
      ? ["Minimal", "Low", "Moderate", "High", "Critical"]
      : metric === "serviceGaps"
        ? ["Well-served", "Some gaps", "Moderate", "Significant", "Severe"]
        : ["Very Low", "Low", "Moderate", "High", "Very High"];

  return (
    <div className="absolute bottom-6 left-6 z-[1000] bg-card/95 backdrop-blur-sm rounded-xl shadow-elevated p-4 border border-border max-w-[200px]">
      <h4 className="font-heading text-xs font-bold text-foreground mb-2">{cfg.label}</h4>
      <div className="space-y-1.5">
        {cfg.colors.map((color, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <span className="font-body text-[10px] text-muted-foreground">{labels[i]}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-navy border-2 border-white shadow-sm shrink-0" />
          <span className="font-body text-[10px] text-muted-foreground">Safehouse</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="bg-card rounded-xl p-4 shadow-soft border border-border">
      <p className="font-body text-xs text-muted-foreground mb-1">{label}</p>
      <p className={cn("font-heading text-2xl font-bold", accent ?? "text-foreground")}>{value}</p>
      {sub && <p className="font-body text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

interface DonationApi {
  donationId: number;
  donationType: string;
  donationDate: string;
  amount: number | null;
  estimatedValue: number | null;
  campaignName: string | null;
  channelSource: string;
  isRecurring: boolean;
  supporter?: { supporterName: string };
}

const TraffickingMapPage = () => {
  const [safehouses, setSafehouses] = useState<SafehouseApi[]>([]);
  const [donations, setDonations] = useState<DonationApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<MetricKey>("riskScore");
  const [showSafehouses, setShowSafehouses] = useState(true);
  const [showProvinces, setShowProvinces] = useState(true);
  const [selectedProvince, setSelectedProvince] = useState<ProvinceData | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<SafehouseApi[]>("/api/Safehouses").catch(() => [] as SafehouseApi[]),
      api.get<{ items: DonationApi[]; total: number }>("/api/donations?page=1&pageSize=500").catch(() => ({ items: [] as DonationApi[], total: 0 })),
    ])
      .then(([sh, donRes]) => {
        setSafehouses(sh);
        setDonations(donRes.items);
      })
      .finally(() => setLoading(false));
  }, []);

  const safehouseMarkers = useMemo(() => {
    return safehouses
      .map((s) => {
        const cityKey = s.location?.trim() ?? "";
        const regionKey = s.region?.trim() ?? "";
        const coords =
          CITY_COORDINATES[cityKey] ??
          REGION_COORDINATES[regionKey] ??
          REGION_COORDINATES["Luzon"];
        return { ...s, lat: coords.lat, lng: coords.lng };
      })
      .filter((s) => s.lat && s.lng);
  }, [safehouses]);

  const coveredProvinces = useMemo(
    () => mapSafehousesToProvinces(safehouses),
    [safehouses]
  );

  const coverageAnalysis = useMemo(() => {
    const total = ALL_PROVINCES.length;
    const coveredCount = coveredProvinces.size;
    const uncoveredCount = total - coveredCount;

    const uncoveredByZone = new Map<string, string[]>();
    for (const p of ALL_PROVINCES) {
      if (coveredProvinces.has(p.name)) continue;
      const list = uncoveredByZone.get(p.zone) ?? [];
      list.push(p.name);
      uncoveredByZone.set(p.zone, list);
    }

    const highRiskUncovered = PROVINCE_DATA.filter(
      (p) => p.riskScore >= 65 && !coveredProvinces.has(p.name)
    );

    return { coveredCount, uncoveredCount, uncoveredByZone, highRiskUncovered, total };
  }, [coveredProvinces]);

  const stats = useMemo(() => {
    const totalIncidents = PROVINCE_DATA.reduce((s, p) => s + p.reportedIncidents, 0);
    const avgRisk = Math.round(PROVINCE_DATA.reduce((s, p) => s + p.riskScore, 0) / PROVINCE_DATA.length);
    const avgGap = Math.round(PROVINCE_DATA.reduce((s, p) => s + p.serviceGaps, 0) / PROVINCE_DATA.length);
    const criticalCount = PROVINCE_DATA.filter((p) => p.riskScore >= 80).length;
    return { totalIncidents, avgRisk, avgGap, criticalCount };
  }, []);

  const gaps = useMemo(() => computeCoverageGaps(coveredProvinces), [coveredProvinces]);

  const gapKpis = useMemo(() => {
    const critical = gaps.filter((g) => g.priorityTier === "critical").length;
    const high = gaps.filter((g) => g.priorityTier === "high").length;
    const totalPopAtRisk = gaps.reduce((s, g) => s + g.totalPopulation, 0);
    const totalEstCost = gaps.reduce((s, g) => s + g.estimatedCostUsd, 0);
    return { critical, high, totalPopAtRisk, totalEstCost };
  }, [gaps]);

  const fundingAnalysis = useMemo(() => {
    const gapDonations = donations.filter(
      (d) => d.campaignName && d.campaignName.includes("Coverage Gap")
    );

    const totalRaised = gapDonations.reduce(
      (s, d) => s + (d.amount ?? d.estimatedValue ?? 0),
      0
    );

    const perRegion = new Map<string, number>();
    for (const d of gapDonations) {
      const match = d.campaignName?.match(/Coverage Gap\s*[—–-]\s*(.+)/);
      if (match) {
        const region = match[1].trim();
        perRegion.set(region, (perRegion.get(region) ?? 0) + (d.amount ?? d.estimatedValue ?? 0));
      }
    }

    const recentDonors = gapDonations
      .filter((d) => d.supporter?.supporterName)
      .sort((a, b) => new Date(b.donationDate).getTime() - new Date(a.donationDate).getTime())
      .slice(0, 8);

    return { totalRaised, perRegion, recentDonors, totalDonations: gapDonations.length };
  }, [donations]);

  return (
    <AdminLayout title="Needs Assessment Map" subtitle="Risk, incidents & service gaps across Philippine provinces">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI strip */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard label="Total Reported Incidents" value={stats.totalIncidents.toLocaleString()} />
            <StatCard label="Avg Risk Score" value={stats.avgRisk} sub="out of 100" />
            <StatCard label="Avg Service Gap" value={stats.avgGap} sub="out of 100" />
            <StatCard label="Critical Provinces" value={stats.criticalCount} sub="risk ≥ 80" />
            <StatCard
              label="Provinces Without Safehouses"
              value={coverageAnalysis.uncoveredCount}
              sub={`of ${coverageAnalysis.total} provinces`}
            />
          </div>

          {/* Controls */}
          <div className="bg-card rounded-xl p-4 shadow-soft border border-border flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="font-body text-sm font-medium text-foreground">Color by:</label>
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value as MetricKey)}
                className="px-3 py-1.5 rounded-lg border border-border bg-background font-body text-sm"
              >
                <option value="riskScore">Risk Score</option>
                <option value="reportedIncidents">Reported Incidents</option>
                <option value="serviceGaps">Service Gap Index</option>
              </select>
            </div>
            <label className="flex items-center gap-2 font-body text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showProvinces}
                onChange={(e) => setShowProvinces(e.target.checked)}
                className="accent-teal"
              />
              Show Provinces
            </label>
            <label className="flex items-center gap-2 font-body text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showSafehouses}
                onChange={(e) => setShowSafehouses(e.target.checked)}
                className="accent-navy"
              />
              Show Safehouses ({safehouses.length})
            </label>
          </div>

          {/* Metric explainer */}
          <div className="bg-card rounded-xl p-5 shadow-soft border border-border">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: METRIC_CONFIG[metric].colors[3] }} />
              <div>
                <h3 className="font-heading text-sm font-bold text-foreground mb-1">
                  What is {METRIC_CONFIG[metric].label}?
                </h3>
                <p className="font-body text-sm text-muted-foreground mb-2">
                  {METRIC_CONFIG[metric].description}
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-1">
                  <p className="font-body text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Scale: </span>
                    {METRIC_CONFIG[metric].thresholds}
                  </p>
                </div>
                <p className="font-body text-xs text-muted-foreground mt-1">
                  <span className="font-semibold text-foreground">Examples: </span>
                  {METRIC_CONFIG[metric].examples}
                </p>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="relative bg-card rounded-xl shadow-soft border border-border overflow-hidden" style={{ height: "600px" }}>
            <MapContainer
              center={[12.5, 122.0]}
              zoom={6}
              scrollWheelZoom={true}
              style={{ height: "100%", width: "100%", borderRadius: "0.75rem" }}
            >
              <ResizeHandler />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {showProvinces &&
                PROVINCE_DATA.map((province) => (
                  <CircleMarker
                    key={province.name}
                    center={[province.lat, province.lng]}
                    radius={getCircleRadius(province[metric], metric)}
                    pathOptions={{
                      fillColor: getMetricColor(province[metric], metric),
                      fillOpacity: 0.7,
                      color: "#fff",
                      weight: 1.5,
                      opacity: 0.9,
                    }}
                    eventHandlers={{
                      click: () => setSelectedProvince(province),
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -10]} className="!rounded-lg !shadow-lg !border-border">
                      <div className="font-body text-xs">
                        <p className="font-semibold text-sm">{province.name}</p>
                        <p className="text-muted-foreground">{province.region}</p>
                        <div className="mt-1 space-y-0.5">
                          <p>Risk: <span className="font-medium" style={{ color: getRiskColor(province.riskScore) }}>{province.riskScore}</span></p>
                          <p>Incidents: <span className="font-medium">{province.reportedIncidents}</span></p>
                          <p>Service Gap: <span className="font-medium">{province.serviceGaps}</span></p>
                        </div>
                      </div>
                    </Tooltip>
                  </CircleMarker>
                ))}

              {showSafehouses &&
                safehouseMarkers.map((s) => (
                  <Marker
                    key={s.safehouseId}
                    position={[s.lat, s.lng]}
                    icon={safehouseIcon}
                  >
                    <Popup className="!rounded-xl">
                      <div className="font-body text-xs min-w-[180px]">
                        <p className="font-heading font-bold text-sm mb-1">
                          {s.safehouseName || `Safehouse ${s.safehouseId}`}
                        </p>
                        <p className="text-muted-foreground mb-2">{s.location}{s.region ? `, ${s.region}` : ""}</p>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Status</span>
                            <span className={`font-semibold ${s.status === "Active" ? "text-green-600" : "text-amber-600"}`}>
                              {s.status || "Unknown"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Capacity</span>
                            <span className="font-medium">{s.capacity ?? "—"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Occupancy</span>
                            <span className="font-medium">{s.currentOccupancy ?? "—"}</span>
                          </div>
                          {s.capacity != null && s.currentOccupancy != null && (
                            <div className="mt-1.5">
                              <div className="h-2 w-full rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-teal"
                                  style={{ width: `${Math.min(100, (s.currentOccupancy / s.capacity) * 100)}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-0.5 text-right">
                                {Math.round((s.currentOccupancy / s.capacity) * 100)}% full
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
            </MapContainer>

            <Legend metric={metric} />
          </div>

          {/* Province detail panel */}
          {selectedProvince && (
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border animate-fade-up">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-heading text-lg font-bold text-foreground">{selectedProvince.name}</h3>
                  <p className="font-body text-sm text-muted-foreground">{selectedProvince.region}</p>
                </div>
                <button
                  onClick={() => setSelectedProvince(null)}
                  className="text-muted-foreground hover:text-foreground text-sm font-body"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="font-body text-xs text-muted-foreground">Risk Score</p>
                  <p className="font-heading text-2xl font-bold" style={{ color: getRiskColor(selectedProvince.riskScore) }}>
                    {selectedProvince.riskScore}
                  </p>
                  <p className="font-body text-xs font-medium" style={{ color: getRiskColor(selectedProvince.riskScore) }}>
                    {getRiskLabel(selectedProvince.riskScore)}
                  </p>
                </div>
                <div>
                  <p className="font-body text-xs text-muted-foreground">Reported Incidents</p>
                  <p className="font-heading text-2xl font-bold text-foreground">{selectedProvince.reportedIncidents}</p>
                </div>
                <div>
                  <p className="font-body text-xs text-muted-foreground">Service Gap Index</p>
                  <p className="font-heading text-2xl font-bold text-foreground">{selectedProvince.serviceGaps}</p>
                  <div className="mt-1 h-2 w-full rounded-full bg-muted max-w-[100px]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${selectedProvince.serviceGaps}%`,
                        backgroundColor: selectedProvince.serviceGaps >= 70 ? "#dc2626" : selectedProvince.serviceGaps >= 50 ? "#f97316" : "#22c55e",
                      }}
                    />
                  </div>
                </div>
                <div>
                  <p className="font-body text-xs text-muted-foreground">Population</p>
                  <p className="font-heading text-2xl font-bold text-foreground">{selectedProvince.population.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Coverage analysis */}
          <div className="grid lg:grid-cols-2 gap-6 items-stretch">
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border h-full">
              <h3 className="font-heading text-lg font-bold text-foreground mb-1">Coverage Analysis</h3>
              <p className="font-body text-xs text-muted-foreground mb-4">
                Provinces with vs. without safehouse presence ({coverageAnalysis.total} total across 3 zones)
              </p>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-body text-sm text-foreground">Provinces with safehouses</span>
                    <span className="font-body text-sm font-semibold text-teal">
                      {coverageAnalysis.coveredCount}
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-teal"
                      style={{ width: `${(coverageAnalysis.coveredCount / coverageAnalysis.total) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-body text-sm text-foreground">Provinces without coverage</span>
                    <span className="font-body text-sm font-semibold text-coral">
                      {coverageAnalysis.uncoveredCount}
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-coral"
                      style={{ width: `${(coverageAnalysis.uncoveredCount / coverageAnalysis.total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              {coverageAnalysis.uncoveredCount > 0 && (
                <div className="mt-4">
                  <p className="font-body text-xs text-muted-foreground mb-2">Uncovered provinces by zone:</p>
                  <div className="space-y-2">
                    {[...coverageAnalysis.uncoveredByZone.entries()].map(([zone, provinces]) => (
                      <div key={zone}>
                        <p className="font-body text-xs font-semibold text-foreground mb-1">
                          {zone} <span className="text-muted-foreground font-normal">({provinces.length})</span>
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {provinces.map((name) => (
                            <span key={name} className="px-2 py-1 rounded-md bg-coral/10 text-coral font-body text-[11px] font-medium">
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-card rounded-xl p-6 shadow-soft border border-border h-full flex flex-col">
              <h3 className="font-heading text-lg font-bold text-foreground mb-1">High-Risk Uncovered Areas</h3>
              <p className="font-body text-xs text-muted-foreground mb-4">
                Provinces with risk ≥ 65 and no safehouse in their province
              </p>
              {coverageAnalysis.highRiskUncovered.length === 0 ? (
                <p className="font-body text-sm text-muted-foreground italic">
                  All high-risk provinces have safehouse coverage.
                </p>
              ) : (
                <div className="space-y-2 flex-1 overflow-y-auto">
                  {coverageAnalysis.highRiskUncovered
                    .sort((a, b) => b.riskScore - a.riskScore)
                    .map((p) => (
                      <div
                        key={p.name}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary border border-border"
                      >
                        <div>
                          <p className="font-body text-sm font-medium text-foreground">{p.name}</p>
                          <p className="font-body text-[10px] text-muted-foreground">{p.region}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-body text-sm font-bold" style={{ color: getRiskColor(p.riskScore) }}>
                            {p.riskScore}
                          </p>
                          <p className="font-body text-[10px] text-muted-foreground">{p.reportedIncidents} incidents</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Expansion & Funding Report */}
          <div className="border-t border-border pt-6">
            <h2 className="font-heading text-xl font-bold text-foreground mb-1">Expansion & Funding Report</h2>
            <p className="font-body text-sm text-muted-foreground mb-5">
              Coverage gap priorities, funding progress, and donor contributions
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <StatCard label="Uncovered Provinces" value={coverageAnalysis.uncoveredCount} sub={`of ${coverageAnalysis.total} provinces`} />
              <StatCard label="Critical Gaps" value={gapKpis.critical} accent="text-red-600" />
              <StatCard label="High Priority" value={gapKpis.high} accent="text-orange-500" />
              <StatCard label="Est. Total Cost" value={`$${gapKpis.totalEstCost.toLocaleString()}`} sub="to cover all gaps" accent="text-teal" />
              <StatCard
                label="Total Raised"
                value={`$${fundingAnalysis.totalRaised.toLocaleString()}`}
                sub={`${fundingAnalysis.totalDonations} donation${fundingAnalysis.totalDonations !== 1 ? "s" : ""}`}
                accent="text-teal"
              />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Expansion Roadmap */}
              <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
                <h3 className="font-heading text-lg font-bold text-foreground mb-1">Expansion Roadmap</h3>
                <p className="font-body text-xs text-muted-foreground mb-4">
                  Priority order based on composite scoring
                </p>
                <div className="space-y-2 max-h-[320px] overflow-y-auto">
                  {gaps.map((g, i) => (
                    <div
                      key={g.region}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <span className="font-heading text-sm font-bold text-muted-foreground w-6 text-right shrink-0">
                        {i + 1}.
                      </span>
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: TIER_COLORS[g.priorityTier] }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm font-medium text-foreground truncate">{g.region}</p>
                        <p className="font-body text-[10px] text-muted-foreground">
                          {TIER_LABELS[g.priorityTier]} &middot; {g.uncoveredProvinceCount} of {g.totalProvinceCount} provinces uncovered
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-body text-xs font-semibold" style={{ color: getRiskColor(g.avgRiskScore) }}>
                          {g.avgRiskScore}
                        </p>
                        <p className="font-body text-[10px] text-muted-foreground">risk</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Funding Progress per Region */}
              <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
                <h3 className="font-heading text-lg font-bold text-foreground mb-1">Funding by Zone</h3>
                <p className="font-body text-xs text-muted-foreground mb-4">
                  Donations received vs. estimated safehouse cost
                </p>
                <div className="space-y-3 max-h-[320px] overflow-y-auto">
                  {gaps.map((g) => {
                    const raised = fundingAnalysis.perRegion.get(g.region) ?? 0;
                    const pct = g.estimatedCostUsd > 0
                      ? Math.min(100, Math.round((raised / g.estimatedCostUsd) * 100))
                      : 0;
                    return (
                      <div key={g.region}>
                        <div className="flex justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <div
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: TIER_COLORS[g.priorityTier] }}
                            />
                            <span className="font-body text-sm font-medium text-foreground">{g.region}</span>
                          </div>
                          <span className="font-body text-xs text-muted-foreground">
                            ${raised.toLocaleString()} / ${g.estimatedCostUsd.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-teal transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="font-body text-[10px] text-muted-foreground mt-0.5 text-right">
                          {pct}% funded &middot; ${(g.estimatedCostUsd - raised).toLocaleString()} remaining
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Donors */}
              <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
                <h3 className="font-heading text-lg font-bold text-foreground mb-1">Recent Gap Donors</h3>
                <p className="font-body text-xs text-muted-foreground mb-4">
                  Contributors to coverage gap campaigns
                </p>
                {fundingAnalysis.recentDonors.length === 0 ? (
                  <p className="font-body text-sm text-muted-foreground italic">
                    No coverage gap donations recorded yet.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[320px] overflow-y-auto">
                    {fundingAnalysis.recentDonors.map((d) => {
                      const match = d.campaignName?.match(/Coverage Gap\s*[—–-]\s*(.+)/);
                      const region = match ? match[1].trim() : "General";
                      return (
                        <div
                          key={d.donationId}
                          className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-secondary border border-border"
                        >
                          <div>
                            <p className="font-body text-sm font-medium text-foreground">
                              {d.supporter?.supporterName ?? "Anonymous"}
                            </p>
                            <p className="font-body text-[10px] text-muted-foreground">
                              {region} &middot; {new Date(d.donationDate).toLocaleDateString()}
                            </p>
                          </div>
                          <p className="font-heading text-sm font-bold text-teal">
                            ${(d.amount ?? d.estimatedValue ?? 0).toLocaleString()}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default TraffickingMapPage;
