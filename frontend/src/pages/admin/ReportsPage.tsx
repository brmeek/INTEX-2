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

const COLORS = ["#2B4570", "#3D8B8B", "#E07A5F", "#D4B896", "#8BA58E", "#5B7B9A", "#C49A6C"];

const ReportsPage = () => {
  const [trends, setTrends] = useState<DonationTrend[]>([]);
  const [safehouses, setSafehouses] = useState<SafehousePerf[]>([]);
  const [outcomes, setOutcomes] = useState<OutcomeData | null>(null);
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

  const trendData = trends.map((t) => ({
    label: `${t.year}-${String(t.month).padStart(2, "0")}`,
    total: Math.round(t.total),
    count: t.count,
  }));

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

        </div>
      )}
    </AdminLayout>
  );
};

export default ReportsPage;
