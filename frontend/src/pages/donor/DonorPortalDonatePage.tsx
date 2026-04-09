import { useCallback, useEffect, useState } from "react";
import { ArrowRight, BarChart3, Heart, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

const donationAmounts = [25, 50, 100, 250, 500];
const annualOkrTarget = 5000;

interface DonorSummary {
  year: number;
  donorTotalThisYear: number;
  organizationTotalThisYear: number;
  lifetimeTotal: number;
  donationCountThisYear: number;
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

export default function DonorPortalDonatePage() {
  const { authSession, isAuthenticated } = useAuth();
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

  const donationAmount = selectedAmount ?? (customAmount ? Number(customAmount) : null);
  const organizationTotal = summary?.organizationTotalThisYear ?? 0;
  const donorTotal = summary?.donorTotalThisYear ?? 0;
  const totalProgressPercent = Math.min(100, Math.round(((organizationTotal / annualOkrTarget) * 100) || 0));
  const donorProgressPercent = Math.min(100, Math.round(((donorTotal / annualOkrTarget) * 100) || 0));
  const circleRadius = 52;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const totalDash = `${(totalProgressPercent / 100) * circleCircumference} ${circleCircumference}`;
  const donorDash = `${(donorProgressPercent / 100) * circleCircumference} ${circleCircumference}`;

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

  const loadRecentDonations = useCallback(
    async (showErrorToast = false) => {
      setRecentDonationsLoading(true);
      setRecentDonationsError(null);
      try {
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
    },
    [toast]
  );

  useEffect(() => {
    if (!isAuthenticated || !authSession?.email) return;
    loadSummary();
    loadRecentDonations();
  }, [authSession?.email, isAuthenticated, loadSummary, loadRecentDonations]);

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
    <div className="space-y-6">
      <section className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
          <h2 className="font-heading text-xl font-bold text-foreground mb-2">Make a donation</h2>
          <p className="font-body text-sm text-muted-foreground mb-4">Give directly from your donor dashboard.</p>
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
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
            {donationAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
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

        <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
          <h2 className="font-heading text-xl font-bold text-foreground mb-2">Donation trends</h2>
          <p className="font-body text-sm text-muted-foreground mb-4">OKR metric updates from your donor account activity.</p>
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

                <div className="space-y-2 min-w-0">
                  <p className="font-body text-xs uppercase tracking-widest text-muted-foreground">
                    {summary?.year ?? new Date().getFullYear()} annual giving OKR
                  </p>
                  <p className="font-heading text-3xl font-bold text-foreground">${organizationTotal.toLocaleString()}</p>
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

      <section className="bg-card border border-border rounded-2xl p-6 shadow-soft">
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
                  <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Frequency
                  </th>
                  <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Channel
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentDonations.map((donation) => (
                  <tr
                    key={donation.donationId}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-body text-sm">{donation.donationDate ?? "-"}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-body px-2 py-1 rounded-full bg-secondary">{donation.donationType}</span>
                    </td>
                    <td className="px-4 py-3 font-body text-sm font-semibold text-foreground">
                      ${donation.amount.toLocaleString()}
                    </td>
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
          <div key={item.title} className="bg-card border border-border rounded-xl p-5 shadow-soft">
            <item.icon className="h-5 w-5 text-accent mb-3" />
            <p className="font-body text-xs uppercase tracking-widest text-muted-foreground">{item.title}</p>
            <p className="font-heading text-2xl font-bold text-foreground mt-1">{item.value}</p>
            <p className="font-body text-xs text-muted-foreground mt-1">{item.note}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
