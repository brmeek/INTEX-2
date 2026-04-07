import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Anchor, ArrowRight, BarChart3, Heart, LineChart, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
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

const DonorPortalPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(100);
  const [customAmount, setCustomAmount] = useState("");
  const [isMonthly, setIsMonthly] = useState(true);
  const [donating, setDonating] = useState(false);
  const [summary, setSummary] = useState<DonorSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const isAdmin = useMemo(() => user?.roles.includes("Admin"), [user?.roles]);
  const donorDisplayName = useMemo(() => {
    if (!user?.email) return "Donor";
    const localPart = user.email.split("@")[0] ?? "";
    if (!localPart) return "Donor";
    return localPart
      .split(/[._-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }, [user?.email]);
  const donationAmount = selectedAmount ?? (customAmount ? Number(customAmount) : null);
  const organizationTotal = summary?.organizationTotalThisYear ?? 0;
  const donorTotal = summary?.donorTotalThisYear ?? 0;
  const totalProgressPercent = Math.min(100, Math.round(((organizationTotal / annualOkrTarget) * 100) || 0));
  const donorProgressPercent = Math.min(100, Math.round(((donorTotal / annualOkrTarget) * 100) || 0));
  const circleRadius = 52;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const totalDash = `${(totalProgressPercent / 100) * circleCircumference} ${circleCircumference}`;
  const donorDash = `${(donorProgressPercent / 100) * circleCircumference} ${circleCircumference}`;

  if (!user) {
    navigate("/donor/login");
    return null;
  }

  if (isAdmin) {
    navigate("/admin");
    return null;
  }

  const handleLogout = async () => {
    await logout();
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

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

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
            { title: "This Year", value: "$2,400", icon: Heart, note: "Total contributed" },
            { title: "Monthly Streak", value: "8 months", icon: LineChart, note: "Consistent giving" },
            { title: "Programs Funded", value: "3", icon: BarChart3, note: "Safe homes, counseling, education" },
          ].map((item) => (
            <div key={item.title} className="bg-white border border-border rounded-xl p-5 shadow-soft">
              <item.icon className="h-5 w-5 text-accent mb-3" />
              <p className="font-body text-xs uppercase tracking-widest text-muted-foreground">{item.title}</p>
              <p className="font-heading text-2xl font-bold text-foreground mt-1">{item.value}</p>
              <p className="font-body text-xs text-muted-foreground mt-1">{item.note}</p>
            </div>
          ))}
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

        <section className="bg-secondary border border-border rounded-xl p-4 flex items-start gap-3">
          <ShieldCheck className="h-4 w-4 text-accent mt-0.5" />
          <p className="font-body text-xs text-muted-foreground">
            Access is role-restricted. Donor accounts can only access donor portal features and cannot view staff admin data.
          </p>
        </section>
      </main>
    </div>
  );
};

export default DonorPortalPage;
