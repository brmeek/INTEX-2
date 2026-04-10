import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Recording {
  recordingId: number;
  residentId: number;
  sessionDate: string;
  socialWorker: string;
  sessionType: string;
  emotionalState: string;
  narrativeSummary: string;
  interventionsApplied: string;
  followUpActions: string;
  resident?: { firstName: string; lastName: string };
}

const ProcessRecordingsPage = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Recording[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Recording | null>(null);
  const [form, setForm] = useState({
    residentId: "", sessionDate: "", socialWorker: "", sessionType: "Individual",
    emotionalState: "", narrativeSummary: "", interventionsApplied: "", followUpActions: "",
  });

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const data = await api.get<{ items: Recording[]; total: number }>(`/api/processrecordings?page=${p}&pageSize=15`);
      setItems(data.items);
      setTotal(data.total);
      setPage(p);
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    const residentId = Number(form.residentId);
    if (!Number.isFinite(residentId) || residentId <= 0) {
      toast({ title: "Resident Required", description: "Please enter a valid resident ID.", variant: "destructive" });
      return;
    }
    if (!form.sessionDate) {
      toast({ title: "Session Date Required", description: "Please select a session date.", variant: "destructive" });
      return;
    }
    if (!form.socialWorker.trim()) {
      toast({ title: "Social Worker Required", description: "Please enter a social worker.", variant: "destructive" });
      return;
    }
    if (!form.emotionalState.trim()) {
      toast({ title: "Emotional State Required", description: "Please enter the observed emotional state.", variant: "destructive" });
      return;
    }
    if (!form.narrativeSummary.trim()) {
      toast({ title: "Narrative Required", description: "Please enter a narrative summary.", variant: "destructive" });
      return;
    }
    if (!form.interventionsApplied.trim()) {
      toast({ title: "Interventions Required", description: "Please enter interventions applied.", variant: "destructive" });
      return;
    }
    if (!form.followUpActions.trim()) {
      toast({ title: "Follow-up Required", description: "Please enter follow-up actions.", variant: "destructive" });
      return;
    }

    try {
      const body = { ...form, residentId };
      await api.post("/api/processrecordings", body);
      toast({ title: "Saved", description: "Process recording created." });
      setShowForm(false);
      setForm({ residentId: "", sessionDate: "", socialWorker: "", sessionType: "Individual", emotionalState: "", narrativeSummary: "", interventionsApplied: "", followUpActions: "" });
      load();
    } catch (e) {
      toast({ title: "Error", description: getApiErrorMessage(e), variant: "destructive" });
    }
  };

  const inputClass = "w-full px-3 py-2 rounded-lg border border-border bg-secondary font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent";

  return (
    <AdminLayout title="Process Recordings" subtitle="Counseling session documentation">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="font-body text-sm text-muted-foreground">{total} recordings on file</p>
          <Button onClick={() => setShowForm(true)} size="sm" className="bg-accent text-white hover:bg-teal-light font-body gap-1">
            <Plus className="h-4 w-4" /> New Recording
          </Button>
        </div>

        {showForm && (
          <div className="bg-card rounded-xl p-6 shadow-card border border-border">
            <h3 className="font-heading text-lg font-bold mb-4">New Process Recording</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
              <input className={inputClass} placeholder="Resident ID" value={form.residentId} onChange={(e) => setForm({ ...form, residentId: e.target.value })} />
              <input type="date" className={inputClass} value={form.sessionDate} onChange={(e) => setForm({ ...form, sessionDate: e.target.value })} />
              <input className={inputClass} placeholder="Social Worker (e.g. SW-04)" value={form.socialWorker} onChange={(e) => setForm({ ...form, socialWorker: e.target.value })} />
              <select className={inputClass} value={form.sessionType} onChange={(e) => setForm({ ...form, sessionType: e.target.value })}>
                <option>Individual</option><option>Group</option>
              </select>
              <input className={inputClass} placeholder="Emotional State" value={form.emotionalState} onChange={(e) => setForm({ ...form, emotionalState: e.target.value })} />
            </div>
            <textarea className={`${inputClass} mb-3`} rows={3} placeholder="Narrative Summary" value={form.narrativeSummary} onChange={(e) => setForm({ ...form, narrativeSummary: e.target.value })} />
            <textarea className={`${inputClass} mb-3`} rows={2} placeholder="Interventions Applied" value={form.interventionsApplied} onChange={(e) => setForm({ ...form, interventionsApplied: e.target.value })} />
            <textarea className={`${inputClass} mb-4`} rows={2} placeholder="Follow-up Actions" value={form.followUpActions} onChange={(e) => setForm({ ...form, followUpActions: e.target.value })} />
            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm" className="bg-navy text-white hover:bg-navy-light font-body">Save Recording</Button>
              <Button onClick={() => setShowForm(false)} variant="ghost" size="sm" className="font-body">Cancel</Button>
            </div>
          </div>
        )}

        <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
          <DialogContent className="max-w-3xl border-border bg-card p-0 sm:rounded-2xl">
            {selected && (
              <div className="overflow-hidden rounded-2xl">
                <div className="border-b border-border px-6 py-5 pr-14">
                  <DialogHeader className="space-y-2 text-left">
                    <DialogTitle className="font-heading text-xl font-bold text-foreground">
                      {selected.resident?.firstName} {selected.resident?.lastName}
                    </DialogTitle>
                    <DialogDescription className="font-body text-sm text-muted-foreground">
                      {selected.sessionDate} · {selected.sessionType} Session · {selected.socialWorker}
                    </DialogDescription>
                  </DialogHeader>
                </div>
                <div className="space-y-4 px-6 py-5 font-body text-sm">
                  <div>
                    <span className="font-semibold text-foreground">Emotional State:</span>{" "}
                    <span className="text-muted-foreground">{selected.emotionalState}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Narrative:</span>
                    <p className="mt-1 text-muted-foreground leading-relaxed">{selected.narrativeSummary}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Interventions:</span>
                    <p className="mt-1 text-muted-foreground leading-relaxed">{selected.interventionsApplied}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Follow-up:</span>
                    <p className="mt-1 text-muted-foreground leading-relaxed">{selected.followUpActions}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-32"><div className="animate-spin h-6 w-6 border-4 border-accent border-t-transparent rounded-full" /></div>
          ) : (
            <>
              <div className="md:hidden space-y-3 p-3">
                {items.map((r) => (
                  <button
                    key={r.recordingId}
                    type="button"
                    className="w-full text-left rounded-lg border border-border bg-background p-4 space-y-2"
                    onClick={() => setSelected(r)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-body text-sm font-semibold text-foreground">{r.resident?.firstName} {r.resident?.lastName}</p>
                        <p className="font-body text-xs text-muted-foreground">{r.sessionDate} · {r.socialWorker}</p>
                      </div>
                      <span className="text-xs font-body px-2 py-1 rounded-full bg-secondary">{r.sessionType}</span>
                    </div>
                    <p className="font-body text-xs text-muted-foreground">Emotional state: {r.emotionalState}</p>
                    <p className="font-body text-xs text-muted-foreground line-clamp-2">{r.narrativeSummary}</p>
                  </button>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[860px]">
                  <thead><tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resident</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Social Worker</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Emotional State</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Summary</th>
                  </tr></thead>
                  <tbody>
                    {items.map((r) => (
                      <tr key={r.recordingId} className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setSelected(r)}>
                        <td className="px-4 py-3 font-body text-sm">{r.sessionDate}</td>
                        <td className="px-4 py-3 font-body text-sm font-medium">{r.resident?.firstName} {r.resident?.lastName}</td>
                        <td className="px-4 py-3 font-body text-sm text-muted-foreground">{r.socialWorker}</td>
                        <td className="px-4 py-3"><span className="text-xs font-body px-2 py-1 rounded-full bg-secondary">{r.sessionType}</span></td>
                        <td className="px-4 py-3 font-body text-sm text-muted-foreground">{r.emotionalState}</td>
                        <td className="px-4 py-3 font-body text-sm text-muted-foreground max-w-xs truncate">{r.narrativeSummary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                <p className="font-body text-xs text-muted-foreground">{total} recordings</p>
                <div className="flex gap-1">
                  <Button onClick={() => load(page - 1)} disabled={page <= 1} variant="ghost" size="sm"><ChevronLeft className="h-4 w-4" /></Button>
                  <span className="font-body text-sm px-2 py-1">Page {page}</span>
                  <Button onClick={() => load(page + 1)} disabled={page * 15 >= total} variant="ghost" size="sm"><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ProcessRecordingsPage;
