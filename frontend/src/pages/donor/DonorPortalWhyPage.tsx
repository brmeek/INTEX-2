import { useCallback, useEffect, useState } from "react";
import { Activity, Anchor, BookOpen, Megaphone, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
interface DonorImpactForecastResponse {
  estimatedResidentsSupportedThisMonth: number;
  estimatedAllocationPhp: {
    education: number;
    wellbeing: number;
    operations: number;
    outreach: number;
  };
  topArea: string;
  impactMessage: string;
  modelVersion: string;
}

function formatPeso(value: number): string {
  return `₱${value.toFixed(2)}`;
}

export default function DonorPortalWhyPage() {
  const { isAuthenticated } = useAuth();
  const [isMonthly, setIsMonthly] = useState(true);
  const [impactForecast, setImpactForecast] = useState<DonorImpactForecastResponse | null>(null);
  const [impactLoading, setImpactLoading] = useState(false);
  const [hypotheticalAmount, setHypotheticalAmount] = useState("100");

  const parsedAmount = hypotheticalAmount ? Number(hypotheticalAmount) : null;
  const forecastAmount =
    parsedAmount && Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : null;

  const totalAllocation =
    (impactForecast?.estimatedAllocationPhp.education ?? 0) +
    (impactForecast?.estimatedAllocationPhp.wellbeing ?? 0) +
    (impactForecast?.estimatedAllocationPhp.operations ?? 0) +
    (impactForecast?.estimatedAllocationPhp.outreach ?? 0);

  const allocationSegments = [
    {
      key: "education",
      label: "Education",
      icon: BookOpen,
      color: "bg-indigo-500",
      value: impactForecast?.estimatedAllocationPhp.education ?? 0,
    },
    {
      key: "wellbeing",
      label: "Wellbeing",
      icon: Activity,
      color: "bg-emerald-500",
      value: impactForecast?.estimatedAllocationPhp.wellbeing ?? 0,
    },
    {
      key: "operations",
      label: "Operations",
      icon: Anchor,
      color: "bg-sky-500",
      value: impactForecast?.estimatedAllocationPhp.operations ?? 0,
    },
    {
      key: "outreach",
      label: "Outreach",
      icon: Megaphone,
      color: "bg-amber-500",
      value: impactForecast?.estimatedAllocationPhp.outreach ?? 0,
    },
  ];

  const loadImpactForecast = useCallback(async (amount: number, recurring: boolean) => {
    if (!amount || amount <= 0) {
      setImpactForecast(null);
      return;
    }

    setImpactLoading(true);
    try {
      const data = await api.post<DonorImpactForecastResponse>("/api/donations/self-serve/impact-forecast", {
        amount,
        isRecurring: recurring,
        channelSource: "Donor Portal",
        campaignName: "Donor Portal",
        currencyCode: "PHP",
      });
      setImpactForecast(data);
    } catch {
      setImpactForecast(null);
    } finally {
      setImpactLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!forecastAmount || forecastAmount <= 0) {
      setImpactForecast(null);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      loadImpactForecast(forecastAmount, isMonthly);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [forecastAmount, isMonthly, isAuthenticated, loadImpactForecast]);

  return (
    <div className="space-y-6">
      <section className="bg-card border border-border rounded-2xl p-6 shadow-soft">
        <p className="font-body text-sm text-muted-foreground mb-6 max-w-2xl">
          Explore how gifts support residents. Adjust the amount and frequency to preview estimated impact—then switch to
          the Donate tab when you are ready to give. To sponsor coverage in a specific province, open{" "}
          <span className="font-medium text-foreground">Sponsor a province</span> in the sidebar.
        </p>

        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent shrink-0" aria-hidden />
              Donation impact forecaster
            </h2>
            <p className="font-body text-sm text-muted-foreground">
              See how donations can make a change based on historical allocation patterns.
            </p>
          </div>
          {impactForecast?.modelVersion && (
            <span className="font-body text-[11px] px-2 py-1 rounded-full bg-secondary text-muted-foreground shrink-0">
              {impactForecast.modelVersion}
            </span>
          )}
        </div>

        <div className="flex gap-1 p-1 bg-secondary rounded-full w-fit mb-4">
          <button
            type="button"
            onClick={() => setIsMonthly(true)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-body font-semibold transition-all",
              isMonthly ? "bg-navy text-white shadow-soft" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setIsMonthly(false)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-body font-semibold transition-all",
              !isMonthly ? "bg-navy text-white shadow-soft" : "text-muted-foreground hover:text-foreground"
            )}
          >
            One-Time
          </button>
        </div>

        <div className="bg-secondary rounded-xl border border-border p-3 mb-4">
          <p className="font-body text-xs uppercase tracking-widest text-muted-foreground mb-2">Gift amount (PHP)</p>
          <input
            type="number"
            min={1}
            placeholder="e.g., 250"
            value={hypotheticalAmount}
            onChange={(event) => setHypotheticalAmount(event.target.value)}
            className="w-full sm:w-56 px-3 py-2 rounded-lg border border-border bg-background font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
          />
          <p className="font-body text-xs text-muted-foreground mt-2">
            This preview does not record a donation. Use the Donate tab to complete a gift.
          </p>
        </div>

        {!forecastAmount || forecastAmount <= 0 ? (
          <p className="font-body text-sm text-muted-foreground">
            Enter a positive amount to preview where your gift is most likely to help.
          </p>
        ) : impactLoading ? (
          <p className="font-body text-sm text-muted-foreground">Calculating your impact forecast...</p>
        ) : !impactForecast ? (
          <p className="font-body text-sm text-muted-foreground">Forecast unavailable right now. Please try again.</p>
        ) : (
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-3">
              <div className="bg-secondary rounded-xl p-4 border border-border">
                <p className="font-body text-xs uppercase tracking-widest text-muted-foreground">Estimated residents helped</p>
                <p className="font-heading text-3xl font-bold text-foreground mt-1">
                  {impactForecast.estimatedResidentsSupportedThisMonth.toFixed(2)}
                </p>
              </div>
              <div className="bg-secondary rounded-xl p-4 border border-border md:col-span-2">
                <p className="font-body text-xs uppercase tracking-widest text-muted-foreground">Most likely top impact area</p>
                <p className="font-heading text-2xl font-bold text-foreground mt-1 capitalize">{impactForecast.topArea}</p>
                <p className="font-body text-xs text-muted-foreground mt-1">{impactForecast.impactMessage}</p>
              </div>
            </div>

            <div>
              <p className="font-body text-xs uppercase tracking-widest text-muted-foreground mb-2">Estimated allocation mix</p>
              <div className="h-4 w-full rounded-full overflow-hidden bg-secondary border border-border flex">
                {allocationSegments.map((segment) => {
                  const widthPercent = totalAllocation > 0 ? (segment.value / totalAllocation) * 100 : 0;
                  return (
                    <div
                      key={segment.key}
                      className={`${segment.color} transition-all duration-500`}
                      style={{ width: `${widthPercent}%` }}
                      title={`${segment.label}: ${formatPeso(segment.value)}`}
                    />
                  );
                })}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {allocationSegments.map((segment) => {
                const Icon = segment.icon;
                const share = totalAllocation > 0 ? (segment.value / totalAllocation) * 100 : 0;
                return (
                  <div key={segment.key} className="border border-border rounded-xl p-3 bg-secondary">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                      <p className="font-body text-xs uppercase tracking-widest text-muted-foreground">{segment.label}</p>
                    </div>
                    <p className="font-heading text-lg font-bold text-foreground">{formatPeso(segment.value)}</p>
                    <p className="font-body text-xs text-muted-foreground">{share.toFixed(1)}% of this gift</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
