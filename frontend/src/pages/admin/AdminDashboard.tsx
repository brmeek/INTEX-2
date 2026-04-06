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
  upcomingConferences: { planId: number; planCategory: string; caseConferenceDate: string; resident?: { firstName: string; lastName: string } }[];
}

const AdminDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DashboardData>("/api/reports/dashboard").then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const stats = data
    ? [
        { label: "Active Residents", value: data.activeResidents, icon: Users, color: "bg-teal text-white" },
        { label: "Total Donations", value: `₱${data.totalDonations.toLocaleString()}`, icon: DollarSign, color: "bg-coral text-white" },
        { label: "Donation Count", value: data.donationCount, icon: Heart, color: "bg-navy text-white" },
        { label: "Safehouses", value: data.safehouseCount, icon: Home, color: "bg-accent text-white" },
        { label: "Total Served", value: data.totalResidents, icon: ClipboardList, color: "bg-navy-light text-white" },
      ]
    : [];

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
        </div>
      ) : (
        <p className="text-muted-foreground">Failed to load dashboard data. Make sure the API is running.</p>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
