import { useEffect, useMemo, useState } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import { api } from "@/lib/api";
import { MapPin, Heart, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  computeCoverageGaps,
  TIER_COLORS,
  TIER_LABELS,
  type CoverageGap,
} from "@/data/coverageGapData";
import { ALL_PROVINCES, mapSafehousesToProvinces } from "@/data/traffickingData";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useTheme } from "@/context/useTheme";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? "";

interface SafehouseApi {
  safehouseId: number;
  safehouseName: string | null;
  location: string | null;
  region: string | null;
  capacity: number | null;
  currentOccupancy: number | null;
  status: string | null;
}

function ResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

interface SponsorModalProps {
  gap: CoverageGap;
  onClose: () => void;
  onDonate: (amount: number, region: string) => void;
  donating: boolean;
}

function SponsorModal({ gap, onClose, onDonate, donating }: SponsorModalProps) {
  const presets = [100, 250, 500, 1000];
  const [selected, setSelected] = useState<number | null>(250);
  const [custom, setCustom] = useState("");
  const amount = selected ?? (custom ? Number(custom) : null);

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-elevated max-w-md w-full p-6 animate-fade-up">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: TIER_COLORS[gap.priorityTier] }}
          />
          <span
            className="font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: TIER_COLORS[gap.priorityTier] }}
          >
            {TIER_LABELS[gap.priorityTier]}
          </span>
        </div>
        <h3 className="mb-1 font-heading text-xl font-bold text-foreground">
          Sponsor {gap.region}
        </h3>
        <p className="mb-4 font-body text-sm text-muted-foreground">
          Help expand safehouse coverage to protect {gap.totalPopulation.toLocaleString()} people
          across {gap.uncoveredProvinceCount} uncovered province
          {gap.uncoveredProvinceCount !== 1 ? "s" : ""} in {gap.region}.
        </p>

        <div className="mb-3 grid grid-cols-2 gap-2">
          {presets.map((amt) => (
            <button
              key={amt}
              onClick={() => {
                setSelected(amt);
                setCustom("");
              }}
              className={cn(
                "rounded-lg border py-2.5 font-body text-sm font-semibold transition-all",
                selected === amt
                  ? "border-navy bg-navy text-white shadow-soft"
                  : "border-border bg-secondary text-foreground hover:border-navy/30"
              )}
            >
              ${amt.toLocaleString()}
            </button>
          ))}
        </div>
        <input
          type="number"
          placeholder="Custom amount"
          value={custom}
          min={1}
          onChange={(e) => {
            setCustom(e.target.value);
            setSelected(null);
          }}
          className="mb-4 w-full rounded-xl border border-border bg-secondary px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
        />

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">
            Cancel
          </Button>
          <Button
            disabled={!amount || amount <= 0 || donating}
            onClick={() => amount && onDonate(amount, gap.region)}
            className="flex-1 rounded-xl"
          >
            {donating ? (
              "Processing..."
            ) : (
              <>
                <Heart className="mr-1 h-4 w-4" />
                Donate ${amount?.toLocaleString() ?? ""}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CoverageGapFinder({ readOnly = false }: { readOnly?: boolean }) {
  const { toast } = useToast();
  const { theme } = useTheme();
  const [safehouses, setSafehouses] = useState<SafehouseApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [sponsorGap, setSponsorGap] = useState<CoverageGap | null>(null);
  const [donating, setDonating] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadSafehouses = async () => {
      setLoading(true);
      try {
        if (readOnly) {
          // Public impact pages should never trigger auth redirects.
          const response = await fetch(`${API_BASE}/api/Safehouses`, { credentials: "include" });
          if (!response.ok) {
            if (!cancelled) setSafehouses([]);
            return;
          }
          const data = (await response.json()) as SafehouseApi[];
          if (!cancelled) setSafehouses(data);
          return;
        }

        const data = await api.get<SafehouseApi[]>("/api/Safehouses");
        if (!cancelled) setSafehouses(data);
      } catch {
        if (!cancelled) setSafehouses([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadSafehouses();
    return () => {
      cancelled = true;
    };
  }, [readOnly]);

  const coveredProvinces = useMemo(() => mapSafehousesToProvinces(safehouses), [safehouses]);
  const uncoveredCount = ALL_PROVINCES.length - coveredProvinces.size;
  const gaps = useMemo(() => computeCoverageGaps(coveredProvinces), [coveredProvinces]);
  const mapTileUrl = theme === "dark"
    ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const handleDonate = async (amount: number, region: string) => {
    setDonating(true);
    try {
      await api.post("/api/donations/self-serve", {
        amount,
        isRecurring: false,
        campaign: `Coverage Gap - ${region}`,
      });
      toast({
        title: "Thank you!",
        description: `Your $${amount.toLocaleString()} gift toward expanding coverage in ${region} has been recorded.`,
      });
      setSponsorGap(null);
    } catch (err) {
      toast({
        title: "Donation failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDonating(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin h-6 w-6 border-4 border-accent border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-6 py-5 transition-colors hover:bg-secondary/40"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy/10">
            <MapPin className="h-5 w-5 text-navy" />
          </div>
          <div className="text-left">
            <h2 className="font-heading text-xl font-bold text-foreground md:text-2xl">
              Coverage Gap Finder
            </h2>
            <p className="font-body text-sm text-muted-foreground">
              {uncoveredCount} of {ALL_PROVINCES.length} provinces lack safehouse coverage
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="space-y-4 px-6 pb-6">
          {!readOnly && (
            <div className="rounded-2xl border border-border bg-secondary/70 p-6">
              <p className="mb-4 font-body text-base leading-relaxed text-foreground">
                Each circle marks a zone with{" "}
                <span className="font-semibold text-navy">uncovered provinces</span>. Larger,
                darker markers signal regions where the service gap is most urgent. Click a
                circle or card to sponsor coverage directly.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="mb-2 font-heading text-sm font-bold text-foreground">Risk Score</p>
                  <p className="font-body text-sm leading-relaxed text-muted-foreground">
                    Composite vulnerability rating based on poverty, migration, and enforcement
                    capacity.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="mb-2 font-heading text-sm font-bold text-foreground">Service Gap</p>
                  <p className="font-body text-sm leading-relaxed text-muted-foreground">
                    Availability of shelters, counseling, legal aid, and medical services for
                    survivors.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="mb-2 font-heading text-sm font-bold text-foreground">Why Sponsor?</p>
                  <p className="font-body text-sm leading-relaxed text-muted-foreground">
                    Your gift funds a safehouse offering shelter, recovery programs, and a path to
                    independence.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="relative overflow-hidden rounded-xl border border-border" style={{ height: 380 }}>
            <MapContainer
              center={[12.5, 122.0]}
              zoom={6}
              scrollWheelZoom
              style={{ height: "100%", width: "100%", borderRadius: "0.75rem" }}
            >
              <ResizeHandler />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url={mapTileUrl}
              />

              {gaps.map((g) => (
                <CircleMarker
                  key={g.region}
                  center={[g.lat, g.lng]}
                  radius={18 + g.avgRiskScore * 0.15}
                  pathOptions={{
                    fillColor: TIER_COLORS[g.priorityTier],
                    fillOpacity: 0.35,
                    color: TIER_COLORS[g.priorityTier],
                    weight: 2,
                    dashArray: "6 4",
                  }}
                  eventHandlers={readOnly ? undefined : { click: () => setSponsorGap(g) }}
                >
                  <Tooltip direction="top" offset={[0, -12]}>
                    <div className="font-body text-xs">
                      <p className="text-sm font-semibold">{g.region}</p>
                      <p className="text-muted-foreground">{TIER_LABELS[g.priorityTier]}</p>
                      <p>
                        Risk: <span className="font-medium">{g.avgRiskScore}</span>
                        {" | "}
                        Gap: <span className="font-medium">{g.avgServiceGap}</span>
                      </p>
                      {!readOnly && <p className="mt-0.5 font-medium text-accent">Click to sponsor</p>}
                    </div>
                  </Tooltip>
                </CircleMarker>
              ))}
            </MapContainer>

            <div className="absolute bottom-3 left-3 z-[1000] bg-card/95 backdrop-blur-sm rounded-lg shadow-elevated p-3 border border-border text-[10px] space-y-1.5">
              <p className="font-heading font-bold text-xs mb-1">Coverage Gaps</p>
              {(["critical", "high", "moderate"] as const).map((tier) => (
                <div key={tier} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full border-2"
                    style={{
                      borderColor: TIER_COLORS[tier],
                      backgroundColor: `${TIER_COLORS[tier]}40`,
                    }}
                  />
                  <span className="font-body text-xs text-muted-foreground">
                    {TIER_LABELS[tier]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {gaps.slice(0, 4).map((g) => {
              const Tag = readOnly ? "div" : "button";
              return (
                <Tag
                  key={g.region}
                  {...(!readOnly && { onClick: () => setSponsorGap(g) })}
                  className={cn(
                    "rounded-2xl border border-border bg-secondary/70 p-5 text-left transition-all",
                    !readOnly && "group cursor-pointer hover:border-accent/40 hover:shadow-soft"
                  )}
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-2 flex items-center gap-1.5">
                        <AlertTriangle
                          className="h-4 w-4"
                          style={{ color: TIER_COLORS[g.priorityTier] }}
                        />
                        <span
                          className="font-body text-xs font-bold uppercase tracking-[0.18em]"
                          style={{ color: TIER_COLORS[g.priorityTier] }}
                        >
                          {TIER_LABELS[g.priorityTier]}
                        </span>
                      </div>
                      <p className="font-heading text-xl font-bold text-foreground">{g.region}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Risk Score
                      </p>
                      <p className="font-heading text-3xl font-bold text-foreground">{g.avgRiskScore}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-border bg-card px-3 py-3">
                      <p className="font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Uncovered
                      </p>
                      <p className="mt-1 font-heading text-2xl font-bold text-foreground">
                        {g.uncoveredProvinceCount}
                      </p>
                      <p className="mt-1 font-body text-xs text-muted-foreground">
                        of {g.totalProvinceCount} provinces
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-card px-3 py-3">
                      <p className="font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Service Gap
                      </p>
                      <p className="mt-1 font-heading text-2xl font-bold text-foreground">
                        {g.avgServiceGap}
                      </p>
                      <p className="mt-1 font-body text-xs text-muted-foreground">
                        support access score
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-card px-3 py-3">
                      <p className="font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Incidents
                      </p>
                      <p className="mt-1 font-heading text-2xl font-bold text-foreground">
                        {g.totalIncidents.toLocaleString()}
                      </p>
                      <p className="mt-1 font-body text-xs text-muted-foreground">
                        documented cases
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border/80 pt-4">
                    <p className="font-body text-sm text-muted-foreground">
                      Population affected:{" "}
                      <span className="font-semibold text-foreground">
                        {g.totalPopulation.toLocaleString()}
                      </span>
                    </p>
                    {!readOnly && (
                      <span className="font-body text-sm font-semibold text-accent opacity-0 transition-opacity group-hover:opacity-100">
                        Sponsor &rarr;
                      </span>
                    )}
                  </div>
                </Tag>
              );
            })}
          </div>

          {gaps.length > 4 && (
            <p className="text-center font-body text-sm text-muted-foreground">
              + {gaps.length - 4} more zone{gaps.length - 4 > 1 ? "s" : ""} need coverage
            </p>
          )}
        </div>
      )}

      {!readOnly && sponsorGap && (
        <SponsorModal
          gap={sponsorGap}
          onClose={() => setSponsorGap(null)}
          onDonate={handleDonate}
          donating={donating}
        />
      )}
    </div>
  );
}
