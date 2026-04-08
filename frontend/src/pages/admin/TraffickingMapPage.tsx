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
  getRiskColor,
  getRiskLabel,
  type ProvinceData,
} from "@/data/traffickingData";

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

const METRIC_CONFIG: Record<MetricKey, { label: string; unit: string; max: number; colors: string[] }> = {
  riskScore: {
    label: "Trafficking Risk Score",
    unit: "/ 100",
    max: 100,
    colors: ["#22c55e", "#facc15", "#f97316", "#dc2626", "#991b1b"],
  },
  reportedIncidents: {
    label: "Reported Incidents",
    unit: "cases",
    max: 500,
    colors: ["#dbeafe", "#93c5fd", "#3b82f6", "#1d4ed8", "#1e3a5f"],
  },
  serviceGaps: {
    label: "Service Gap Index",
    unit: "/ 100",
    max: 100,
    colors: ["#86efac", "#fb923c", "#ea580c", "#c2410c", "#7c2d12"],
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
    <div className="absolute bottom-6 left-6 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl shadow-elevated p-4 border border-border max-w-[200px]">
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

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-soft border border-border">
      <p className="font-body text-xs text-muted-foreground mb-1">{label}</p>
      <p className="font-heading text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="font-body text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

const TraffickingMapPage = () => {
  const [safehouses, setSafehouses] = useState<SafehouseApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<MetricKey>("riskScore");
  const [showSafehouses, setShowSafehouses] = useState(true);
  const [showProvinces, setShowProvinces] = useState(true);
  const [selectedProvince, setSelectedProvince] = useState<ProvinceData | null>(null);

  useEffect(() => {
    api
      .get<SafehouseApi[]>("/api/Safehouses")
      .then(setSafehouses)
      .catch(() => {})
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

  const coverageAnalysis = useMemo(() => {
    const coveredRegions = new Set(safehouses.map((s) => s.region?.trim()).filter(Boolean));
    const allRegions = new Set(PROVINCE_DATA.map((p) => p.region));
    const uncovered = [...allRegions].filter((r) => !coveredRegions.has(r));
    const highRiskUncovered = PROVINCE_DATA.filter(
      (p) => p.riskScore >= 65 && !coveredRegions.has(p.region)
    );
    return { coveredRegions, uncovered, highRiskUncovered, total: allRegions.size };
  }, [safehouses]);

  const stats = useMemo(() => {
    const totalIncidents = PROVINCE_DATA.reduce((s, p) => s + p.reportedIncidents, 0);
    const avgRisk = Math.round(PROVINCE_DATA.reduce((s, p) => s + p.riskScore, 0) / PROVINCE_DATA.length);
    const avgGap = Math.round(PROVINCE_DATA.reduce((s, p) => s + p.serviceGaps, 0) / PROVINCE_DATA.length);
    const criticalCount = PROVINCE_DATA.filter((p) => p.riskScore >= 80).length;
    return { totalIncidents, avgRisk, avgGap, criticalCount };
  }, []);

  return (
    <AdminLayout title="Trafficking Heat Map" subtitle="Philippine provinces — risk, incidents & service gaps">
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
              label="Coverage Gaps"
              value={coverageAnalysis.uncovered.length}
              sub={`of ${coverageAnalysis.total} regions`}
            />
          </div>

          {/* Controls */}
          <div className="bg-white rounded-xl p-4 shadow-soft border border-border flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="font-body text-sm font-medium text-foreground">Color by:</label>
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value as MetricKey)}
                className="px-3 py-1.5 rounded-lg border border-border bg-white font-body text-sm"
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

          {/* Map */}
          <div className="relative bg-white rounded-xl shadow-soft border border-border overflow-hidden" style={{ height: "600px" }}>
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
            <div className="bg-white rounded-xl p-6 shadow-soft border border-border animate-fade-up">
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
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-soft border border-border">
              <h3 className="font-heading text-lg font-bold text-foreground mb-1">Coverage Analysis</h3>
              <p className="font-body text-xs text-muted-foreground mb-4">
                Regions with vs. without safehouse presence
              </p>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-body text-sm text-foreground">Regions with safehouses</span>
                    <span className="font-body text-sm font-semibold text-teal">
                      {coverageAnalysis.coveredRegions.size}
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-teal"
                      style={{ width: `${(coverageAnalysis.coveredRegions.size / coverageAnalysis.total) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-body text-sm text-foreground">Regions without coverage</span>
                    <span className="font-body text-sm font-semibold text-coral">
                      {coverageAnalysis.uncovered.length}
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-coral"
                      style={{ width: `${(coverageAnalysis.uncovered.length / coverageAnalysis.total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              {coverageAnalysis.uncovered.length > 0 && (
                <div className="mt-4">
                  <p className="font-body text-xs text-muted-foreground mb-2">Uncovered regions:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {coverageAnalysis.uncovered.map((r) => (
                      <span key={r} className="px-2 py-1 rounded-md bg-coral/10 text-coral font-body text-xs font-medium">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-soft border border-border">
              <h3 className="font-heading text-lg font-bold text-foreground mb-1">High-Risk Uncovered Areas</h3>
              <p className="font-body text-xs text-muted-foreground mb-4">
                Provinces with risk ≥ 65 in regions lacking safehouse presence
              </p>
              {coverageAnalysis.highRiskUncovered.length === 0 ? (
                <p className="font-body text-sm text-muted-foreground italic">
                  All high-risk provinces have safehouse coverage in their region.
                </p>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {coverageAnalysis.highRiskUncovered
                    .sort((a, b) => b.riskScore - a.riskScore)
                    .map((p) => (
                      <div
                        key={p.name}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-red-50 border border-red-100"
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
        </div>
      )}
    </AdminLayout>
  );
};

export default TraffickingMapPage;
