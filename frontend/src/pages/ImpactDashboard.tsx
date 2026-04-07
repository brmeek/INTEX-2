import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Users, Heart, Home, TrendingUp, GraduationCap, HeartPulse } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "";
const COLORS = ["#2B4570", "#3D8B8B", "#E07A5F", "#D4B896", "#8BA58E", "#5B7B9A"];

interface ImpactData {
  totalResidents: number;
  activeResidents: number;
  reintegrated: number;
  safehouseCount: number;
  totalDonations: number;
  donorCount: number;
  avgEducationProgress: number;
  avgHealthScore: number;
  donationsByType: { type: string; count: number; total: number }[];
  donationsByMonth: { year: number; month: number; total: number; count: number }[];
}

const ImpactDashboard = () => {
  const [data, setData] = useState<ImpactData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/reports/impact`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const monthlyData = data?.donationsByMonth.map((d) => ({
    label: `${d.year}-${String(d.month).padStart(2, "0")}`,
    total: Math.round(d.total),
    count: d.count,
  })) || [];

  return (
    <Layout>
      <section className="pt-32 pb-16 md:pt-40 md:pb-20 bg-navy text-white">
        <div className="container">
          <div className="max-w-2xl">
            <p className="font-body text-teal-light text-sm font-semibold tracking-widest uppercase mb-4">
              Impact Dashboard
            </p>
            <h1 className="font-heading text-4xl md:text-5xl font-bold leading-tight mb-6">
              Transparency in action.
            </h1>
            <p className="font-body text-lg text-white/70 leading-relaxed">
              Real, anonymized data from our operations — showing where resources
              go and what outcomes they produce. No identifying information is
              ever displayed.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
            </div>
          ) : data ? (
            <div className="space-y-8">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: "Girls Sheltered", value: data.totalResidents, icon: Users },
                  { label: "Currently Active", value: data.activeResidents, icon: Heart },
                  { label: "Successfully Reintegrated", value: data.reintegrated, icon: TrendingUp },
                  { label: "Safe Homes Operating", value: data.safehouseCount, icon: Home },
                  { label: "Avg. Education Progress", value: `${data.avgEducationProgress}%`, icon: GraduationCap },
                  { label: "Avg. Health Score", value: `${data.avgHealthScore}/5`, icon: HeartPulse },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-xl p-6 shadow-soft border border-border">
                    <s.icon className="h-5 w-5 text-accent mb-3" />
                    <p className="font-heading text-3xl font-bold text-foreground">{s.value}</p>
                    <p className="font-body text-xs text-muted-foreground mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Donations Over Time */}
              <div className="bg-white rounded-xl p-6 shadow-soft border border-border">
                <h3 className="font-heading text-lg font-bold text-foreground mb-4">
                  Contributions Over Time
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" stroke="#2B4570" strokeWidth={2} name="Value (₱)" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* By Type Pie */}
                <div className="bg-white rounded-xl p-6 shadow-soft border border-border">
                  <h3 className="font-heading text-lg font-bold text-foreground mb-4">
                    Contributions by Type
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={data.donationsByType} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={90} label={({ type, count }) => `${type}: ${count}`} labelLine={false}>
                        {data.donationsByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* By Type Bar */}
                <div className="bg-white rounded-xl p-6 shadow-soft border border-border">
                  <h3 className="font-heading text-lg font-bold text-foreground mb-4">
                    Total Value by Contribution Type
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data.donationsByType}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="total" fill="#3D8B8B" radius={[4, 4, 0, 0]} name="Value (₱)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-secondary rounded-xl p-6 border border-border">
                <p className="font-body text-xs text-muted-foreground text-center">
                  All data displayed is anonymized and aggregated. No personally identifiable information
                  about residents, donors, or staff is shown. Data is refreshed from our operational
                  database and reflects real outcomes.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">Unable to load impact data. Please try again later.</p>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default ImpactDashboard;
