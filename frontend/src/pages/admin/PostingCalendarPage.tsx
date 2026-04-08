import { useEffect, useState } from "react";
import sunsetImg from "@/assets/philippine-sunset.jpg";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Send,
  TrendingUp,
  Clock,
  Loader2,
  Target,
  BarChart3,
  Zap,
  Heart,
  Users,
  Video,
  Image,
  MessageCircle,
  Eye,
  Megaphone,
  Star,
  CalendarClock,
  Check,
  Circle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────

interface Suggestion {
  day: string;
  dayOfWeek: string;
  suggestedTime: string;
  platform: string;
  postType: string;
  mediaType: string;
  sentimentTone: string;
  contentTopic: string;
  callToActionType: string;
  featuresResidentStory: boolean;
  predictedReferrals: number;
  predictedDonationValuePhp: number;
  confidence: string;
  caption?: string;
}

interface HistoryItem {
  predictionId: number;
  platform: string;
  postType: string;
  mediaType: string;
  sentimentTone: string;
  contentTopic: string;
  hasCallToAction: boolean;
  callToActionType: string | null;
  isBoosted: boolean;
  boostBudgetPhp: number;
  featuresResidentStory: boolean;
  campaignName: string | null;
  predictedReferrals: number;
  predictedDonationValuePhp: number;
  predictionConfidence: string;
  scoredAtUtc: string;
}

interface BreakdownItem {
  platform?: string;
  postType?: string;
  mediaType?: string;
  count: number;
  avgReferrals: number;
}

interface HistoryData {
  history: HistoryItem[];
  analytics: {
    platformBreakdown: BreakdownItem[];
    postTypeBreakdown: BreakdownItem[];
    mediaTypeBreakdown: BreakdownItem[];
  };
}

interface PredictResult {
  predictionId: number;
  predictedReferrals: number;
  predictedDonationValuePhp: number;
  planningEstimateLowPhp: number;
  planningEstimateHighPhp: number;
  averageDonationPerReferralPhp: number;
  predictionConfidence: string;
  scoredAtUtc: string;
}

// ─── Constants ─────────────────────────────────────────────────────────

const PLATFORMS = ["Facebook", "Instagram", "TikTok", "YouTube"];
const POST_TYPES = ["Impact Story", "Appeal", "Campaign Update", "Event Promo"];
const MEDIA_TYPES = ["Video", "Carousel", "Image", "Text"];
const SENTIMENT_TONES = ["Hopeful", "Urgent", "Celebratory", "Informational"];
const CONTENT_TOPICS = ["Program Impact", "Resident Story", "Funding Need", "Event"];
const CTA_TYPES = ["Donate Now", "Learn More", "Share"];

const PLATFORM_META: Record<string, { gradient: string; badge: string; icon: string }> = {
  Facebook:  { gradient: "from-blue-500 to-blue-600",   badge: "bg-blue-50 text-blue-700 border-blue-200",   icon: "f" },
  Instagram: { gradient: "from-pink-500 to-purple-500", badge: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200", icon: "ig" },
  TikTok:    { gradient: "from-slate-700 to-slate-900", badge: "bg-slate-50 text-slate-700 border-slate-200",     icon: "tt" },
  YouTube:   { gradient: "from-red-500 to-red-600",     badge: "bg-red-50 text-red-700 border-red-200",           icon: "yt" },
};

const CONFIDENCE_STYLES: Record<string, string> = {
  High:   "bg-emerald-50 text-emerald-700 border-emerald-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low:    "bg-slate-50 text-slate-600 border-slate-200",
};

const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAYS_FULL  = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// ─── Mock Data ─────────────────────────────────────────────────────────

function getCurrentWeekMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toLocalIso(d);
}

function mockDate(offset: number): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff + offset);
  return toLocalIso(d);
}

function getTodayDayName(): string {
  return DAYS_FULL[(new Date().getDay() + 6) % 7];
}

function getWeekDates(mondayIso: string): string[] {
  const mon = new Date(mondayIso + "T00:00:00");
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });
}

