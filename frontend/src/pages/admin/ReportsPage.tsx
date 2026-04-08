import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface DonationTrend { year: number; month: number; total: number; count: number }
interface SafehousePerf { safehouseId: number; safehouseName: string; region: string; capacity: number; residentCount: number; activeResidents: number }
interface OutcomeData { byStatus: { status: string; count: number }[]; byCategory: { category: string; count: number }[]; reintegrationRate: number }
interface SocialPredictionResponse {
  predictedReferrals?: number | string | null;
  predictedDonationValuePhp?: number | string | null;
  planningEstimateLowPhp?: number | string | null;
  planningEstimateHighPhp?: number | string | null;
  averageDonationPerReferralPhp?: number | string | null;
  referralMetricDefinition?: string | null;
  predictionConfidence?: string | null;
  PredictedReferrals?: number | string | null;
  PredictedDonationValuePhp?: number | string | null;
  PlanningEstimateLowPhp?: number | string | null;
  PlanningEstimateHighPhp?: number | string | null;
  AverageDonationPerReferralPhp?: number | string | null;
  ReferralMetricDefinition?: string | null;
  PredictionConfidence?: string | null;
}

const COLORS = ["#2B4570", "#3D8B8B", "#E07A5F", "#D4B896", "#8BA58E", "#5B7B9A", "#C49A6C"];
const toNumber = (value: number | string | null | undefined, fallback = 0) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const ReportsPage = () => {
  const { toast } = useToast();
  const [trends, setTrends] = useState<DonationTrend[]>([]);
  const [safehouses, setSafehouses] = useState<SafehousePerf[]>([]);
  const [outcomes, setOutcomes] = useState<OutcomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState<{
    predictedReferrals: number;
    predictedDonationValuePhp: number;
    planningEstimateLowPhp: number;
    planningEstimateHighPhp: number;
    averageDonationPerReferralPhp: number;
    referralMetricDefinition: string;
    predictionConfidence: string;
  } | null>(null);
  const [plannerForm, setPlannerForm] = useState({
    platform: "Facebook",
    postType: "Impact Story",
    mediaType: "Image",
    sentimentTone: "Hopeful",
    contentTopic: "Program Impact",
    hasCallToAction: true,
    callToActionType: "Donate Now",
    isBoosted: false,
    boostBudgetPhp: "",
    numHashtags: "",
    captionLength: "",
    featuresResidentStory: true,
    campaignName: "",
  });

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

  const handlePredictDraft = async () => {
    setPredicting(true);
    try {
      const result = await api.post<SocialPredictionResponse>(
        "/api/reports/social-media-conversion/predict",
        {
          platform: plannerForm.platform,
          postType: plannerForm.postType,
          mediaType: plannerForm.mediaType,
          sentimentTone: plannerForm.sentimentTone,
          contentTopic: plannerForm.contentTopic,
          hasCallToAction: plannerForm.hasCallToAction,
          callToActionType: plannerForm.callToActionType,
          isBoosted: plannerForm.isBoosted,
          boostBudgetPhp: Number(plannerForm.boostBudgetPhp || "0"),
          numHashtags: Number(plannerForm.numHashtags || "0"),
          captionLength: Number(plannerForm.captionLength || "0"),
          featuresResidentStory: plannerForm.featuresResidentStory,
          campaignName: plannerForm.campaignName || null,
        }
      );
      setPrediction({
        predictedReferrals: toNumber(result.predictedReferrals ?? result.PredictedReferrals),
        predictedDonationValuePhp: toNumber(result.predictedDonationValuePhp ?? result.PredictedDonationValuePhp),
        planningEstimateLowPhp: toNumber(result.planningEstimateLowPhp ?? result.PlanningEstimateLowPhp),
        planningEstimateHighPhp: toNumber(result.planningEstimateHighPhp ?? result.PlanningEstimateHighPhp),
        averageDonationPerReferralPhp: toNumber(result.averageDonationPerReferralPhp ?? result.AverageDonationPerReferralPhp),
        referralMetricDefinition:
          result.referralMetricDefinition
          ?? result.ReferralMetricDefinition
          ?? "Estimated number of donors referred by this post (not website visits).",
        predictionConfidence: result.predictionConfidence ?? result.PredictionConfidence ?? "Unknown",
      });
    } catch (e) {
      toast({ title: "Prediction failed", description: String(e), variant: "destructive" });
    } finally {
      setPredicting(false);
    }
  };

  return (
    <AdminLayout title="Reports & Analytics" subtitle="Aggregated insights and trends">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Social Planner Predictor */}
          <div className="bg-white rounded-xl p-6 shadow-soft border border-border">
            <h3 className="font-heading text-lg font-bold text-foreground mb-1">Social Media Conversion Planner</h3>
            <p className="font-body text-xs text-muted-foreground mb-4">
              Enter draft post details to predict donation referral count before publishing.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <select className="px-3 py-2 rounded-lg border border-border bg-white font-body text-sm" value={plannerForm.platform} onChange={(e) => setPlannerForm((f) => ({ ...f, platform: e.target.value }))}>
                <option>Facebook</option><option>Instagram</option><option>TikTok</option><option>YouTube</option>
              </select>
              <select className="px-3 py-2 rounded-lg border border-border bg-white font-body text-sm" value={plannerForm.postType} onChange={(e) => setPlannerForm((f) => ({ ...f, postType: e.target.value }))}>
                <option>Impact Story</option><option>Appeal</option><option>Campaign Update</option><option>Event Promo</option>
              </select>
              <select className="px-3 py-2 rounded-lg border border-border bg-white font-body text-sm" value={plannerForm.mediaType} onChange={(e) => setPlannerForm((f) => ({ ...f, mediaType: e.target.value }))}>
                <option>Image</option><option>Video</option><option>Carousel</option>
              </select>
              <select className="px-3 py-2 rounded-lg border border-border bg-white font-body text-sm" value={plannerForm.sentimentTone} onChange={(e) => setPlannerForm((f) => ({ ...f, sentimentTone: e.target.value }))}>
                <option>Hopeful</option><option>Urgent</option><option>Celebratory</option><option>Informative</option>
              </select>
              <select className="px-3 py-2 rounded-lg border border-border bg-white font-body text-sm" value={plannerForm.contentTopic} onChange={(e) => setPlannerForm((f) => ({ ...f, contentTopic: e.target.value }))}>
                <option>Program Impact</option><option>Resident Story</option><option>Funding Need</option><option>Event</option>
              </select>
              <select className="px-3 py-2 rounded-lg border border-border bg-white font-body text-sm" value={plannerForm.callToActionType} onChange={(e) => setPlannerForm((f) => ({ ...f, callToActionType: e.target.value }))}>
                <option>Donate Now</option><option>Learn More</option><option>Share</option>
              </select>
              <input className="px-3 py-2 rounded-lg border border-border bg-white font-body text-sm" placeholder="Boost budget (PHP)" value={plannerForm.boostBudgetPhp} onChange={(e) => setPlannerForm((f) => ({ ...f, boostBudgetPhp: e.target.value }))} />
              <input className="px-3 py-2 rounded-lg border border-border bg-white font-body text-sm" placeholder="Campaign name" value={plannerForm.campaignName} onChange={(e) => setPlannerForm((f) => ({ ...f, campaignName: e.target.value }))} />
              <input className="px-3 py-2 rounded-lg border border-border bg-white font-body text-sm" placeholder="# hashtags" value={plannerForm.numHashtags} onChange={(e) => setPlannerForm((f) => ({ ...f, numHashtags: e.target.value }))} />
              <input className="px-3 py-2 rounded-lg border border-border bg-white font-body text-sm" placeholder="Caption length (characters)" value={plannerForm.captionLength} onChange={(e) => setPlannerForm((f) => ({ ...f, captionLength: e.target.value }))} />
            </div>
            <div className="flex flex-wrap items-center gap-4 mb-4 text-sm font-body">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={plannerForm.hasCallToAction} onChange={(e) => setPlannerForm((f) => ({ ...f, hasCallToAction: e.target.checked }))} />
                Has CTA
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={plannerForm.isBoosted} onChange={(e) => setPlannerForm((f) => ({ ...f, isBoosted: e.target.checked }))} />
                Is boosted
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={plannerForm.featuresResidentStory} onChange={(e) => setPlannerForm((f) => ({ ...f, featuresResidentStory: e.target.checked }))} />
                Features resident story
              </label>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handlePredictDraft} disabled={predicting} className="font-body">
                {predicting ? "Predicting..." : "Predict Referral Count"}
              </Button>
              {prediction && (
                <div className="font-body text-sm space-y-1">
                  <p>
                    Predicted referred donors: <span className="font-semibold">{prediction.predictedReferrals.toFixed(2)}</span>
                    {" "}(<span className="font-semibold">{prediction.predictionConfidence}</span> confidence)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {prediction.referralMetricDefinition}
                  </p>
                  <p>
                    Predicted donation value: <span className="font-semibold">₱{prediction.predictedDonationValuePhp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </p>
                  <p>
                    Planning estimate range: <span className="font-semibold">₱{prediction.planningEstimateLowPhp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> to{" "}
                    <span className="font-semibold">₱{prediction.planningEstimateHighPhp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Based on average donation amount from historical records: ₱{prediction.averageDonationPerReferralPhp.toFixed(2)}.
                  </p>
                </div>
              )}
            </div>
          </div>

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
