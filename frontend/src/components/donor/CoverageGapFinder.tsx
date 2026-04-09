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
      <div className="relative bg-white rounded-2xl shadow-elevated max-w-md w-full p-6 animate-fade-up">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: TIER_COLORS[gap.priorityTier] }}
          />
          <span className="font-body text-xs font-semibold uppercase tracking-wider" style={{ color: TIER_COLORS[gap.priorityTier] }}>
            {TIER_LABELS[gap.priorityTier]}
          </span>
        </div>
        <h3 className="font-heading text-xl font-bold text-foreground mb-1">
          Sponsor {gap.region}
        </h3>
        <p className="font-body text-sm text-muted-foreground mb-4">
          Help expand safehouse coverage to protect {gap.totalPopulation.toLocaleString()} people
          across {gap.uncoveredProvinceCount} uncovered province{gap.uncoveredProvinceCount !== 1 ? "s" : ""} in {gap.region}.
        </p>

        <div className="grid grid-cols-2 gap-2 mb-3">
          {presets.map((amt) => (
            <button
              key={amt}
              onClick={() => { setSelected(amt); setCustom(""); }}
              className={cn(
                "py-2.5 rounded-lg text-sm font-body font-semibold transition-all border",
                selected === amt
                  ? "bg-navy text-white border-navy shadow-soft"
                  : "bg-secondary text-foreground border-border hover:border-navy/30"
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
          onChange={(e) => { setCustom(e.target.value); setSelected(null); }}
          className="w-full px-4 py-3 rounded-xl border border-border bg-secondary font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent mb-4"
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
            {donating ? "Processing..." : (
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
  const [safehouses, setSafehouses] = useState<SafehouseApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [sponsorGap, setSponsorGap] = useState<CoverageGap | null>(null);
  const [donating, setDonating] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    api
      .get<SafehouseApi[]>("/api/Safehouses")
      .then(setSafehouses)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const coveredProvinces = useMemo(
    () => mapSafehousesToProvinces(safehouses),
    [safehouses]
  );

  const uncoveredCount = ALL_PROVINCES.length - coveredProvinces.size;

  const gaps = useMemo(() => computeCoverageGaps(coveredProvinces), [coveredProvinces]);

  const handleDonate = async (amount: number, region: string) => {
    setDonating(true);
    try {
      await api.post("/api/donations/self-serve", {
        amount,
        isRecurring: false,
        campaign: `Coverage Gap — ${region}`,
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
      <div className="bg-white border border-border rounded-2xl p-6 shadow-soft">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin h-6 w-6 border-4 border-accent border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-2xl shadow-soft overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-coral/10 flex items-center justify-center">
            <MapPin className="h-5 w-5 text-coral" />
          </div>
          <div className="text-left">
            <h2 className="font-heading text-lg font-bold text-foreground">Coverage Gap Finder</h2>
            <p className="font-body text-xs text-muted-foreground">
              {uncoveredCount} of {ALL_PROVINCES.length} provinces lack safehouse coverage
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-6 pb-6 space-y-4">
          {!readOnly && (
            <div className="bg-secondary/60 rounded-xl p-5 border border-border">
              <p className="font-body text-sm text-foreground mb-3">
                Each circle marks a zone with <span className="font-semibold">uncovered provinces</span> — the
                larger and redder it is, the more urgent the need. Click a circle or card to sponsor directly.
              </p>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="bg-white rounded-lg p-3 border border-border">
                  <p className="font-heading text-xs font-bold text-foreground mb-1">Risk Score</p>
                  <p className="font-body text-xs text-muted-foreground">
                    Composite vulnerability rating based on poverty, migration, and enforcement capacity.
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-border">
                  <p className="font-heading text-xs font-bold text-foreground mb-1">Service Gap</p>
                  <p className="font-body text-xs text-muted-foreground">
                    Availability of shelters, counseling, legal aid, and medical services for survivors.
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-border">
                  <p className="font-heading text-xs font-bold text-foreground mb-1">Why Sponsor?</p>
                  <p className="font-body text-xs text-muted-foreground">
                    Your gift funds a safehouse offering shelter, recovery programs, and a path to independence.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Map */}
          <div className="relative rounded-xl overflow-hidden border border-border" style={{ height: 380 }}>
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

              {/* Gap zones — pulsing circles */}
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
                  eventHandlers={readOnly ? {} : { click: () => setSponsorGap(g) }}
                >
                  <Tooltip direction="top" offset={[0, -12]}>
                    <div className="font-body text-xs">
                      <p className="font-semibold text-sm">{g.region}</p>
                      <p className="text-muted-foreground">{TIER_LABELS[g.priorityTier]}</p>
                      <p>Risk: <span className="font-medium">{g.avgRiskScore}</span> &middot; Gap: <span className="font-medium">{g.avgServiceGap}</span></p>
                      {!readOnly && <p className="text-accent mt-0.5 font-medium">Click to sponsor</p>}
                    </div>
                  </Tooltip>
                </CircleMarker>
              ))}

            </MapContainer>

            {/* Legend */}
            <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg shadow-elevated p-3 border border-border text-[10px] space-y-1.5">
              <p className="font-heading font-bold text-xs mb-1">Coverage Gaps</p>
              {(["critical", "high", "moderate"] as const).map((tier) => (
                <div key={tier} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: TIER_COLORS[tier], backgroundColor: `${TIER_COLORS[tier]}40` }} />
                  <span className="font-body text-muted-foreground">{TIER_LABELS[tier]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Gap cards */}
          <div className="grid sm:grid-cols-2 gap-3">
            {gaps.slice(0, 4).map((g) => {
              const Tag = readOnly ? "div" : "button";
              return (
                <Tag
                  key={g.region}
                  {...(!readOnly && { onClick: () => setSponsorGap(g) })}
                  className={cn(
                    "text-left bg-secondary rounded-xl p-4 border border-border transition-all",
                    !readOnly && "hover:border-accent/40 hover:shadow-soft group cursor-pointer"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <AlertTriangle className="h-3.5 w-3.5" style={{ color: TIER_COLORS[g.priorityTier] }} />
                        <span
                          className="font-body text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: TIER_COLORS[g.priorityTier] }}
                        >
                          {TIER_LABELS[g.priorityTier]}
                        </span>
                      </div>
                      <p className="font-heading text-sm font-bold text-foreground">{g.region}</p>
                    </div>
                    <p className="font-heading text-lg font-bold text-foreground">{g.avgRiskScore}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="font-body text-xs text-muted-foreground">
                      {g.uncoveredProvinceCount} of {g.totalProvinceCount} provinces uncovered &middot; {g.totalIncidents.toLocaleString()} incidents
                    </p>
                    {!readOnly && (
                      <span className="font-body text-xs text-accent font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        Sponsor &rarr;
                      </span>
                    )}
                  </div>
                </Tag>
              );
            })}
          </div>

          {gaps.length > 4 && (
            <p className="font-body text-xs text-center text-muted-foreground">
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