const MOCK_SUGGESTIONS: Suggestion[] = [
  { day: mockDate(0), dayOfWeek: "Monday",    suggestedTime: "9:00 AM",  platform: "Facebook",  postType: "Impact Story",    mediaType: "Video",    sentimentTone: "Hopeful",      contentTopic: "Resident Story",  callToActionType: "Donate Now",  featuresResidentStory: true,  predictedReferrals: 87.3, predictedDonationValuePhp: 56745, confidence: "High",   caption: "Share Maria's journey from the safehouse to her new career as a teacher. A 2-minute video showing the before and after of a life transformed by your generosity." },
  { day: mockDate(0), dayOfWeek: "Monday",    suggestedTime: "6:00 PM",  platform: "Instagram", postType: "Impact Story",    mediaType: "Carousel", sentimentTone: "Celebratory",  contentTopic: "Program Impact",  callToActionType: "Learn More",  featuresResidentStory: true,  predictedReferrals: 62.1, predictedDonationValuePhp: 40365, confidence: "High",   caption: "5-slide carousel: 'From Rescued to Restored' — highlighting education milestones at our Cebu safehouse this quarter." },
  { day: mockDate(1), dayOfWeek: "Tuesday",   suggestedTime: "12:00 PM", platform: "TikTok",    postType: "Impact Story",    mediaType: "Video",    sentimentTone: "Hopeful",      contentTopic: "Resident Story",  callToActionType: "Share",       featuresResidentStory: true,  predictedReferrals: 71.8, predictedDonationValuePhp: 46670, confidence: "High",   caption: "60-second 'Day in the Life' at Hope Harbor — sunrise yoga, school lessons, art therapy. Trending audio + subtitles." },
  { day: mockDate(1), dayOfWeek: "Tuesday",   suggestedTime: "7:00 PM",  platform: "Facebook",  postType: "Appeal",          mediaType: "Image",    sentimentTone: "Urgent",       contentTopic: "Funding Need",    callToActionType: "Donate Now",  featuresResidentStory: false, predictedReferrals: 54.2, predictedDonationValuePhp: 35230, confidence: "Medium", caption: "We're ₱120K short of our Q2 education fund goal. Every ₱500 keeps a girl in school for one month. Can you help us close the gap?" },
  { day: mockDate(2), dayOfWeek: "Wednesday", suggestedTime: "9:00 AM",  platform: "YouTube",   postType: "Campaign Update",  mediaType: "Video",    sentimentTone: "Informational", contentTopic: "Program Impact",  callToActionType: "Learn More",  featuresResidentStory: false, predictedReferrals: 45.6, predictedDonationValuePhp: 29640, confidence: "Medium", caption: "Monthly impact report: 3-min video breakdown of where every peso went in March — education, health, vocational training." },
  { day: mockDate(2), dayOfWeek: "Wednesday", suggestedTime: "5:00 PM",  platform: "Instagram", postType: "Appeal",          mediaType: "Image",    sentimentTone: "Hopeful",      contentTopic: "Funding Need",    callToActionType: "Donate Now",  featuresResidentStory: false, predictedReferrals: 48.9, predictedDonationValuePhp: 31785, confidence: "Medium", caption: "Golden hour photo of the Manila safehouse garden the girls planted. Caption: 'Growth takes time — and your support.' Link in bio." },
  { day: mockDate(3), dayOfWeek: "Thursday",  suggestedTime: "10:00 AM", platform: "Facebook",  postType: "Impact Story",    mediaType: "Video",    sentimentTone: "Celebratory",  contentTopic: "Resident Story",  callToActionType: "Share",       featuresResidentStory: true,  predictedReferrals: 79.4, predictedDonationValuePhp: 51610, confidence: "High",   caption: "Graduation day! Watch 3 residents receive their vocational certificates. The smiles say everything. Please share so others can see what hope looks like." },
  { day: mockDate(3), dayOfWeek: "Thursday",  suggestedTime: "6:30 PM",  platform: "TikTok",    postType: "Event Promo",     mediaType: "Video",    sentimentTone: "Celebratory",  contentTopic: "Event",           callToActionType: "Learn More",  featuresResidentStory: false, predictedReferrals: 38.7, predictedDonationValuePhp: 25155, confidence: "Medium", caption: "Behind-the-scenes prep for our annual fundraising gala in Makati! Quick cuts + trending sound. Save the date: May 17." },
  { day: mockDate(4), dayOfWeek: "Friday",    suggestedTime: "11:00 AM", platform: "Instagram", postType: "Impact Story",    mediaType: "Carousel", sentimentTone: "Hopeful",      contentTopic: "Program Impact",  callToActionType: "Donate Now",  featuresResidentStory: true,  predictedReferrals: 68.5, predictedDonationValuePhp: 44525, confidence: "High",   caption: "Before & After carousel: 6 months of health & wellbeing progress at our Davao safehouse. Swipe to see the transformation." },
  { day: mockDate(4), dayOfWeek: "Friday",    suggestedTime: "7:00 PM",  platform: "Facebook",  postType: "Campaign Update",  mediaType: "Image",    sentimentTone: "Hopeful",      contentTopic: "Program Impact",  callToActionType: "Learn More",  featuresResidentStory: false, predictedReferrals: 41.2, predictedDonationValuePhp: 26780, confidence: "Medium", caption: "This week's wins: 12 new education enrollments, 3 successful family reintegrations, ₱89K raised. Thank you for making this possible." },
  { day: mockDate(5), dayOfWeek: "Saturday",  suggestedTime: "10:00 AM", platform: "Facebook",  postType: "Appeal",          mediaType: "Video",    sentimentTone: "Urgent",       contentTopic: "Funding Need",    callToActionType: "Donate Now",  featuresResidentStory: true,  predictedReferrals: 73.1, predictedDonationValuePhp: 47515, confidence: "High",   caption: "Weekend giving challenge: For every ₱1,000 donated today, an anonymous donor will match it. 2-minute video featuring Joy's story + donation counter." },
  { day: mockDate(6), dayOfWeek: "Sunday",    suggestedTime: "8:00 AM",  platform: "Instagram", postType: "Impact Story",    mediaType: "Image",    sentimentTone: "Hopeful",      contentTopic: "Resident Story",  callToActionType: "Share",       featuresResidentStory: true,  predictedReferrals: 52.4, predictedDonationValuePhp: 34060, confidence: "Medium", caption: "Sunday reflection: A sunrise photo from our Palawan safehouse with a quote from one of our residents. 'I never thought I'd feel safe watching a sunrise again.'" },
];

