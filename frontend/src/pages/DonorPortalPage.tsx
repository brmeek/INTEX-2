import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Activity, Anchor, ArrowRight, BarChart3, BookOpen, Heart, LineChart, LogOut, Megaphone, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { logoutUser } from "@/lib/authApi";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import CoverageGapFinder from "@/components/donor/CoverageGapFinder";

const donationAmounts = [25, 50, 100, 250, 500];
const annualOkrTarget = 5000;

interface DonorSummary {
  year: number;
  donorTotalThisYear: number;
  organizationTotalThisYear: number;
  lifetimeTotal: number;
  donationCountThisYear: number;
}

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

interface DonorRecentDonation {
  donationId: number;
  donationType: string;
  donationDate: string | null;
  amount: number;
  isRecurring: boolean;
  channelSource: string;
  campaignName: string;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unable to load recent donations.";
}

const DonorPortalPage = () => {
  const { authSession, isAuthenticated, refreshAuthSession } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(100);
  const [customAmount, setCustomAmount] = useState("");
  const [isMonthly, setIsMonthly] = useState(true);
  const [donating, setDonating] = useState(false);
  const [summary, setSummary] = useState<DonorSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [recentDonations, setRecentDonations] = useState<DonorRecentDonation[]>([]);
  const [recentDonationsLoading, setRecentDonationsLoading] = useState(true);
  const [recentDonationsError, setRecentDonationsError] = useState<string | null>(null);
  const [impactForecast, setImpactForecast] = useState<DonorImpactForecastResponse | null>(null);
  const [impactLoading, setImpactLoading] = useState(false);
  const [hypotheticalAmount, setHypotheticalAmount] = useState("");

  const donorDisplayName = useMemo(() => {
    if (!authSession?.email) return "Donor";
    const localPart = authSession.email.split("@")[0] ?? "";
    if (!localPart) return "Donor";
    return localPart
      .split(/[._-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }, [authSession?.email]);
  const donationAmount = selectedAmount ?? (customAmount ? Number(customAmount) : null);
  const parsedHypotheticalAmount = hypotheticalAmount ? Number(hypotheticalAmount) : null;
  const forecastAmount =
    parsedHypotheticalAmount && Number.isFinite(parsedHypotheticalAmount) && parsedHypotheticalAmount > 0
      ? parsedHypotheticalAmount
      : donationAmount;
  const organizationTotal = summary?.organizationTotalThisYear ?? 0;
  const donorTotal = summary?.donorTotalThisYear ?? 0;
  const totalProgressPercent = Math.min(100, Math.round(((organizationTotal / annualOkrTarget) * 100) || 0));
  const donorProgressPercent = Math.min(100, Math.round(((donorTotal / annualOkrTarget) * 100) || 0));
  const circleRadius = 52;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const totalDash = `${(totalProgressPercent / 100) * circleCircumference} ${circleCircumference}`;
  const donorDash = `${(donorProgressPercent / 100) * circleCircumference} ${circleCircumference}`;
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

  const handleLogout = async () => {
    await logoutUser();
    await refreshAuthSession();
    navigate("/donor/login");
  };

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const data = await api.get<DonorSummary>("/api/donations/self-serve/summary");
      setSummary(data);
    } catch {
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const loadRecentDonations = useCallback(async (showErrorToast = false) => {
    setRecentDonationsLoading(true);
    setRecentDonationsError(null);
    try {
      console.info("[DonorPortal] Loading recent donations from /api/donations/self-serve/recent?take=10");
      const data = await api.get<DonorRecentDonation[]>("/api/donations/self-serve/recent?take=10");
      setRecentDonations(data);
    } catch (error) {
      const message = getErrorMessage(error);
      setRecentDonationsError(message);
      setRecentDonations([]);
      if (showErrorToast) {
        toast({
          title: "Recent Donations Error",
          description: message,
          variant: "destructive",
        });
      }
    } finally {
      setRecentDonationsLoading(false);
    }
  }, [toast]);

  const loadImpactForecast = useCallback(
    async (amount: number, recurring: boolean) => {
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
          currencyCode: "USD",
        });
        setImpactForecast(data);
      } catch {
        setImpactForecast(null);
      } finally {
        setImpactLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!isAuthenticated || !authSession?.email) return;
    loadSummary();
    loadRecentDonations();
  }, [authSession?.email, isAuthenticated, loadSummary, loadRecentDonations]);

  useEffect(() => {
    if (!forecastAmount || forecastAmount <= 0) {
      setImpactForecast(null);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      loadImpactForecast(forecastAmount, isMonthly);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [forecastAmount, isMonthly, loadImpactForecast]);

  if (!isAuthenticated) return <Navigate to="/donor/login" replace />;

  const handleDonate = async () => {
    if (!donationAmount || donationAmount <= 0) return;
    setDonating(true);
    try {
      await api.post("/api/donations/self-serve", {
        amount: donationAmount,
        isRecurring: isMonthly,
      });
      toast({
        title: "Donation recorded",
        description: `Thank you! Your ${isMonthly ? "monthly" : "one-time"} gift of $${donationAmount} was saved.`,
      });
      await loadSummary();
      await loadRecentDonations(true);
      setCustomAmount("");
      setSelectedAmount(100);
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

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-navy text-white border-b border-white/10">
        <div className="container h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Anchor className="h-6 w-6 text-teal-light" />
            <div>
              <p className="font-heading text-lg font-bold">Hope Harbor</p>
              <p className="font-body text-xs text-white/50">Donor Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
                Public Site
              </Button>
            </Link>
            <Button onClick={handleLogout} size="sm" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
              <LogOut className="mr-1 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-6">
        <section className="bg-white border border-border rounded-2xl p-6 shadow-soft">
          <h1 className="font-heading text-3xl font-bold text-foreground">Welcome back, {donorDisplayName}</h1>
        </section>

        <section className="grid md:grid-cols-3 gap-4">
          {[
            {
              title: "This Year",
              value: summaryLoading ? "Loading..." : `$${(summary?.donorTotalThisYear ?? 0).toLocaleString()}`,
              icon: Heart,
              note: "Total contributed by you",
            },
            {
              title: "Donations This Year",
              value: summaryLoading ? "Loading..." : `${(summary?.donationCountThisYear ?? 0).toLocaleString()}`,
              icon: LineChart,
              note: "Recorded donations this year",
            },
            {
              title: "Lifetime Giving",
              value: summaryLoading ? "Loading..." : `$${(summary?.lifetimeTotal ?? 0).toLocaleString()}`,
              icon: BarChart3,
              note: "All-time amount contributed",
            },
          ].map((item) => (
            <div key={item.title} className="bg-white border border-border rounded-xl p-5 shadow-soft">
              <item.icon className="h-5 w-5 text-accent mb-3" />
              <p className="font-body text-xs uppercase tracking-widest text-muted-foreground">{item.title}</p>
              <p className="font-heading text-2xl font-bold text-foreground mt-1">{item.value}</p>
              <p className="font-body text-xs text-muted-foreground mt-1">{item.note}</p>
            </div>
          ))}
        </section>

        <section className="bg-white border border-border rounded-2xl p-6 shadow-soft">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="font-heading text-xl font-bold text-foreground">Recent donations</h2>
            <div className="flex items-center gap-3">
              <p className="font-body text-xs text-muted-foreground">Latest 10 contributions</p>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => loadRecentDonations(true)}>
                Refresh
              </Button>
            </div>
          </div>
          {recentDonationsLoading ? (
            <p className="font-body text-sm text-muted-foreground">Loading recent donations...</p>
          ) : recentDonationsError ? (
            <div className="space-y-2">
              <p className="font-body text-sm text-destructive">
                Failed to load recent donations: {recentDonationsError}
              </p>
              <p className="font-body text-xs text-muted-foreground">
                Check browser network for `GET /api/donations/self-serve/recent?take=10`.
              </p>
            </div>
          ) : recentDonations.length === 0 ? (
            <p className="font-body text-sm text-muted-foreground">No donations recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Frequency</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Channel</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDonations.map((donation) => (
                    <tr key={donation.donationId} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-body text-sm">
                        {donation.donationDate ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-body px-2 py-1 rounded-full bg-secondary">{donation.donationType}</span>
                      </td>
                      <td className="px-4 py-3 font-body text-sm font-semibold text-foreground">${donation.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 font-body text-sm text-muted-foreground">
                        {donation.isRecurring ? "Monthly" : "One-Time"}
                      </td>
                      <td className="px-4 py-3 font-body text-sm text-muted-foreground">{donation.channelSource}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white border border-border rounded-2xl p-6 shadow-soft">
            <h2 className="font-heading text-xl font-bold text-foreground mb-2">Make a donation</h2>
            <p className="font-body text-sm text-muted-foreground mb-4">
              Give directly from your donor dashboard.
            </p>
            <div className="flex gap-1 p-1 bg-secondary rounded-full w-fit mb-4">
              <button
                onClick={() => setIsMonthly(true)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-body font-semibold transition-all",
                  isMonthly ? "bg-navy text-white shadow-soft" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsMonthly(false)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-body font-semibold transition-all",
                  !isMonthly ? "bg-navy text-white shadow-soft" : "text-muted-foreground hover:text-foreground"
                )}
              >
                One-Time
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {donationAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    setSelectedAmount(amt);
                    setCustomAmount("");
                  }}
                  className={cn(
                    "py-2.5 rounded-lg text-sm font-body font-semibold transition-all border",
                    selectedAmount === amt
                      ? "bg-navy text-white border-navy shadow-soft"
                      : "bg-secondary text-foreground border-border hover:border-navy/30"
                  )}
                >
                  ${amt}
                </button>
              ))}
            </div>
            <input
              type="number"
              placeholder="Custom amount"
              value={customAmount}
              min={1}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedAmount(null);
              }}
              className="w-full px-4 py-3 rounded-xl border border-border bg-secondary font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent mb-4"
            />
            <Button disabled={!donationAmount || donating} onClick={handleDonate} className="rounded-xl w-full">
              {donating ? "Processing..." : `Donate $${donationAmount ?? ""}${isMonthly ? " Monthly" : ""}`}
              {!donating && <ArrowRight className="ml-1 h-4 w-4" />}
            </Button>
          </div>

          <div className="bg-white border border-border rounded-2xl p-6 shadow-soft">
            <h2 className="font-heading text-xl font-bold text-foreground mb-2">Donation trends</h2>
            <p className="font-body text-sm text-muted-foreground mb-4">
              OKR metric updates from your donor account activity.
            </p>
            {summaryLoading ? (
              <p className="font-body text-sm text-muted-foreground">Loading your yearly total...</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-5">
                  <div className="relative h-32 w-32 shrink-0">
                    <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120" aria-hidden>
                      <circle cx="60" cy="60" r={circleRadius} fill="none" stroke="#E5E7EB" strokeWidth="10" />
                      <circle
                        cx="60"
                        cy="60"
                        r={circleRadius}
                        fill="none"
                        stroke="#3D8B8B"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={totalDash}
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r={circleRadius - 14}
                        fill="none"
                        stroke="#2B4570"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={donorDash}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="font-heading text-xl font-bold text-foreground">{totalProgressPercent}%</p>
                      <p className="font-body text-[10px] uppercase tracking-widest text-muted-foreground">to goal</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="font-body text-xs uppercase tracking-widest text-muted-foreground">
                      {summary?.year ?? new Date().getFullYear()} annual giving OKR
                    </p>
                    <p className="font-heading text-3xl font-bold text-foreground">
                      ${organizationTotal.toLocaleString()}
                    </p>
                    <p className="font-body text-xs text-muted-foreground">Goal ${annualOkrTarget.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#3D8B8B]" />
                    <p className="font-body text-xs text-muted-foreground">
                      Total donations (all donors): ${organizationTotal.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#2B4570]" />
                    <p className="font-body text-xs text-muted-foreground">
                      Your contribution: ${donorTotal.toLocaleString()} ({donorProgressPercent}% of goal)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="bg-white border border-border rounded-2xl p-6 shadow-soft">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                Your donation impact forecast
              </h2>
              <p className="font-body text-sm text-muted-foreground">
                Live estimate based on historical allocation patterns.
              </p>
            </div>
            {impactForecast?.modelVersion && (
              <span className="font-body text-[11px] px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                {impactForecast.modelVersion}
              </span>
            )}
          </div>

          <div className="bg-secondary rounded-xl border border-border p-3 mb-4">
            <p className="font-body text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Try a hypothetical gift amount
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <input
                type="number"
                min={1}
                placeholder="e.g., 250"
                value={hypotheticalAmount}
                onChange={(event) => setHypotheticalAmount(event.target.value)}
                className="w-full sm:w-56 px-3 py-2 rounded-lg border border-border bg-white font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              />
              <button
                type="button"
                onClick={() => setHypotheticalAmount("")}
                className="px-3 py-2 rounded-lg border border-border bg-white font-body text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Use current donation amount
              </button>
            </div>
            <p className="font-body text-xs text-muted-foreground mt-2">
              This preview does not change your selected donation until you click Donate.
            </p>
          </div>

          {!forecastAmount || forecastAmount <= 0 ? (
            <p className="font-body text-sm text-muted-foreground">
              Enter a donation amount to preview where your gift is most likely to help.
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
                        title={`${segment.label}: $${segment.value.toFixed(2)}`}
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
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <p className="font-body text-xs uppercase tracking-widest text-muted-foreground">{segment.label}</p>
                      </div>
                      <p className="font-heading text-lg font-bold text-foreground">${segment.value.toFixed(2)}</p>
                      <p className="font-body text-xs text-muted-foreground">{share.toFixed(1)}% of this gift</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <CoverageGapFinder />

        <section className="bg-secondary border border-border rounded-xl p-4 flex items-start gap-3">
          <ShieldCheck className="h-4 w-4 text-accent mt-0.5" />
          <p className="font-body text-xs text-muted-foreground">
            Access is role-restricted. Donor and staff accounts can use this portal, but staff-only admin dashboards remain separate.
          </p>
        </section>
      </main>
    </div>
  );
};

export default DonorPortalPage;
