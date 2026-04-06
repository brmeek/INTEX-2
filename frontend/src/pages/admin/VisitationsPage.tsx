import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Visitation {
  visitationId: number;
  residentId: number;
  visitDate: string;
  socialWorker: string;
  visitType: string;
  locationVisited: string;
  familyMembersPresent: string;
  purpose: string;
  observations: string;
  familyCooperationLevel: string;
  safetyConcernsNoted: boolean;
  followUpNeeded: boolean;
  followUpNotes: string | null;
  visitOutcome: string;
  resident?: { firstName: string; lastName: string };
}

interface Conference {
  planId: number;
  residentId: number;
  planCategory: string;
  status: string;
  caseConferenceDate: string;
  servicesProvided: string;
  resident?: { firstName: string; lastName: string };
}

const VisitationsPage = () => {
  const { toast } = useToast();
  const [tab, setTab] = useState<"visits" | "conferences">("visits");
  const [visits, setVisits] = useState<Visitation[]>([]);
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [totalV, setTotalV] = useState(0);
  const [totalC, setTotalC] = useState(0);
  const [pageV, setPageV] = useState(1);
  const [pageC, setPageC] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    residentId: "", visitDate: "", socialWorker: "", visitType: "Routine Follow-Up",
    locationVisited: "", familyMembersPresent: "", purpose: "", observations: "",
    familyCooperationLevel: "Cooperative", safetyConcernsNoted: false, followUpNeeded: false, followUpNotes: "",
  });

  const loadVisits = async (p = 1) => {
    setLoading(true);
    try {
      const data = await api.get<{ items: Visitation[]; total: number }>(`/api/homevisitations?page=${p}&pageSize=15`);
      setVisits(data.items);
      setTotalV(data.total);
      setPageV(p);
    } catch { /* empty */ }
    setLoading(false);
  };

  const loadConferences = async (p = 1) => {
    setLoading(true);
    try {
      const data = await api.get<{ items: Conference[]; total: number }>(`/api/interventionplans?page=${p}&pageSize=15`);
      setConferences(data.items);
      setTotalC(data.total);
      setPageC(p);
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => {
    if (tab === "visits") loadVisits();
    else loadConferences();
  }, [tab]);

  const handleSave = async () => {
    try {
      await api.post("/api/homevisitations", { ...form, residentId: Number(form.residentId) });
      toast({ title: "Saved", description: "Home visitation recorded." });
      setShowForm(false);
      loadVisits();
    } catch (e) {
      toast({ title: "Error", description: String(e), variant: "destructive" });
    }
  };

  const inputClass = "w-full px-3 py-2 rounded-lg border border-border bg-secondary font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent";

  return (
    <AdminLayout title="Visitations & Conferences" subtitle="Home visits, field visits, and case conferences">
      <div className="space-y-4">
        <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit">
          <button onClick={() => setTab("visits")} className={`px-4 py-2 rounded-md text-sm font-body font-semibold transition-all ${tab === "visits" ? "bg-white shadow-soft text-foreground" : "text-muted-foreground"}`}>
            Home Visitations
          </button>
          <button onClick={() => setTab("conferences")} className={`px-4 py-2 rounded-md text-sm font-body font-semibold transition-all ${tab === "conferences" ? "bg-white shadow-soft text-foreground" : "text-muted-foreground"}`}>
            Case Conferences
          </button>
        </div>

        {tab === "visits" && (
          <div className="flex justify-end">
            <Button onClick={() => setShowForm(!showForm)} size="sm" className="bg-accent text-white hover:bg-teal-light font-body gap-1">
              <Plus className="h-4 w-4" /> Log Visit
            </Button>
          </div>
        )}

        {showForm && tab === "visits" && (
          <div className="bg-white rounded-xl p-6 shadow-card border border-border">
            <h3 className="font-heading text-lg font-bold mb-4">New Home Visitation</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
              <input className={inputClass} placeholder="Resident ID" value={form.residentId} onChange={(e) => setForm({ ...form, residentId: e.target.value })} />
              <input type="date" className={inputClass} value={form.visitDate} onChange={(e) => setForm({ ...form, visitDate: e.target.value })} />
              <input className={inputClass} placeholder="Social Worker" value={form.socialWorker} onChange={(e) => setForm({ ...form, socialWorker: e.target.value })} />
              <select className={inputClass} value={form.visitType} onChange={(e) => setForm({ ...form, visitType: e.target.value })}>
                <option>Initial Assessment</option><option>Routine Follow-Up</option><option>Reintegration Assessment</option><option>Post-Placement Monitoring</option><option>Emergency</option>
              </select>
              <input className={inputClass} placeholder="Location Visited" value={form.locationVisited} onChange={(e) => setForm({ ...form, locationVisited: e.target.value })} />
              <select className={inputClass} value={form.familyCooperationLevel} onChange={(e) => setForm({ ...form, familyCooperationLevel: e.target.value })}>
                <option>Cooperative</option><option>Neutral</option><option>Uncooperative</option>
              </select>
            </div>
            <textarea className={`${inputClass} mb-3`} rows={2} placeholder="Observations" value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} />
            <div className="flex flex-wrap gap-4 mb-4 text-sm font-body">
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.safetyConcernsNoted} onChange={(e) => setForm({ ...form, safetyConcernsNoted: e.target.checked })} /> Safety Concerns</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.followUpNeeded} onChange={(e) => setForm({ ...form, followUpNeeded: e.target.checked })} /> Follow-up Needed</label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm" className="bg-navy text-white hover:bg-navy-light font-body">Save Visit</Button>
              <Button onClick={() => setShowForm(false)} variant="ghost" size="sm" className="font-body">Cancel</Button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-soft border border-border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-32"><div className="animate-spin h-6 w-6 border-4 border-accent border-t-transparent rounded-full" /></div>
          ) : tab === "visits" ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resident</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Worker</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cooperation</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Safety</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Outcome</th>
                  </tr></thead>
                  <tbody>
                    {visits.map((v) => (
                      <tr key={v.visitationId} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-body text-sm">{v.visitDate}</td>
                        <td className="px-4 py-3 font-body text-sm font-medium">{v.resident?.firstName} {v.resident?.lastName}</td>
                        <td className="px-4 py-3 font-body text-xs">{v.visitType}</td>
                        <td className="px-4 py-3 font-body text-sm text-muted-foreground">{v.socialWorker}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${v.familyCooperationLevel === "Cooperative" ? "bg-green-100 text-green-700" : v.familyCooperationLevel === "Uncooperative" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{v.familyCooperationLevel}</span></td>
                        <td className="px-4 py-3 font-body text-sm">{v.safetyConcernsNoted ? "⚠️ Yes" : "No"}</td>
                        <td className="px-4 py-3 font-body text-sm text-muted-foreground">{v.visitOutcome}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                <p className="font-body text-xs text-muted-foreground">{totalV} visitations</p>
                <div className="flex gap-1">
                  <Button onClick={() => loadVisits(pageV - 1)} disabled={pageV <= 1} variant="ghost" size="sm"><ChevronLeft className="h-4 w-4" /></Button>
                  <span className="font-body text-sm px-2 py-1">Page {pageV}</span>
                  <Button onClick={() => loadVisits(pageV + 1)} disabled={pageV * 15 >= totalV} variant="ghost" size="sm"><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Conference Date</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resident</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Services</th>
                  </tr></thead>
                  <tbody>
                    {conferences.map((c) => (
                      <tr key={c.planId} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-body text-sm">{c.caseConferenceDate || "—"}</td>
                        <td className="px-4 py-3 font-body text-sm font-medium">{c.resident?.firstName} {c.resident?.lastName}</td>
                        <td className="px-4 py-3 font-body text-sm text-muted-foreground">{c.planCategory}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${c.status === "Achieved" ? "bg-green-100 text-green-700" : c.status === "In Progress" ? "bg-blue-100 text-blue-700" : "bg-secondary text-muted-foreground"}`}>{c.status}</span></td>
                        <td className="px-4 py-3 font-body text-xs text-muted-foreground">{c.servicesProvided}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                <p className="font-body text-xs text-muted-foreground">{totalC} plans</p>
                <div className="flex gap-1">
                  <Button onClick={() => loadConferences(pageC - 1)} disabled={pageC <= 1} variant="ghost" size="sm"><ChevronLeft className="h-4 w-4" /></Button>
                  <span className="font-body text-sm px-2 py-1">Page {pageC}</span>
                  <Button onClick={() => loadConferences(pageC + 1)} disabled={pageC * 15 >= totalC} variant="ghost" size="sm"><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default VisitationsPage;