const MOCK_HISTORY: HistoryItem[] = [
  { predictionId: 1,  platform: "Facebook",  postType: "Impact Story",   mediaType: "Video",    sentimentTone: "Hopeful",     contentTopic: "Resident Story",  hasCallToAction: true,  callToActionType: "Donate Now",  isBoosted: true,  boostBudgetPhp: 2000, featuresResidentStory: true,  campaignName: "Stories of Hope",  predictedReferrals: 92.4, predictedDonationValuePhp: 60060, predictionConfidence: "High",   scoredAtUtc: new Date(Date.now() - 86400000 * 1).toISOString() },
  { predictionId: 2,  platform: "Instagram", postType: "Appeal",         mediaType: "Carousel", sentimentTone: "Urgent",      contentTopic: "Funding Need",    hasCallToAction: true,  callToActionType: "Donate Now",  isBoosted: false, boostBudgetPhp: 0,    featuresResidentStory: false, campaignName: "Q2 Education Fund", predictedReferrals: 58.7, predictedDonationValuePhp: 38155, predictionConfidence: "Medium", scoredAtUtc: new Date(Date.now() - 86400000 * 2).toISOString() },
  { predictionId: 3,  platform: "TikTok",    postType: "Impact Story",   mediaType: "Video",    sentimentTone: "Celebratory", contentTopic: "Program Impact",  hasCallToAction: true,  callToActionType: "Share",       isBoosted: false, boostBudgetPhp: 0,    featuresResidentStory: true,  campaignName: null,                predictedReferrals: 74.1, predictedDonationValuePhp: 48165, predictionConfidence: "High",   scoredAtUtc: new Date(Date.now() - 86400000 * 3).toISOString() },
  { predictionId: 4,  platform: "YouTube",   postType: "Campaign Update", mediaType: "Video",    sentimentTone: "Informational", contentTopic: "Program Impact", hasCallToAction: true,  callToActionType: "Learn More",  isBoosted: false, boostBudgetPhp: 0,    featuresResidentStory: false, campaignName: "Monthly Report",    predictedReferrals: 41.3, predictedDonationValuePhp: 26845, predictionConfidence: "Medium", scoredAtUtc: new Date(Date.now() - 86400000 * 4).toISOString() },
  { predictionId: 5,  platform: "Facebook",  postType: "Event Promo",    mediaType: "Image",    sentimentTone: "Celebratory", contentTopic: "Event",           hasCallToAction: true,  callToActionType: "Learn More",  isBoosted: true,  boostBudgetPhp: 3000, featuresResidentStory: false, campaignName: "Annual Gala 2026",  predictedReferrals: 49.8, predictedDonationValuePhp: 32370, predictionConfidence: "Medium", scoredAtUtc: new Date(Date.now() - 86400000 * 5).toISOString() },
  { predictionId: 6,  platform: "Instagram", postType: "Impact Story",   mediaType: "Image",    sentimentTone: "Hopeful",     contentTopic: "Resident Story",  hasCallToAction: true,  callToActionType: "Donate Now",  isBoosted: false, boostBudgetPhp: 0,    featuresResidentStory: true,  campaignName: "Stories of Hope",  predictedReferrals: 63.2, predictedDonationValuePhp: 41080, predictionConfidence: "High",   scoredAtUtc: new Date(Date.now() - 86400000 * 7).toISOString() },
  { predictionId: 7,  platform: "Facebook",  postType: "Appeal",         mediaType: "Video",    sentimentTone: "Urgent",      contentTopic: "Funding Need",    hasCallToAction: true,  callToActionType: "Donate Now",  isBoosted: true,  boostBudgetPhp: 5000, featuresResidentStory: true,  campaignName: "Match Challenge",   predictedReferrals: 98.5, predictedDonationValuePhp: 64025, predictionConfidence: "High",   scoredAtUtc: new Date(Date.now() - 86400000 * 10).toISOString() },
  { predictionId: 8,  platform: "TikTok",    postType: "Event Promo",    mediaType: "Video",    sentimentTone: "Celebratory", contentTopic: "Event",           hasCallToAction: true,  callToActionType: "Share",       isBoosted: false, boostBudgetPhp: 0,    featuresResidentStory: false, campaignName: "Annual Gala 2026",  predictedReferrals: 35.2, predictedDonationValuePhp: 22880, predictionConfidence: "Low",    scoredAtUtc: new Date(Date.now() - 86400000 * 12).toISOString() },
];

const MOCK_ANALYTICS = {
  platformBreakdown: [
    { platform: "Facebook",  count: 14, avgReferrals: 72.4 },
    { platform: "TikTok",    count: 8,  avgReferrals: 61.8 },
    { platform: "Instagram", count: 11, avgReferrals: 58.3 },
    { platform: "YouTube",   count: 5,  avgReferrals: 43.1 },
  ],
  postTypeBreakdown: [
    { postType: "Impact Story",    count: 18, avgReferrals: 74.6 },
    { postType: "Appeal",          count: 10, avgReferrals: 62.1 },
    { postType: "Campaign Update", count: 6,  avgReferrals: 44.8 },
    { postType: "Event Promo",     count: 4,  avgReferrals: 38.2 },
  ],
  mediaTypeBreakdown: [
    { mediaType: "Video",    count: 20, avgReferrals: 71.2 },
    { mediaType: "Carousel", count: 8,  avgReferrals: 59.4 },
    { mediaType: "Image",    count: 10, avgReferrals: 48.7 },
  ],
};

// ─── Helpers ───────────────────────────────────────────────────────────

function toLocalIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function localToday(): string {
  return toLocalIso(new Date());
}

