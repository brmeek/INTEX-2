import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

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

const toNumber = (value: number | string | null | undefined, fallback = 0) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const SocialConversionPlannerPage = () => {
  const { toast } = useToast();
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
    <AdminLayout title="Social Conversion Planner" subtitle="Predict referred donors and donation value before publishing">
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
    </AdminLayout>
  );
};

export default SocialConversionPlannerPage;
