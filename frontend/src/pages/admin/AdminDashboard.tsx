import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { Users, Heart, Home, Calendar, DollarSign, ClipboardList } from "lucide-react";

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
    api.get<DashboardData>("/api/reports/dashboard").then(setData).catch(() => {}).finally(() => setLoading(false));
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
        { label: "Active Residents", value: data.activeResidents, icon: Users, color: "bg-teal text-white" },
        { label: "Total Donations", value: `₱${data.totalDonations.toLocaleString()}`, icon: DollarSign, color: "bg-coral text-white" },
        { label: "Donation Count", value: data.donationCount, icon: Heart, color: "bg-navy text-white" },
        { label: "Safehouses", value: data.safehouseCount, icon: Home, color: "bg-accent text-white" },
        { label: "Total Residents Served", value: data.totalResidents, icon: ClipboardList, color: "bg-navy-light text-white" },
      ]
    : [];

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
    <AdminLayout title="Dashboard" subtitle="Overview of operations">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
        </div>
      ) : data ? (
        <div className="space-y-6">
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

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-soft border border-border">
              <h3 className="font-heading text-lg font-bold text-foreground mb-4">Recent Donations</h3>
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
                        <p className="font-body text-xs text-muted-foreground">{d.donationType} · {d.donationDate}</p>
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
              <h3 className="font-heading text-lg font-bold text-foreground mb-4">At-Risk Donors</h3>
              {data.atRiskDonors.length === 0 ? (
                <p className="text-sm text-muted-foreground">No at-risk donors flagged.</p>
              ) : (
                <div className="space-y-3">
                  {data.atRiskDonors.map((d) => (
                    <div key={d.supporterId} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="font-body text-sm font-medium text-foreground">{d.supporterName || "Unknown donor"}</p>
                        <p className="font-body text-xs text-muted-foreground">Churn probability: {(d.churnProbability * 100).toFixed(2)}%</p>
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
                        {d.riskTier} Risk
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-soft border border-border">
              <h3 className="font-heading text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-accent" />
                Upcoming Case Conferences
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
                      <span className="font-body text-xs font-medium text-accent">{c.caseConferenceDate}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-soft border border-border">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="font-heading text-lg font-bold text-foreground">Safehouse Education Forecast (Next Month)</h3>
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
                Backtest quality: MAE <span className="font-semibold text-foreground">{data.safehouseForecastEvaluation.mae.toFixed(2)}</span> points,
                RMSE <span className="font-semibold text-foreground">{data.safehouseForecastEvaluation.rmse.toFixed(2)}</span> points
                {" "}across {data.safehouseForecastEvaluation.observationCount} historical month-ahead forecasts
                (from {data.safehouseForecastEvaluation.safehouseCount} safehouses).
              </p>
              <p className="font-body text-xs text-muted-foreground mt-1">
                Status legend: <span className="font-semibold text-foreground">On Track</span> = no risk triggers,
                <span className="font-semibold text-foreground"> At Risk</span> = low projected score or declining trajectory,
                <span className="font-semibold text-foreground"> Data Limited</span> = insufficient history for trend confidence.
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
                        <p className="font-body text-xs text-muted-foreground">{f.region || "Unknown region"} · Forecast month: {f.forecastForMonth}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                      );
                    })()}

                    <div className="mt-3 space-y-1">
                      <p className="font-body text-sm">
                        Predicted education score:{" "}
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
