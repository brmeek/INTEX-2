import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import oceanImage from "@/assets/Phillipines-ocean.jpg";
import povertyImage from "@/assets/Phillipines-poverty.jpg";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Users, Heart, Home, TrendingUp } from "lucide-react";

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

  const monthlyData =
    data?.donationsByMonth.map((d) => ({
      label: `${d.year}-${String(d.month).padStart(2, "0")}`,
      total: Math.round(d.total),
      count: d.count,
    })) || [];

  return (
    <Layout>
      <section className="pt-32 pb-16 md:pt-40 md:pb-20 bg-navy text-white">
        <div className="container">
          <div className="max-w-4xl">
            <p className="font-body text-teal-light text-sm font-semibold tracking-widest uppercase mb-4">
              Impact Dashboard
            </p>
            <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.05]">
              Numbers that carry a
              <br className="hidden md:block" />
              real impact.
            </h1>
          </div>
        </div>
      </section>

      <section className="pt-8 md:pt-10 pb-0 bg-background">
        <div className="container">
          <div className="mb-5">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
              Why we do what we do
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-border">
              <p className="font-body text-xs font-semibold tracking-widest uppercase text-accent mb-3">
                Child Protection
              </p>
              <p className="font-heading text-3xl md:text-4xl font-bold text-navy mb-3">
                1 in 5
              </p>
              <p className="font-body text-base text-muted-foreground leading-relaxed">
                children in the Philippines are estimated to experience sexual abuse before adulthood.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-soft border border-border">
              <p className="font-body text-xs font-semibold tracking-widest uppercase text-accent mb-3">
                Digital Exploitation
              </p>
              <p className="font-heading text-3xl md:text-4xl font-bold text-navy mb-3">
                OSAEC Hotspot
              </p>
              <p className="font-body text-base text-muted-foreground leading-relaxed">
                The Philippines is widely recognized as one of the world&apos;s most urgent centers of online sexual exploitation of children.
              </p>
            </div>
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
              <div className="grid lg:grid-cols-[minmax(0,0.72fr)_minmax(380px,1.1fr)_minmax(0,0.72fr)] gap-6 lg:gap-8 items-stretch">
                <div className="grid gap-4">
                  {[
                    { label: "Girls Sheltered", value: data.totalResidents, icon: Users },
                    { label: "Currently Active", value: data.activeResidents, icon: Heart },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="bg-white rounded-xl p-6 shadow-soft border border-border min-h-[190px] flex flex-col"
                    >
                      <div className="flex items-start gap-3">
                        <s.icon className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                        <p className="font-body text-base md:text-lg font-semibold text-foreground leading-snug">
                          {s.label}
                        </p>
                      </div>
                      <div className="flex-1 flex items-center justify-center">
                        <p className="font-heading text-6xl md:text-7xl font-bold text-navy">
                          {s.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl overflow-hidden shadow-soft border border-border min-h-[420px] bg-white">
                  <img
                    src={povertyImage}
                    alt="Poverty conditions in the Philippines"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="grid gap-4">
                  {[
                    {
                      label: "Successfully Reintegrated",
                      value: data.reintegrated,
                      icon: TrendingUp,
                    },
                    { label: "Safe Homes Operating", value: data.safehouseCount, icon: Home },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="bg-white rounded-xl p-6 shadow-soft border border-border min-h-[190px] flex flex-col"
                    >
                      <div className="flex items-start gap-3">
                        <s.icon className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                        <p className="font-body text-base md:text-lg font-semibold text-foreground leading-snug">
                          {s.label}
                        </p>
                      </div>
                      <div className="flex-1 flex items-center justify-center">
                        <p className="font-heading text-6xl md:text-7xl font-bold text-navy">
                          {s.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden py-6 md:py-8 lg:py-10">
                <div className="absolute inset-0">
                  <img
                    src={oceanImage}
                    alt=""
                    aria-hidden="true"
                    className="w-full h-full object-cover brightness-110 saturate-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-navy/50 via-navy/30 to-navy/45" />
                </div>

                <div className="relative container space-y-6">
                  <div className="bg-white rounded-xl p-6 shadow-soft border border-border">
                    <h3 className="font-heading text-lg font-bold text-foreground mb-4">
                      Contributions Over Time
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 10 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="total"
                          stroke="#2B4570"
                          strokeWidth={2}
                          name="Value (₱)"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl p-6 shadow-soft border border-border">
                      <h3 className="font-heading text-lg font-bold text-foreground mb-4">
                        Contributions by Type
                      </h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={data.donationsByType}
                            dataKey="count"
                            nameKey="type"
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            label={({ type, count }) => `${type}: ${count}`}
                            labelLine={false}
                          >
                            {data.donationsByType.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

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
                          <Bar
                            dataKey="total"
                            fill="#3D8B8B"
                            radius={[4, 4, 0, 0]}
                            name="Value (₱)"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-secondary rounded-xl p-6 border border-border">
                    <p className="font-body text-xs text-muted-foreground text-center">
                      All data displayed is anonymized and aggregated. No personally
                      identifiable information about residents, donors, or staff is shown.
                      Data is refreshed from our operational database and reflects real
                      outcomes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              Unable to load impact data. Please try again later.
            </p>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default ImpactDashboard;
