import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { Users, Heart, Home, Calendar, DollarSign, ClipboardList, AlertTriangle, ArrowDownRight, ArrowUpRight, Clock3, Minus } from "lucide-react";

interface DashboardData {
  activeResidents: number;
  totalResidents: number;
  totalDonations: number;
  donationCount: number;
  safehouseCount: number;
  recentDonations: { donationId: number; donationType: string; amount: number | null; donationDate: string; supporter?: { supporterName: string } }[];
  atRiskDonors: { supporterId: number; supporterName: string | null; riskTier: "High" | "Medium" | "Low"; churnProbability: number; scoredAtUtc: string }[];
  upcomingConferences: { planId: number; planCategory: string; caseConferenceDate: string; resident?: { firstName: string; lastName: string } }[];
  safehouseEducationForecasts: {
    safehouseId: number;
    safehouseName: string | null;
    region: string | null;
    forecastForMonth: string;
    predictedEducationScore: number;
    latestObservedScore: number;
    previousObservedScore: number | null;
    trajectorySlope: number | null;
    historyMonthsUsed: number;
    alertFlag: boolean;
    alertReason: string;
    scoredAtUtc: string;
  }[];
  safehouseForecastEvaluation: {
    mae: number;
    rmse: number;
    observationCount: number;
    safehouseCount: number;
  };
}

const AdminDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingForecasts, setRefreshingForecasts] = useState(false);

  useEffect(() => {
    api.get<DashboardData>("/api/reports/dashboard").then((d) => {
      setData({
        ...d,
        recentDonations: d.recentDonations ?? [],
        atRiskDonors: d.atRiskDonors ?? [],
        upcomingConferences: d.upcomingConferences ?? [],
        safehouseEducationForecasts: d.safehouseEducationForecasts ?? [],
        safehouseForecastEvaluation: d.safehouseForecastEvaluation ?? { mae: 0, rmse: 0, observationCount: 0, safehouseCount: 0 },
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const refreshSafehouseForecasts = async () => {
    setRefreshingForecasts(true);
    try {
      await api.post("/api/reports/safehouse-education/refresh", {});
      const updated = await api.get<DashboardData>("/api/reports/dashboard");
      setData(updated);
    } catch {
      // Keep dashboard usable even if refresh fails.
    } finally {
      setRefreshingForecasts(false);
    }
  };

  const stats = data
    ? [
        { label: "Residents currently in care", value: data.activeResidents, icon: Users, color: "bg-teal text-white" },
        { label: "Total donations received (all time)", value: `₱${data.totalDonations.toLocaleString()}`, icon: DollarSign, color: "bg-coral text-white" },
        { label: "Number of donations recorded", value: data.donationCount, icon: Heart, color: "bg-navy text-white" },
        { label: "Safehouse locations", value: data.safehouseCount, icon: Home, color: "bg-accent text-white" },
        { label: "Residents served overall", value: data.totalResidents, icon: ClipboardList, color: "bg-navy-light text-white" },
      ]
    : [];

  const now = new Date();
  const daysAgo = (d: number) => {
    const x = new Date(now);
    x.setDate(x.getDate() - d);
    return x;
  };
  const withinDays = (value: string | undefined | null, d: number) => {
    if (!value) return false;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return false;
    return parsed >= daysAgo(d);
  };
  const between = (value: string | undefined | null, fromDaysAgo: number, toDaysAgo: number) => {
    if (!value) return false;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return false;
    const from = daysAgo(fromDaysAgo);
    const to = daysAgo(toDaysAgo);
    return parsed < to && parsed >= from;
  };

  const donationsLast30 = (data?.recentDonations ?? [])
    .filter((d) => withinDays(d.donationDate, 30))
    .reduce((sum, d) => sum + (d.amount ?? 0), 0);
  const donationsPrev30 = (data?.recentDonations ?? [])
    .filter((d) => between(d.donationDate, 60, 30))
    .reduce((sum, d) => sum + (d.amount ?? 0), 0);

  const donationsTrendPct =
    donationsPrev30 > 0 ? ((donationsLast30 - donationsPrev30) / donationsPrev30) * 100 : null;

  const highRiskDonorCount = (data?.atRiskDonors ?? []).filter((d) => d.riskTier === "High").length;
  const conferencesNext7Days = (data?.upcomingConferences ?? []).filter((c) => withinDays(c.caseConferenceDate, 7)).length;
  const safehouseAlerts = (data?.safehouseEducationForecasts ?? []).filter((f) => f.alertFlag).length;

  const TrendChip = ({ value, label }: { value: number | null; label: string }) => {
    if (value == null) {
      return <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-slate-100 text-slate-700"><Minus className="h-3 w-3" /> {label}: no baseline yet</span>;
    }
    if (value > 0.1) {
      return <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-emerald-100 text-emerald-700"><ArrowUpRight className="h-3 w-3" /> {label}: +{value.toFixed(1)}%</span>;
    }
    if (value < -0.1) {
      return <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-red-100 text-red-700"><ArrowDownRight className="h-3 w-3" /> {label}: {value.toFixed(1)}%</span>;
    }
    return <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-amber-100 text-amber-700"><Minus className="h-3 w-3" /> {label}: stable</span>;
  };

  const getForecastStatus = (forecast: DashboardData["safehouseEducationForecasts"][number]) => {
    const reason = (forecast.alertReason || "").toLowerCase();
    if (reason.includes("insufficient history")) {
      return {
        label: "Data Limited",
        className: "bg-slate-100 text-slate-700",
      };
    }
    if (forecast.alertFlag) {
      return {
        label: "At Risk",
        className: "bg-red-100 text-red-700",
      };
    }
    return {
      label: "On Track",
      className: "bg-emerald-100 text-emerald-700",
    };
  };

  return (
    <AdminLayout title="Dashboard" subtitle="Action-first view with plain-language performance trends">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-5 shadow-soft border border-border">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="font-heading text-lg font-bold text-foreground">Action needed now</h2>
                <p className="font-body text-xs text-muted-foreground">
                  Updated {new Date().toLocaleDateString()} - focus these first before reviewing totals.
                </p>
              </div>
              <TrendChip value={donationsTrendPct} label="Donations vs previous 30 days" />
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <div className="rounded-lg border border-border bg-secondary/50 p-3">
                <p className="font-body text-xs text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                  Donors who may stop giving
                </p>
                <p className="font-heading text-2xl font-bold text-foreground mt-1">{highRiskDonorCount}</p>
                <p className="font-body text-xs text-muted-foreground">High-priority follow-up list</p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/50 p-3">
                <p className="font-body text-xs text-muted-foreground flex items-center gap-1">
                  <Clock3 className="h-3.5 w-3.5 text-amber-600" />
                  Conferences due in next 7 days
                </p>
                <p className="font-heading text-2xl font-bold text-foreground mt-1">{conferencesNext7Days}</p>
                <p className="font-body text-xs text-muted-foreground">Prepare case notes and attendance</p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/50 p-3">
                <p className="font-body text-xs text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-coral" />
                  Safehouses with warning flags
                </p>
                <p className="font-heading text-2xl font-bold text-foreground mt-1">{safehouseAlerts}</p>
                <p className="font-body text-xs text-muted-foreground">Needs review for next-month outcomes</p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-end justify-between mb-2">
              <h3 className="font-heading text-base font-bold text-foreground">Program summary</h3>
              <p className="font-body text-xs text-muted-foreground">Totals and context (all-time unless noted)</p>
            </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-white rounded-xl p-5 shadow-soft border border-border">
                <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center mb-3`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <p className="font-heading text-2xl font-bold text-foreground">{s.value}</p>
                <p className="font-body text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-soft border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-lg font-bold text-foreground">Recent donations</h3>
                <TrendChip value={donationsTrendPct} label="30-day trend" />
              </div>
              {data.recentDonations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No donations recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {data.recentDonations.map((d) => (
                    <div key={d.donationId} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="font-body text-sm font-medium text-foreground">
                          {d.supporter?.supporterName || "Anonymous"}
                        </p>
                        <p className="font-body text-xs text-muted-foreground">{d.donationType} · {new Date(d.donationDate).toLocaleDateString()}</p>
                      </div>
                      {d.amount && (
                        <span className="font-body text-sm font-semibold text-foreground">
                          ₱{d.amount.toLocaleString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-soft border border-border">
              <h3 className="font-heading text-lg font-bold text-foreground mb-1">Donors needing follow-up</h3>
              <p className="font-body text-xs text-muted-foreground mb-4">
                Top donors most likely to stop giving based on recent behavior patterns.
              </p>
              {data.atRiskDonors.length === 0 ? (
                <p className="text-sm text-muted-foreground">No donors currently flagged for urgent follow-up.</p>
              ) : (
                <div className="space-y-3">
                  {data.atRiskDonors.map((d) => (
                    <div key={d.supporterId} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="font-body text-sm font-medium text-foreground">{d.supporterName || "Unknown donor"}</p>
                        <p className="font-body text-xs text-muted-foreground">Chance of donor drop-off: {(d.churnProbability * 100).toFixed(2)}%</p>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          d.riskTier === "High"
                            ? "bg-red-100 text-red-700"
                            : d.riskTier === "Medium"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {d.riskTier} Priority
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-soft border border-border">
              <h3 className="font-heading text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-accent" />
                Upcoming case conferences
              </h3>
              {data.upcomingConferences.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming conferences.</p>
              ) : (
                <div className="space-y-3">
                  {data.upcomingConferences.map((c) => (
                    <div key={c.planId} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="font-body text-sm font-medium text-foreground">
                          {c.resident?.firstName} {c.resident?.lastName}
                        </p>
                        <p className="font-body text-xs text-muted-foreground">{c.planCategory}</p>
                      </div>
                      <span className="font-body text-xs font-medium text-accent">{new Date(c.caseConferenceDate).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-soft border border-border">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="font-heading text-lg font-bold text-foreground">Next-month safehouse learning outlook</h3>
              <button
                onClick={refreshSafehouseForecasts}
                disabled={refreshingForecasts}
                className="px-3 py-2 rounded-lg border border-border bg-secondary text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-60"
              >
                {refreshingForecasts ? "Refreshing..." : "Refresh Forecasts"}
              </button>
            </div>

            <div className="mb-4 rounded-lg border border-border bg-muted/40 px-3 py-2">
              <p className="font-body text-xs text-muted-foreground">
                Forecast accuracy check: typical error is about
                {" "}<span className="font-semibold text-foreground">{data.safehouseForecastEvaluation.mae.toFixed(2)}</span> points
                {" "}across {data.safehouseForecastEvaluation.observationCount} historical predictions
                {" "}from {data.safehouseForecastEvaluation.safehouseCount} safehouses.
              </p>
              <p className="font-body text-xs text-muted-foreground mt-1">
                Status legend: <span className="font-semibold text-foreground">On Track</span> = no warning signs,
                <span className="font-semibold text-foreground"> At Risk</span> = low projected score or downward trend,
                <span className="font-semibold text-foreground"> Data Limited</span> = not enough history yet.
              </p>
            </div>

            {data.safehouseEducationForecasts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No safehouse forecasts available yet.</p>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {data.safehouseEducationForecasts.map((f) => (
                  <div key={f.safehouseId} className="rounded-xl border border-border p-4 bg-secondary/30">
                    {(() => {
                      const status = getForecastStatus(f);
                      return (
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-body text-sm font-semibold text-foreground">{f.safehouseName || `Safehouse ${f.safehouseId}`}</p>
                        <p className="font-body text-xs text-muted-foreground">{f.region || "Unknown region"} · For {new Date(f.forecastForMonth).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                      );
                    })()}

                    <div className="mt-3 space-y-1">
                      <p className="font-body text-sm">
                        Predicted learning progress score:{" "}
                        <span className="font-semibold">{f.predictedEducationScore.toFixed(2)}%</span>
                      </p>
                      <p className="font-body text-xs text-muted-foreground">
                        Latest observed: {f.latestObservedScore.toFixed(2)}%
                        {typeof f.previousObservedScore === "number" ? ` · Previous: ${f.previousObservedScore.toFixed(2)}%` : ""}
                      </p>
                      <p className="font-body text-xs text-muted-foreground">
                        Alert reason: {f.alertFlag ? f.alertReason : "None"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground">Failed to load dashboard data. Make sure the API is running.</p>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