function formatCurrency(value: number) {
  return `₱${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function getMediaIcon(media: string) {
  switch (media) {
    case "Video":    return <Video className="h-3 w-3" />;
    case "Carousel": return <Image className="h-3 w-3" />;
    case "Image":    return <Image className="h-3 w-3" />;
    default:         return <MessageCircle className="h-3 w-3" />;
  }
}

// ─── Sunset Hero Banner ────────────────────────────────────────────────

function SunsetBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl mb-6">
      <img
        src={sunsetImg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/45 to-black/30" />

      <div className="relative px-8 py-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
            <CalendarClock className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-heading text-2xl font-bold text-white [text-shadow:_0_2px_8px_rgba(0,0,0,0.5)]">
              Posting Calendar
            </h2>
            <p className="font-body text-sm text-white/90 [text-shadow:_0_1px_4px_rgba(0,0,0,0.5)]">
              Plan, schedule, and track your social media content
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-5">
          <MiniStat icon={<TrendingUp className="h-3.5 w-3.5" />} label="Avg Referrals/Post" value="61.4" />
          <MiniStat icon={<Heart className="h-3.5 w-3.5" />} label="Best Platform" value="Facebook" />
          <MiniStat icon={<Star className="h-3.5 w-3.5" />} label="Top Format" value="Video" />
          <MiniStat icon={<Users className="h-3.5 w-3.5" />} label="Posts This Month" value="18" />
        </div>
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 bg-black/25 backdrop-blur-sm rounded-lg px-3 py-2">
      <span className="text-white/80">{icon}</span>
      <div>
        <p className="font-body text-[10px] text-white/75 leading-tight">{label}</p>
        <p className="font-heading text-sm font-bold text-white leading-tight [text-shadow:_0_1px_3px_rgba(0,0,0,0.4)]">{value}</p>
      </div>
    </div>
  );
}

// ─── Calendar Tab ──────────────────────────────────────────────────────

function postKey(s: Suggestion): string {
  return `${s.day}-${s.suggestedTime}-${s.platform}`;
}

type ViewMode = "day" | "week" | "month";

function CalendarTab() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>(MOCK_SUGGESTIONS);
  const [loading, setLoading] = useState(false);
  const [completedPosts, setCompletedPosts] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [selectedDate, setSelectedDate] = useState<string>(localToday());

  const toggleComplete = (key: string) => {
    setCompletedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  useEffect(() => {
    setLoading(true);
    api
      .get<{ weekStarting: string; suggestions: Suggestion[] }>("/api/reports/posting-calendar/suggestions")
      .then((data) => {
        if (data.suggestions.length > 0) setSuggestions(data.suggestions);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const todayStr = localToday();

  const postsByDate = suggestions.reduce<Record<string, Suggestion[]>>((acc, s) => {
    (acc[s.day] ??= []).push(s);
    return acc;
  }, {});

  const selectedDatePosts = postsByDate[selectedDate] ?? [];

  const derivedMonday = (() => {
    const d = new Date(selectedDate + "T00:00:00");
    const day = d.getDay();
    d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
    return toLocalIso(d);
  })();

  const weekDateStrs = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(derivedMonday + "T00:00:00");
    d.setDate(d.getDate() + i);
    return toLocalIso(d);
  });

  const weekDates = getWeekDates(derivedMonday);

  const weekPosts = weekDateStrs.flatMap((d) => postsByDate[d] ?? []);
  const weekTotal = weekPosts.reduce((sum, s) => sum + s.predictedReferrals, 0);
  const weekDonations = weekPosts.reduce((sum, s) => sum + s.predictedDonationValuePhp, 0);

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + days);
    setSelectedDate(toLocalIso(d));
  };

  const shiftMonth = (dir: number) => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(1);
    d.setMonth(d.getMonth() + dir);
    setSelectedDate(toLocalIso(d));
  };

  const fmtFull = (iso: string) =>
    new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });

  const fmtMonthYear = (iso: string) =>
    new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
      month: "long", year: "numeric",
    });

  const getMonthGrid = () => {
    const d = new Date(selectedDate + "T00:00:00");
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDay = new Date(year, month, 1);
    const startPad = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(toLocalIso(new Date(year, month, day)));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  };

  const NavButton = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
    <button onClick={onClick} className="p-2 rounded-lg hover:bg-stone-100 transition-colors">
      {children}
    </button>
  );

  return (
    <div className="space-y-5">
      {/* ─── Toolbar ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-50 rounded-xl border border-stone-200 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white rounded-lg border border-stone-200 p-0.5">
            {(["day", "week", "month"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-xs font-body font-medium rounded-md transition-colors capitalize ${
                  viewMode === mode
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSelectedDate(localToday())}
            className="text-[11px] font-body font-semibold text-amber-700 hover:text-amber-800 px-2 py-1 rounded-md hover:bg-amber-50 transition-colors"
          >
            Today
          </button>
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />}
        </div>
        <div className="flex items-center gap-5 text-xs font-body">
          <span className="text-muted-foreground">
            <strong className="text-amber-700">{weekPosts.length}</strong> posts this week
          </span>
          <span className="text-muted-foreground">
            <strong className="text-amber-600">{weekTotal.toFixed(0)}</strong> predicted referrals
          </span>
          <span className="text-muted-foreground">
            <strong className="text-stone-700">{formatCurrency(weekDonations)}</strong> est. donations
          </span>
        </div>
      </div>

      {/* ─── Day View ─── */}
      {viewMode === "day" && (
        <div className="flex items-center justify-between">
          <NavButton onClick={() => shiftDate(-1)}>
            <ChevronLeft className="h-5 w-5 text-stone-500" />
          </NavButton>
          <div className="text-center">
            <h3 className="font-heading text-lg font-bold text-foreground">{fmtFull(selectedDate)}</h3>
            <div className="flex items-center justify-center gap-2 mt-1">
              {selectedDate === todayStr && (
                <span className="text-[10px] font-bold uppercase tracking-wide bg-amber-500 text-white px-2 py-0.5 rounded-full">
                  Today
                </span>
              )}
              {selectedDatePosts.length > 0 && (
                <span className="text-xs font-body text-muted-foreground">
                  {selectedDatePosts.filter((p) => completedPosts.has(postKey(p))).length}/{selectedDatePosts.length} posted
                </span>
              )}
            </div>
          </div>
          <NavButton onClick={() => shiftDate(1)}>
            <ChevronRight className="h-5 w-5 text-stone-500" />
          </NavButton>
        </div>
      )}

      {/* ─── Week View ─── */}
      {viewMode === "week" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <NavButton onClick={() => shiftDate(-7)}>
              <ChevronLeft className="h-5 w-5 text-stone-500" />
            </NavButton>
            <h3 className="font-heading text-sm font-bold text-foreground">
              {weekDates[0]} – {weekDates[6]}, {new Date(derivedMonday + "T00:00:00").getFullYear()}
            </h3>
            <NavButton onClick={() => shiftDate(7)}>
              <ChevronRight className="h-5 w-5 text-stone-500" />
            </NavButton>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {weekDateStrs.map((dateStr, di) => {
              const posts = postsByDate[dateStr] ?? [];
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === todayStr;
              const dayReferrals = posts.reduce((s, p) => s + p.predictedReferrals, 0);
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`group relative rounded-xl border p-3 text-left transition-all min-h-[130px] flex flex-col ${
                    isSelected
                      ? "border-amber-300 bg-amber-50/60 ring-2 ring-amber-200/50 shadow-soft"
                      : isToday
                      ? "border-amber-200 bg-amber-50/30 hover:shadow-soft"
                      : "border-border bg-white hover:border-amber-200 hover:shadow-soft"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-body text-xs font-bold ${isSelected ? "text-amber-800" : isToday ? "text-amber-700" : "text-muted-foreground"}`}>
                        {DAYS_SHORT[di]}
                      </span>
                      <span className={`font-body text-[10px] ${isToday ? "text-amber-600 font-semibold" : "text-muted-foreground/60"}`}>
                        {weekDates[di]}
                      </span>
                      {isToday && (
                        <span className="text-[8px] font-bold uppercase tracking-wide bg-amber-500 text-white px-1.5 py-0.5 rounded-full leading-none">
                          Today
                        </span>
                      )}
                    </div>
                    {posts.length > 0 && (() => {
                      const done = posts.filter((p) => completedPosts.has(postKey(p))).length;
                      const allDone = done === posts.length;
                      return (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
                          allDone
                            ? "bg-emerald-100 text-emerald-700"
                            : isSelected
                            ? "bg-amber-200/60 text-amber-800"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {allDone && <Check className="h-2.5 w-2.5" />}
                          {done > 0 && !allDone ? `${done}/` : ""}{posts.length}
                        </span>
                      );
                    })()}
                  </div>
                  {posts.length === 0 ? (
                    <p className="font-body text-[10px] text-muted-foreground/40 italic mt-auto">No posts</p>
                  ) : (
                    <>
                      <div className="space-y-1 flex-1">
                        {posts.slice(0, 3).map((s, i) => {
                          const done = completedPosts.has(postKey(s));
                          return (
                            <div key={i} className={`flex items-center gap-1 ${done ? "opacity-50" : ""}`}>
                              {done
                                ? <Check className="h-2.5 w-2.5 text-emerald-500 shrink-0" />
                                : <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${PLATFORM_META[s.platform]?.gradient ?? "from-gray-400 to-gray-500"}`} />
                              }
                              <span className={`text-[10px] truncate font-body ${done ? "line-through text-muted-foreground" : "text-foreground/70"}`}>{s.platform}</span>
                              <span className="text-[9px] text-muted-foreground/50 ml-auto">{s.suggestedTime}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <p className="font-body text-[10px] font-semibold text-amber-700">
                          {dayReferrals.toFixed(0)} referrals
                        </p>
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Month View ─── */}
      {viewMode === "month" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <NavButton onClick={() => shiftMonth(-1)}>
              <ChevronLeft className="h-5 w-5 text-stone-500" />
            </NavButton>
            <h3 className="font-heading text-sm font-bold text-foreground">
              {fmtMonthYear(selectedDate)}
            </h3>
            <NavButton onClick={() => shiftMonth(1)}>
              <ChevronRight className="h-5 w-5 text-stone-500" />
            </NavButton>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {DAYS_SHORT.map((d) => (
              <div key={d} className="text-center font-body text-[10px] font-bold text-muted-foreground uppercase tracking-wider py-2">
                {d}
              </div>
            ))}
            {getMonthGrid().map((dateStr, i) => {
              if (!dateStr) return <div key={`pad-${i}`} className="min-h-[72px]" />;
              const posts = postsByDate[dateStr] ?? [];
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === todayStr;
              const dateNum = new Date(dateStr + "T00:00:00").getDate();
              const doneCount = posts.filter((p) => completedPosts.has(postKey(p))).length;
              const allDone = posts.length > 0 && doneCount === posts.length;
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`min-h-[72px] rounded-lg border p-2 text-left transition-all flex flex-col ${
                    isSelected
                      ? "border-amber-300 bg-amber-50/60 ring-2 ring-amber-200/50 shadow-soft"
                      : isToday
                      ? "border-amber-200 bg-amber-50/30"
                      : posts.length > 0
                      ? "border-border bg-white hover:border-amber-200"
                      : "border-transparent bg-stone-50/50 hover:bg-stone-100/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-body text-xs font-bold leading-none ${
                      isToday ? "bg-amber-500 text-white w-6 h-6 rounded-full flex items-center justify-center"
                        : isSelected ? "text-amber-800"
                        : "text-foreground"
                    }`}>
                      {dateNum}
                    </span>
                    {allDone && <Check className="h-3 w-3 text-emerald-500" />}
                  </div>
                  {posts.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {posts.map((p, pi) => (
                        <div
                          key={pi}
                          className={`w-2.5 h-2.5 rounded-full ${
                            completedPosts.has(postKey(p))
                              ? "bg-emerald-400"
                              : `bg-gradient-to-r ${PLATFORM_META[p.platform]?.gradient ?? "from-gray-400 to-gray-500"}`
                          }`}
                          title={`${p.platform} · ${p.suggestedTime}`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Post Detail Panel (shared across all views) ─── */}
      {selectedDatePosts.length > 0 && (
        <div className="rounded-2xl border border-stone-200 bg-white shadow-soft overflow-hidden">
          {viewMode !== "day" && (
            <div className="bg-slate-800 px-6 py-3">
              <h4 className="font-heading text-base font-bold text-white">
                {fmtFull(selectedDate)}
                {selectedDate === todayStr && (
                  <span className="ml-2 text-[10px] font-bold uppercase tracking-wide bg-amber-500 text-white px-2 py-0.5 rounded-full">
                    Today
                  </span>
                )}
                {(() => {
                  const doneCount = selectedDatePosts.filter((p) => completedPosts.has(postKey(p))).length;
                  return (
                    <span className="font-body text-sm font-normal text-white/70 ml-2">
                      — {doneCount}/{selectedDatePosts.length} posted
                    </span>
                  );
                })()}
              </h4>
            </div>
          )}
          <div className="p-5 space-y-4">
            {selectedDatePosts.map((s, i) => {
              const key = postKey(s);
              const done = completedPosts.has(key);
              return (
                <div key={i} className={`group flex gap-4 p-4 rounded-xl border transition-all ${
                  done
                    ? "border-emerald-200 bg-emerald-50/40"
                    : "border-border bg-white hover:shadow-soft"
                }`}>
                  <button
                    onClick={() => toggleComplete(key)}
                    className={`shrink-0 mt-1 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      done
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "border-2 border-stone-200 text-stone-300 hover:border-amber-400 hover:text-amber-500"
                    }`}
                    title={done ? "Mark incomplete" : "Mark complete"}
                  >
                    {done ? <Check className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                  </button>
                  <div className={`flex-1 min-w-0 ${done ? "opacity-60" : ""}`}>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${PLATFORM_META[s.platform]?.badge ?? ""}`}>
                        {s.platform}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" /> {s.suggestedTime}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        {getMediaIcon(s.mediaType)} {s.mediaType}
                      </span>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${CONFIDENCE_STYLES[s.confidence] ?? ""}`}>
                        {s.confidence}
                      </span>
                      {done && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                          Posted
                        </span>
                      )}
                    </div>
                    <p className={`font-body text-sm font-semibold ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {s.postType}: {s.contentTopic}
                    </p>
                    {s.caption && (
                      <p className="font-body text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        {s.caption}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-2.5 text-[10px] font-body text-muted-foreground">
                      <span>{s.sentimentTone} tone</span>
                      <span>CTA: {s.callToActionType}</span>
                      {s.featuresResidentStory && (
                        <span className="text-rose-600 font-semibold flex items-center gap-0.5">
                          <Heart className="h-2.5 w-2.5" /> Resident story
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`text-right shrink-0 flex flex-col items-end justify-center gap-1 ${done ? "opacity-60" : ""}`}>
                    <div className="bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
                      <p className="font-heading text-lg font-bold text-amber-700">{s.predictedReferrals.toFixed(1)}</p>
                      <p className="font-body text-[9px] text-amber-600/70">referrals</p>
                    </div>
                    <p className="font-body text-xs font-semibold text-foreground">{formatCurrency(s.predictedDonationValuePhp)}</p>
                    <p className="font-body text-[9px] text-muted-foreground">est. donations</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state for day view */}
      {viewMode === "day" && selectedDatePosts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/50 p-10 text-center">
          <p className="font-body text-sm text-muted-foreground">No posts scheduled for this day.</p>
        </div>
      )}
    </div>
  );
}

// ─── Composer Tab ──────────────────────────────────────────────────────

function ComposerTab() {
  const [platform, setPlatform] = useState("Facebook");
  const [postType, setPostType] = useState("Impact Story");
  const [mediaType, setMediaType] = useState("Video");
  const [sentimentTone, setSentimentTone] = useState("Hopeful");
  const [contentTopic, setContentTopic] = useState("Program Impact");
  const [hasCta, setHasCta] = useState(true);
  const [ctaType, setCtaType] = useState("Donate Now");
  const [isBoosted, setIsBoosted] = useState(false);
  const [boostBudget, setBoostBudget] = useState("0");
  const [numHashtags, setNumHashtags] = useState("5");
  const [captionLength, setCaptionLength] = useState("200");
  const [featuresResident, setFeaturesResident] = useState(false);
  const [campaignName, setCampaignName] = useState("");

  const [result, setResult] = useState<PredictResult | null>(null);
  const [scoring, setScoring] = useState(false);

  const scoreDraft = async () => {
    setScoring(true);
    setResult(null);
    try {
      const res = await api.post<PredictResult>("/api/reports/social-media-conversion/predict", {
        platform,
        postType,
        mediaType,
        sentimentTone,
        contentTopic,
        hasCallToAction: hasCta,
        callToActionType: hasCta ? ctaType : null,
        isBoosted,
        boostBudgetPhp: isBoosted ? parseFloat(boostBudget) || 0 : 0,
        numHashtags: parseInt(numHashtags) || 0,
        captionLength: parseInt(captionLength) || 0,
        featuresResidentStory: featuresResident,
        campaignName: campaignName || null,
      });
      setResult(res);
    } catch {
      // Silently handle
    } finally {
      setScoring(false);
    }
  };

  const inputStyle = "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-1 transition-shadow";

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 bg-white rounded-2xl border border-border shadow-soft p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center">
            <Send className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-foreground">Draft a Post</h3>
            <p className="font-body text-[10px] text-muted-foreground">Configure and score before publishing</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <FieldGroup label="Platform">
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup label="Post Type">
            <Select value={postType} onValueChange={setPostType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{POST_TYPES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup label="Media Type">
            <Select value={mediaType} onValueChange={setMediaType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{MEDIA_TYPES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup label="Sentiment / Tone">
            <Select value={sentimentTone} onValueChange={setSentimentTone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SENTIMENT_TONES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup label="Content Topic">
            <Select value={contentTopic} onValueChange={setContentTopic}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CONTENT_TOPICS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup label="Caption Length">
            <input type="number" min={0} max={2000} value={captionLength} onChange={(e) => setCaptionLength(e.target.value)} className={inputStyle} />
          </FieldGroup>
          <FieldGroup label="# Hashtags">
            <input type="number" min={0} max={50} value={numHashtags} onChange={(e) => setNumHashtags(e.target.value)} className={inputStyle} />
          </FieldGroup>
          <FieldGroup label="Campaign (optional)">
            <input type="text" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="e.g. Holiday Give" className={inputStyle + " placeholder:text-muted-foreground"} />
          </FieldGroup>
        </div>

        <div className="flex flex-wrap items-center gap-5 mt-5 pt-5 border-t border-border">
          <label className="flex items-center gap-2 text-sm font-body">
            <Switch checked={hasCta} onCheckedChange={setHasCta} /> Call to Action
          </label>
          {hasCta && (
            <Select value={ctaType} onValueChange={setCtaType}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>{CTA_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          )}
          <label className="flex items-center gap-2 text-sm font-body">
            <Switch checked={featuresResident} onCheckedChange={setFeaturesResident} /> Resident Story
          </label>
          <label className="flex items-center gap-2 text-sm font-body">
            <Switch checked={isBoosted} onCheckedChange={setIsBoosted} /> Boosted
          </label>
          {isBoosted && (
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">₱</span>
              <input type="number" min={0} value={boostBudget} onChange={(e) => setBoostBudget(e.target.value)} className="w-24 h-9 rounded-lg border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
            </div>
          )}
        </div>

        <Button
          onClick={scoreDraft}
          disabled={scoring}
          className="mt-6 gap-2 bg-amber-600 hover:bg-amber-700 text-white shadow-md"
        >
          {scoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          {scoring ? "Scoring…" : "Score This Post"}
        </Button>
      </div>

      <div className="lg:col-span-2 space-y-4">
        {result ? (
          <div className="rounded-2xl border border-stone-200 bg-white shadow-soft p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-amber-600" />
              <h3 className="font-heading text-base font-bold text-foreground">Prediction Result</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Predicted Referrals" value={result.predictedReferrals.toFixed(1)} sub="donors from this post" accent="orange" />
              <ResultCard label="Est. Donation Value" value={formatCurrency(result.predictedDonationValuePhp)} sub="based on avg donation" accent="rose" />
              <ResultCard label="Planning Range" value={`${formatCurrency(result.planningEstimateLowPhp)} – ${formatCurrency(result.planningEstimateHighPhp)}`} sub="low – high estimate" accent="purple" />
              <ResultCard
                label="Confidence"
                value={result.predictionConfidence}
                sub={`avg ₱${result.averageDonationPerReferralPhp.toLocaleString()} / referral`}
                accent={result.predictionConfidence === "High" ? "emerald" : result.predictionConfidence === "Medium" ? "amber" : "slate"}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Scored at {formatTime(result.scoredAtUtc)} · ID #{result.predictionId}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/50 p-8 flex flex-col items-center justify-center text-center min-h-[260px]">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mb-4">
              <BarChart3 className="h-7 w-7 text-amber-600/60" />
            </div>
            <p className="font-body text-sm text-muted-foreground">
              Configure your post draft and click <strong>Score This Post</strong> to see AI predictions.
            </p>
          </div>
        )}

        <div className="bg-stone-50 rounded-2xl border border-stone-200 p-5">
          <h4 className="font-body text-xs font-bold text-stone-700 mb-3 flex items-center gap-1.5">
            <Megaphone className="h-3.5 w-3.5" /> What Drives Results
          </h4>
          <div className="space-y-2.5">
            <TipRow tip="Video content drives ~2.5x more referrals than static images" />
            <TipRow tip="Impact Stories with a resident narrative convert best" />
            <TipRow tip='Adding a "Donate Now" CTA boosts referrals significantly' />
            <TipRow tip="Boosted posts see higher reach proportional to budget" />
            <TipRow tip="Posts at 9 AM and 6 PM PH time see peak engagement" />
          </div>
        </div>
      </div>
    </div>
  );
}

function TipRow({ tip }: { tip: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
      <p className="font-body text-xs text-stone-600 leading-relaxed">{tip}</p>
    </div>
  );
}

// ─── Analytics Tab ─────────────────────────────────────────────────────

function AnalyticsTab() {
  const [history, setHistory] = useState<HistoryItem[]>(MOCK_HISTORY);
  const [analytics, setAnalytics] = useState(MOCK_ANALYTICS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get<HistoryData>("/api/reports/posting-calendar/history")
      .then((data) => {
        if (data.history.length > 0) setHistory(data.history);
        if (data.analytics.platformBreakdown.length > 0) setAnalytics(data.analytics);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const hasAnalytics =
    analytics.platformBreakdown.length > 0 ||
    analytics.postTypeBreakdown.length > 0 ||
    analytics.mediaTypeBreakdown.length > 0;

  return (
    <div className="space-y-6">
      {loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading live data…
        </div>
      )}

      {hasAnalytics && (
        <div className="grid md:grid-cols-3 gap-4">
          <BreakdownCard
            title="By Platform"
            color="orange"
            items={analytics.platformBreakdown.map((b) => ({
              label: b.platform!,
              count: b.count,
              avg: b.avgReferrals,
            }))}
          />
          <BreakdownCard
            title="By Post Type"
            color="rose"
            items={analytics.postTypeBreakdown.map((b) => ({
              label: b.postType!,
              count: b.count,
              avg: b.avgReferrals,
            }))}
          />
          <BreakdownCard
            title="By Media Format"
            color="purple"
            items={analytics.mediaTypeBreakdown.map((b) => ({
              label: b.mediaType!,
              count: b.count,
              avg: b.avgReferrals,
            }))}
          />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border shadow-soft overflow-hidden">
        <div className="bg-slate-800 px-6 py-3 flex items-center justify-between">
          <h3 className="font-heading text-base font-bold text-white flex items-center gap-2">
            <Eye className="h-4 w-4" /> Scored Posts History
          </h3>
          <span className="font-body text-xs text-white/60">{history.length} posts</span>
        </div>
        <div className="p-5">
          {history.length === 0 ? (
            <p className="font-body text-sm text-muted-foreground py-6 text-center">No scored posts yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Date", "Platform", "Type", "Media", "Topic", "Campaign", "Referrals", "Est. Value", ""].map((h) => (
                      <th key={h} className={`font-body text-[10px] uppercase tracking-wider font-semibold text-muted-foreground py-2.5 pr-3 ${h === "Referrals" || h === "Est. Value" ? "text-right" : ""}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.predictionId} className="border-b border-border/40 last:border-0 hover:bg-amber-50/30 transition-colors">
                      <td className="font-body text-xs text-muted-foreground py-3 pr-3 whitespace-nowrap">{formatDate(h.scoredAtUtc)}</td>
                      <td className="py-3 pr-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${PLATFORM_META[h.platform]?.badge ?? "bg-gray-100 text-gray-700 border-gray-200"}`}>
                          {h.platform}
                        </span>
                      </td>
                      <td className="font-body text-xs text-foreground py-3 pr-3">{h.postType}</td>
                      <td className="font-body text-xs text-foreground py-3 pr-3">{h.mediaType}</td>
                      <td className="font-body text-xs text-foreground py-3 pr-3">{h.contentTopic}</td>
                      <td className="font-body text-xs text-muted-foreground py-3 pr-3">{h.campaignName ?? "—"}</td>
                      <td className="font-body text-xs font-bold text-amber-700 py-3 pr-3 text-right">{h.predictedReferrals.toFixed(1)}</td>
                      <td className="font-body text-xs font-semibold text-foreground py-3 pr-3 text-right">{formatCurrency(h.predictedDonationValuePhp)}</td>
                      <td className="py-3">
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${CONFIDENCE_STYLES[h.predictionConfidence] ?? ""}`}>
                          {h.predictionConfidence}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Shared Components ─────────────────────────────────────────────────

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="font-body text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

const ACCENT_MAP: Record<string, { bg: string; text: string; border: string }> = {
  orange:  { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-100" },
  rose:    { bg: "bg-rose-50",    text: "text-rose-700",    border: "border-rose-100" },
  purple:  { bg: "bg-stone-50",   text: "text-stone-700",   border: "border-stone-200" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" },
  amber:   { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-100" },
  slate:   { bg: "bg-slate-50",   text: "text-slate-600",   border: "border-slate-200" },
};

function ResultCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  const a = ACCENT_MAP[accent] ?? ACCENT_MAP.orange;
  return (
    <div className={`rounded-xl border ${a.border} ${a.bg} p-3`}>
      <p className="font-body text-[9px] uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className={`font-heading text-lg font-bold ${a.text}`}>{value}</p>
      <p className="font-body text-[10px] text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}

const BAR_GRADIENTS: Record<string, string> = {
  orange: "from-amber-500 to-amber-600",
  rose:   "from-rose-400 to-rose-500",
  purple: "from-stone-400 to-stone-500",
};

function BreakdownCard({ title, items, color }: { title: string; items: { label: string; count: number; avg: number }[]; color: string }) {
  const maxAvg = Math.max(...items.map((i) => i.avg), 1);
  const gradient = BAR_GRADIENTS[color] ?? BAR_GRADIENTS.orange;
  return (
    <div className="bg-white rounded-2xl border border-border shadow-soft p-5">
      <h4 className="font-heading text-sm font-bold text-foreground mb-4">{title}</h4>
      <div className="space-y-3.5">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-body text-xs font-medium text-foreground">{item.label}</span>
              <span className="font-body text-[10px] text-muted-foreground">{item.avg} avg · {item.count} posts</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-500`}
                style={{ width: `${(item.avg / maxAvg) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────

const PostingCalendarPage = () => {
  return (
    <AdminLayout
      title="Posting Calendar"
      subtitle="Social media planning for Hope Harbor"
    >
      <SunsetBanner />

      <Tabs defaultValue="calendar" className="space-y-5">
        <TabsList className="bg-stone-100 border border-stone-200 p-1">
          <TabsTrigger value="calendar" className="gap-1.5 font-body text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <CalendarClock className="h-3.5 w-3.5" />
            Weekly Plan
          </TabsTrigger>
          <TabsTrigger value="composer" className="gap-1.5 font-body text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Send className="h-3.5 w-3.5" />
            Post Composer
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5 font-body text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <TrendingUp className="h-3.5 w-3.5" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <CalendarTab />
        </TabsContent>
        <TabsContent value="composer">
          <ComposerTab />
        </TabsContent>
        <TabsContent value="analytics">
          <AnalyticsTab />
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default PostingCalendarPage;
