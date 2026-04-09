import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ClipboardList, HeartPulse, TrendingUp, UserRound } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface CaseDashboardData {
  residentId: number;
  firstName: string | null;
  lastName: string | null;
  caseStatus: string | null;
  caseCategory: string | null;
  assignedSocialWorker: string | null;
  admissionDate: string | null;
  safehouse?: { safehouseName?: string | null } | null;
  readiness?: {
    readinessScore?: number | null;
    readinessTier?: string | null;
    trendLabel?: string | null;
    topConcernFeature?: string | null;
    historyMonthsUsed?: number | null;
    scoredAtUtc?: string | null;
  } | null;
  educationTimeline?: Array<{
    date?: string | null;
    progressPercent?: number | null;
    attendanceRate?: number | null;
  }>;
  wellbeingTimeline?: Array<{
    date?: string | null;
    generalHealthScore?: number | null;
    nutritionScore?: number | null;
    sleepQualityScore?: number | null;
    energyLevelScore?: number | null;
  }>;
  activityTimeline?: Array<{
    month?: string | null;
    processSessions?: number | null;
    homeVisits?: number | null;
  }>;
  recentProcessRecordings?: Array<{
    recordingId: number;
    sessionDate?: string | null;
    sessionType?: string | null;
    emotionalState?: string | null;
    socialWorker?: string | null;
  }>;
  recentVisitations?: Array<{
    visitationId: number;
    visitDate?: string | null;
    visitType?: string | null;
    visitOutcome?: string | null;
    followUpNeeded?: boolean | null;
    socialWorker?: string | null;
  }>;
}

const toPct = (value?: number | null) => {
  if (value == null || Number.isNaN(value)) return null;
  return value <= 1 ? value * 100 : value;
};

const formatDateLabel = (raw?: string | null) => {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw);
  return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
};

const formatDate = (raw?: string | null) => {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw);
  return d.toLocaleDateString();
};

const CaseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<CaseDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setError("Missing resident id.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const payload = await api.get<CaseDashboardData>(`/api/residents/${id}/dashboard`);
        setData(payload);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load case dashboard.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const readinessTimeline = useMemo(
    () =>
      (data?.educationTimeline ?? [])
        .filter((p) => p.date)
        .map((p) => ({
          month: formatDateLabel(p.date),
          readiness: toPct(p.progressPercent),
          attendance: toPct(p.attendanceRate),
        })),
    [data?.educationTimeline]
  );

  const wellbeingTimeline = useMemo(
    () =>
      (data?.wellbeingTimeline ?? [])
        .filter((p) => p.date)
        .map((p) => ({
          month: formatDateLabel(p.date),
          health: p.generalHealthScore ?? null,
          nutrition: p.nutritionScore ?? null,
          sleep: p.sleepQualityScore ?? null,
        })),
    [data?.wellbeingTimeline]
  );

  const activityTimeline = useMemo(
    () =>
      (data?.activityTimeline ?? []).map((item) => ({
        month: formatDateLabel(item.month),
        processSessions: item.processSessions ?? 0,
        homeVisits: item.homeVisits ?? 0,
      })),
    [data?.activityTimeline]
  );

  const fullName = `${data?.firstName ?? ""} ${data?.lastName ?? ""}`.trim() || "Resident";

  return (
    <AdminLayout title="Caseload Case Dashboard" subtitle="Resident-level trend and readiness view">
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="font-body gap-1" onClick={() => navigate("/admin/caseload")}>
            <ArrowLeft className="h-4 w-4" />
            Back to Caseload
          </Button>
          <Link to="/admin/caseload" className="font-body text-xs text-muted-foreground hover:text-foreground">
            / Caseload
          </Link>
          <span className="font-body text-xs text-muted-foreground">/ {fullName}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48 bg-white rounded-xl border border-border">
            <div className="animate-spin h-7 w-7 border-4 border-accent border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border border-border p-5">
            <p className="font-body text-sm text-destructive">{error}</p>
          </div>
        ) : !data ? (
          <div className="bg-white rounded-xl border border-border p-5">
            <p className="font-body text-sm text-muted-foreground">No dashboard data found for this resident.</p>
          </div>
        ) : (
          <>
            <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="bg-white border border-border rounded-xl p-4">
                <p className="font-body text-xs text-muted-foreground">Resident</p>
                <p className="font-heading text-xl font-bold text-foreground mt-1 flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-accent" />
                  {fullName}
                </p>
                <p className="font-body text-xs text-muted-foreground mt-1">{data.caseCategory ?? "Case category unavailable"}</p>
              </div>
              <div className="bg-white border border-border rounded-xl p-4">
                <p className="font-body text-xs text-muted-foreground">Readiness (Current)</p>
                <p className="font-heading text-2xl font-bold text-foreground mt-1">
                  {data.readiness?.readinessScore != null ? `${(data.readiness.readinessScore * 100).toFixed(2)}%` : "Not scored"}
                </p>
                <p className="font-body text-xs text-muted-foreground mt-1">{data.readiness?.readinessTier ?? "No tier yet"}</p>
              </div>
              <div className="bg-white border border-border rounded-xl p-4">
                <p className="font-body text-xs text-muted-foreground">Trend Direction</p>
                <p className="font-heading text-xl font-bold text-foreground mt-1 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  {data.readiness?.trendLabel ?? "No trend yet"}
                </p>
                <p className="font-body text-xs text-muted-foreground mt-1">
                  History used: {data.readiness?.historyMonthsUsed ?? 0} months
                </p>
              </div>
              <div className="bg-white border border-border rounded-xl p-4">
                <p className="font-body text-xs text-muted-foreground">Case Snapshot</p>
                <p className="font-heading text-xl font-bold text-foreground mt-1 flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-accent" />
                  {data.caseStatus ?? "Unknown"}
                </p>
                <p className="font-body text-xs text-muted-foreground mt-1">
                  SW: {data.assignedSocialWorker ?? "Unassigned"} | Safehouse: {data.safehouse?.safehouseName ?? "—"}
                </p>
              </div>
            </section>

            <section className="grid xl:grid-cols-2 gap-5">
              <div className="bg-white rounded-xl border border-border p-4">
                <h3 className="font-heading text-base font-bold text-foreground mb-1">Readiness & Attendance Over Time</h3>
                <p className="font-body text-xs text-muted-foreground mb-3">
                  Tracks education progress and attendance as a practical readiness trend proxy.
                </p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={readinessTimeline}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="readiness" stroke="#2B4570" strokeWidth={2} name="Readiness proxy (%)" />
                      <Line type="monotone" dataKey="attendance" stroke="#3D8B8B" strokeWidth={2} name="Attendance (%)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-border p-4">
                <h3 className="font-heading text-base font-bold text-foreground mb-1">Case Contact Activity by Month</h3>
                <p className="font-body text-xs text-muted-foreground mb-3">
                  Process sessions and home visits by month to help assess engagement consistency.
                </p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activityTimeline}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="processSessions" stackId="a" fill="#2B4570" name="Process sessions" />
                      <Bar dataKey="homeVisits" stackId="a" fill="#3D8B8B" name="Home visits" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            <section className="grid xl:grid-cols-2 gap-5">
              <div className="bg-white rounded-xl border border-border p-4">
                <h3 className="font-heading text-base font-bold text-foreground mb-1">Wellbeing Scores Over Time</h3>
                <p className="font-body text-xs text-muted-foreground mb-3">Health, nutrition, and sleep indicators from periodic records.</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={wellbeingTimeline}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="health" stroke="#2B4570" strokeWidth={2} name="General health" />
                      <Line type="monotone" dataKey="nutrition" stroke="#3D8B8B" strokeWidth={2} name="Nutrition" />
                      <Line type="monotone" dataKey="sleep" stroke="#8B5CF6" strokeWidth={2} name="Sleep quality" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-border p-4">
                <h3 className="font-heading text-base font-bold text-foreground mb-3">Most Recent Case Notes</h3>
                <div className="space-y-3">
                  <div>
                    <p className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">Recent process recordings</p>
                    {(data.recentProcessRecordings ?? []).length === 0 ? (
                      <p className="font-body text-sm text-muted-foreground">No process recordings yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {(data.recentProcessRecordings ?? []).slice(0, 4).map((item) => (
                          <li key={item.recordingId} className="font-body text-sm text-foreground border border-border rounded-md p-2">
                            {formatDate(item.sessionDate)} - {item.sessionType ?? "Session"} ({item.emotionalState ?? "No emotional state"})
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="pt-2 border-t border-border">
                    <p className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">Recent visitations</p>
                    {(data.recentVisitations ?? []).length === 0 ? (
                      <p className="font-body text-sm text-muted-foreground">No visitations yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {(data.recentVisitations ?? []).slice(0, 4).map((item) => (
                          <li key={item.visitationId} className="font-body text-sm text-foreground border border-border rounded-md p-2">
                            {formatDate(item.visitDate)} - {item.visitType ?? "Visit"} ({item.visitOutcome ?? "Outcome pending"})
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-secondary rounded-xl border border-border p-4 flex items-start gap-2">
              <HeartPulse className="h-4 w-4 text-accent mt-0.5" />
              <p className="font-body text-xs text-muted-foreground">
                This resident dashboard combines reintegration scoring with education, wellbeing, and case-engagement signals so admins can make faster, better-informed case decisions.
              </p>
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default CaseDetailPage;
