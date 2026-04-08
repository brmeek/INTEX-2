import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface DonationTrend { year: number; month: number; total: number; count: number }
interface SafehousePerf { safehouseId: number; safehouseName: string; region: string; capacity: number; residentCount: number; activeResidents: number }
interface OutcomeData { byStatus: { status: string; count: number }[]; byCategory: { category: string; count: number }[]; reintegrationRate: number }
interface RegionalRiskItem { region: string; risk_score: number; source_pipeline?: string; updated_at?: string }
interface LiveHeatmapData { regions: RegionalRiskItem[]; last_updated?: string }

const COLORS = ["#2B4570", "#3D8B8B", "#E07A5F", "#D4B896", "#8BA58E", "#5B7B9A", "#C49A6C"];

const ReportsPage = () => {
  const [trends, setTrends] = useState<DonationTrend[]>([]);
  const [safehouses, setSafehouses] = useState<SafehousePerf[]>([]);
  const [outcomes, setOutcomes] = useState<OutcomeData | null>(null);
  const [liveHeatmap, setLiveHeatmap] = useState<LiveHeatmapData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<DonationTrend[]>("/api/reports/donation-trends"),
      api.get<SafehousePerf[]>("/api/reports/safehouse-performance"),
      api.get<OutcomeData>("/api/reports/resident-outcomes"),
    ])
      .then(([t, s, o]) => { setTrends(t); setSafehouses(s); setOutcomes(o); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadLiveHeatmap = () => {
      api.get<LiveHeatmapData>("/api/heatmap/live")
        .then((data) => {
          if (mounted) setLiveHeatmap(data);
        })
        .catch(() => {});
    };

    loadLiveHeatmap();
    const intervalId = window.setInterval(loadLiveHeatmap, 60_000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const trendData = trends.map((t) => ({
    label: `${t.year}-${String(t.month).padStart(2, "0")}`,
    total: Math.round(t.total),
    count: t.count,
  }));

  const getRiskBand = (riskScore: number) => {
    if (riskScore >= 80) return { label: "Very High", color: "bg-red-600" };
    if (riskScore >= 60) return { label: "High", color: "bg-orange-500" };
    if (riskScore >= 40) return { label: "Moderate", color: "bg-yellow-500" };
    return { label: "Low", color: "bg-emerald-600" };
  };

  return (
    <AdminLayout title="Reports & Analytics" subtitle="Aggregated insights and trends">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Donation Trends */}
          <div className="bg-white rounded-xl p-6 shadow-soft border border-border">
            <h3 className="font-heading text-lg font-bold text-foreground mb-4">Donation Trends Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#2B4570" strokeWidth={2} name="Amount (₱)" dot={false} />
                <Line type="monotone" dataKey="count" stroke="#3D8B8B" strokeWidth={2} name="# Donations" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Status Pie */}
            {outcomes && (
              <div className="bg-white rounded-xl p-6 shadow-soft border border-border">
                <h3 className="font-heading text-lg font-bold text-foreground mb-1">Residents by Status</h3>
                <p className="font-body text-xs text-muted-foreground mb-4">Reintegration rate: {outcomes.reintegrationRate}%</p>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={outcomes.byStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} label={({ status, count }) => `${status}: ${count}`} labelLine={false}>
                      {outcomes.byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Category Bar */}
            {outcomes && (
              <div className="bg-white rounded-xl p-6 shadow-soft border border-border">
                <h3 className="font-heading text-lg font-bold text-foreground mb-4">Residents by Case Category</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={outcomes.byCategory} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="category" type="category" tick={{ fontSize: 10 }} width={120} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3D8B8B" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Safehouse Performance */}
          <div className="bg-white rounded-xl p-6 shadow-soft border border-border">
            <h3 className="font-heading text-lg font-bold text-foreground mb-4">Safehouse Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Safehouse</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Region</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Capacity</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Residents</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Occupancy</th>
                  </tr>
                </thead>
                <tbody>
                  {safehouses.map((s) => (
                    <tr key={s.safehouseId} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-body text-sm font-medium">{s.safehouseName || `Safehouse ${s.safehouseId}`}</td>
                      <td className="px-4 py-3 font-body text-sm text-muted-foreground">{s.region || "—"}</td>
                      <td className="px-4 py-3 font-body text-sm">{s.capacity || "—"}</td>
                      <td className="px-4 py-3 font-body text-sm">{s.residentCount}</td>
                      <td className="px-4 py-3 font-body text-sm font-semibold text-accent">{s.activeResidents}</td>
                      <td className="px-4 py-3">
                        {s.capacity ? (
                          <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 rounded-full bg-muted max-w-[100px]">
                              <div className="h-full rounded-full bg-teal" style={{ width: `${Math.min(100, (s.residentCount / s.capacity) * 100)}%` }} />
                            </div>
                            <span className="font-body text-xs text-muted-foreground">{Math.round((s.residentCount / s.capacity) * 100)}%</span>
                          </div>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Regional Abuse Risk (Phase 1) */}
          <div className="bg-white rounded-xl p-6 shadow-soft border border-border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <h3 className="font-heading text-lg font-bold text-foreground">Live Regional Abuse Risk (Phase 1)</h3>
              <p className="font-body text-xs text-muted-foreground">
                Last updated: {liveHeatmap?.last_updated ? new Date(liveHeatmap.last_updated).toLocaleString() : "No updates yet"}
              </p>
            </div>

            {!liveHeatmap?.regions?.length ? (
              <p className="font-body text-sm text-muted-foreground">
                No live risk data available yet. Once the 5-minute backend sync runs, regions will appear here.
              </p>
            ) : (
              <div className="space-y-3">
                {liveHeatmap.regions.map((r) => {
                  const riskBand = getRiskBand(r.risk_score);
                  return (
                    <div key={r.region} className="rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-body text-sm font-semibold text-foreground">{r.region}</p>
                          <p className="font-body text-xs text-muted-foreground">{riskBand.label} Risk</p>
                        </div>
                        <p className="font-heading text-xl font-bold text-foreground">{Math.round(r.risk_score)}</p>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-muted">
                        <div
                          className={`h-2 rounded-full ${riskBand.color}`}
                          style={{ width: `${Math.max(0, Math.min(100, r.risk_score))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ReportsPage;
