import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { useTheme } from "@/context/useTheme";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface DonationTrend { year: number; month: number; total: number; count: number }
interface SafehousePerf { safehouseId: number; safehouseName: string; region: string; capacity: number; residentCount: number; activeResidents: number }
interface OutcomeData { byStatus: { status: string; count: number }[]; byCategory: { category: string; count: number }[]; reintegrationRate: number }

const COLORS = ["#2B4570", "#3D8B8B", "#E07A5F", "#D4B896", "#8BA58E", "#5B7B9A", "#C49A6C"];

const ReportsPage = () => {
  const { theme } = useTheme();
  const [trends, setTrends] = useState<DonationTrend[]>([]);
  const [safehouses, setSafehouses] = useState<SafehousePerf[]>([]);
  const [outcomes, setOutcomes] = useState<OutcomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    Promise.all([
      api.get<DonationTrend[]>("/api/reports/donation-trends"),
      api.get<SafehousePerf[]>("/api/reports/safehouse-performance"),
      api.get<OutcomeData>("/api/reports/resident-outcomes"),
    ])
      .then(([t, s, o]) => {
        setTrends(t);
        setSafehouses(s);
        setOutcomes(o);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const trendData = trends.map((t) => ({
    label: `${t.year}-${String(t.month).padStart(2, "0")}`,
    total: Math.round(t.total),
    count: t.count,
  }));

  const donationLineColor = theme === "dark" ? "#7dd3fc" : "#2B4570";

  const formatMonthLabel = (value: string) => {
    const [year, month] = value.split("-").map(Number);
    if (!year || !month) return value;
    return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
      month: "short",
      year: "2-digit",
    });
  };

  const truncateCategoryLabel = (value: string) => {
    if (!isMobile) return value;
    return value.length > 12 ? `${value.slice(0, 12)}...` : value;
  };
  const latestTrend = trendData[trendData.length - 1];

  return (
    <AdminLayout title="Reports & Analytics" subtitle="Aggregated insights and trends">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Donation Trends */}
          <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
            <h3 className="font-heading text-lg font-bold text-foreground mb-4">Donation Trends Over Time</h3>
            <p className="font-body text-xs text-muted-foreground mb-3">
              {latestTrend
                ? `Latest month ${latestTrend.label}: ₱${latestTrend.total.toLocaleString()} across ${latestTrend.count.toLocaleString()} donations.`
                : "No donation trend data available yet."}
            </p>
            <div role="img" aria-label="Line chart showing monthly donation totals and donation counts over time">
              <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke={donationLineColor} strokeWidth={2} name="Amount (₱)" dot={false} />
                <Line type="monotone" dataKey="count" stroke="#3D8B8B" strokeWidth={2} name="# Donations" dot={false} />
              </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {outcomes && (
              <div className="bg-card rounded-xl p-4 sm:p-6 shadow-soft border border-border">
                <h3 className="font-heading text-base sm:text-lg font-bold text-foreground mb-1">Residents by Status</h3>
                <p className="font-body text-xs text-muted-foreground mb-4">Reintegration rate: {outcomes.reintegrationRate}%</p>
                <div role="img" aria-label="Pie chart showing resident count by case status">
                  <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={outcomes.byStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} label={({ status, count }) => `${status}: ${count}`} labelLine={false}>
                      {outcomes.byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {outcomes && (
              <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
                <h3 className="font-heading text-lg font-bold text-foreground mb-4">Residents by Case Category</h3>
                <div role="img" aria-label="Horizontal bar chart showing resident count by case category">
                  <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={outcomes.byCategory} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="category" type="category" tick={{ fontSize: 10 }} width={90} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3D8B8B" radius={[0, 4, 4, 0]} />
                  </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Safehouse Performance */}
          <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
            <h3 className="font-heading text-lg font-bold text-foreground mb-4">Safehouse Performance</h3>
            <div className="hidden md:block overflow-x-auto">
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
                      <td className="px-4 py-3 font-body text-sm text-muted-foreground">{s.region || "-"}</td>
                      <td className="px-4 py-3 font-body text-sm">{s.capacity || "-"}</td>
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
                        ) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-border">
              {safehouses.map((s) => (
                <div key={s.safehouseId} className="py-3">
                  <p className="font-body text-sm font-semibold text-foreground">{s.safehouseName || `Safehouse ${s.safehouseId}`}</p>
                  <p className="font-body text-xs text-muted-foreground">{s.region || "Unknown region"}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-body">
                    <p><span className="text-muted-foreground">Capacity:</span> {s.capacity || "—"}</p>
                    <p><span className="text-muted-foreground">Residents:</span> {s.residentCount}</p>
                    <p><span className="text-muted-foreground">Active:</span> {s.activeResidents}</p>
                    <p>
                      <span className="text-muted-foreground">Occupancy:</span>{" "}
                      {s.capacity ? `${Math.round((s.residentCount / s.capacity) * 100)}%` : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ReportsPage;
