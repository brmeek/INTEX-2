import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Resident {
  residentId: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  gender: string;
  admissionDate: string | null;
  caseStatus: string;
  caseCategory: string;
  caseSubcategory: string | null;
  hasDisability: boolean;
  is4PsBeneficiary: boolean;
  isSoloParentChild: boolean;
  isIndigenous: boolean;
  isInformalSettler: boolean;
  safehouseId: number | null;
  assignedSocialWorker: string | null;
  reintegrationStatus: string | null;
  referralSource: string | null;
  safehouse?: { safehouseName: string };
  readinessScore?: number | null;
  readinessTier?: "High Readiness" | "Needs Monitoring" | "At Risk" | null;
  trendLabel?: "Improving" | "Stable" | "Early Decline" | "Declining" | "Insufficient History" | null;
  monthOverMonthChange?: number | null;
  firstVsLatestChange?: number | null;
  initialVsLatestChange?: number | null;
  trajectorySlope?: number | null;
  historyMonthsUsed?: number | null;
  topConcernFeature?: string | null;
  readinessScoredAtUtc?: string | null;
}

const CaseloadPage = () => {
  const { toast } = useToast();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshingReadiness, setRefreshingReadiness] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Resident | null>(null);
  const [residentToDelete, setResidentToDelete] = useState<Resident | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", gender: "Female", caseStatus: "Active", caseCategory: "Trafficked",
    caseSubcategory: "", admissionDate: "", safehouseId: "", assignedSocialWorker: "", referralSource: "",
    hasDisability: false, is4PsBeneficiary: false, isSoloParentChild: false, isIndigenous: false, isInformalSettler: false,
  });

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: "15" });
      if (search) params.set("search", search);
      if (statusFilter) params.set("caseStatus", statusFilter);
      if (categoryFilter) params.set("caseCategory", categoryFilter);
      const data = await api.get<{ items: Resident[]; total: number }>(`/api/residents?${params}`);
      setResidents(data.items);
      setTotal(data.total);
      setPage(p);
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter, categoryFilter]);

  const handleSave = async () => {
    try {
      const body = { ...form, safehouseId: form.safehouseId ? Number(form.safehouseId) : null };
      if (editItem) {
        await api.put(`/api/residents/${editItem.residentId}`, body);
        toast({ title: "Updated", description: "Resident record updated." });
      } else {
        await api.post("/api/residents", body);
        toast({ title: "Created", description: "New resident added." });
      }
      setShowForm(false);
      setEditItem(null);
      load();
    } catch (e) {
      toast({ title: "Error", description: String(e), variant: "destructive" });
    }
  };

  const executeDeleteResident = async () => {
    if (!residentToDelete) return;
    setDeletePending(true);
    try {
      await api.delete(`/api/residents/${residentToDelete.residentId}`);
      toast({ title: "Deleted", description: "Record removed." });
      setResidentToDelete(null);
      load();
    } catch (e) {
      toast({ title: "Error", description: String(e), variant: "destructive" });
    } finally {
      setDeletePending(false);
    }
  };

  const handleRefreshReadiness = async () => {
    setRefreshingReadiness(true);
    try {
      const result = await api.post<{ scoredCount?: number; message?: string; inProgress?: boolean }>("/api/residents/readiness/refresh", {});
      toast({
        title: "Readiness refreshed",
        description: result.inProgress
          ? (result.message ?? "Refresh started in the background. Scores will update shortly.")
          : `Updated readiness scores for ${result.scoredCount ?? 0} residents.`,
      });
      await load(page);
      setTimeout(() => {
        load(page);
      }, 2500);
    } catch (e) {
      toast({ title: "Error", description: String(e), variant: "destructive" });
    } finally {
      setRefreshingReadiness(false);
    }
  };

  const openEdit = (r: Resident) => {
    setEditItem(r);
    setForm({
      firstName: r.firstName, lastName: r.lastName, gender: r.gender, caseStatus: r.caseStatus,
      caseCategory: r.caseCategory, caseSubcategory: r.caseSubcategory || "",
      admissionDate: r.admissionDate || "", safehouseId: r.safehouseId ? String(r.safehouseId) : "",
      assignedSocialWorker: r.assignedSocialWorker || "", referralSource: r.referralSource || "",
      hasDisability: r.hasDisability, is4PsBeneficiary: r.is4PsBeneficiary,
      isSoloParentChild: r.isSoloParentChild, isIndigenous: r.isIndigenous, isInformalSettler: r.isInformalSettler,
    });
    setShowForm(true);
  };

  const inputClass = "w-full px-3 py-2 rounded-lg border border-border bg-secondary font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent";
  const getReadinessPillClass = (tier?: string | null) => {
    if (tier === "High Readiness") return "bg-emerald-100 text-emerald-700";
    if (tier === "Needs Monitoring") return "bg-amber-100 text-amber-700";
    if (tier === "At Risk") return "bg-red-100 text-red-700";
    return "bg-muted text-muted-foreground";
  };
  const getTrendPillClass = (trend?: string | null) => {
    if (trend === "Improving") return "bg-emerald-100 text-emerald-700";
    if (trend === "Stable") return "bg-blue-100 text-blue-700";
    if (trend === "Early Decline") return "bg-amber-100 text-amber-700";
    if (trend === "Declining") return "bg-red-100 text-red-700";
    return "bg-muted text-muted-foreground";
  };

  return (
    <AdminLayout title="Caseload Inventory" subtitle="Manage resident profiles and case records">
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="Search by name..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-border bg-white font-body text-sm">
            <option value="">All Statuses</option>
            <option>Active</option><option>Reintegrated</option><option>Transferred</option><option>Discharged</option>
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-border bg-white font-body text-sm">
            <option value="">All Categories</option>
            <option>Trafficked</option><option>PhysicalAbuse</option><option>SexualAbuse</option><option>Neglected</option><option>Abandoned</option>
          </select>
          <Button onClick={() => { setEditItem(null); setForm({ firstName: "", lastName: "", gender: "Female", caseStatus: "Active", caseCategory: "Trafficked", caseSubcategory: "", admissionDate: "", safehouseId: "", assignedSocialWorker: "", referralSource: "", hasDisability: false, is4PsBeneficiary: false, isSoloParentChild: false, isIndigenous: false, isInformalSettler: false }); setShowForm(true); }} size="sm" className="bg-accent text-white hover:bg-teal-light font-body gap-1">
            <Plus className="h-4 w-4" /> Add Resident
          </Button>
          <Button
            onClick={handleRefreshReadiness}
            disabled={refreshingReadiness}
            size="sm"
            variant="secondary"
            className="font-body"
          >
            {refreshingReadiness ? "Refreshing..." : "Refresh Readiness Scores"}
          </Button>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-soft border border-border">
          <p className="font-body text-xs text-muted-foreground">
            Label guide: <span className="font-semibold text-foreground">Readiness (Current Level)</span> shows the resident's present risk/readiness state.
            <span className="font-semibold text-foreground"> Trend (Recent Direction)</span> shows whether the trajectory is improving, stable, or declining over recent months.
          </p>
          <p className="font-body text-xs text-muted-foreground mt-1">
            Example: <span className="font-semibold text-foreground">Stable + At Risk</span> means consistently low readiness that is not rapidly worsening.
          </p>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-xl p-6 shadow-card border border-border">
            <h3 className="font-heading text-lg font-bold mb-4">{editItem ? "Edit" : "New"} Resident</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
              <input className={inputClass} placeholder="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              <input className={inputClass} placeholder="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              <select className={inputClass} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option>Female</option><option>Male</option>
              </select>
              <select className={inputClass} value={form.caseStatus} onChange={(e) => setForm({ ...form, caseStatus: e.target.value })}>
                <option>Active</option><option>Reintegrated</option><option>Transferred</option><option>Discharged</option>
              </select>
              <select className={inputClass} value={form.caseCategory} onChange={(e) => setForm({ ...form, caseCategory: e.target.value })}>
                <option>Trafficked</option><option>PhysicalAbuse</option><option>SexualAbuse</option><option>Neglected</option><option>Abandoned</option>
              </select>
              <input className={inputClass} placeholder="Sub-category" value={form.caseSubcategory} onChange={(e) => setForm({ ...form, caseSubcategory: e.target.value })} />
              <input type="date" className={inputClass} value={form.admissionDate} onChange={(e) => setForm({ ...form, admissionDate: e.target.value })} />
              <input className={inputClass} placeholder="Safehouse ID" value={form.safehouseId} onChange={(e) => setForm({ ...form, safehouseId: e.target.value })} />
              <input className={inputClass} placeholder="Assigned Social Worker" value={form.assignedSocialWorker} onChange={(e) => setForm({ ...form, assignedSocialWorker: e.target.value })} />
              <input className={inputClass} placeholder="Referral Source" value={form.referralSource} onChange={(e) => setForm({ ...form, referralSource: e.target.value })} />
            </div>
            <div className="flex flex-wrap gap-4 mb-4 text-sm font-body">
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.hasDisability} onChange={(e) => setForm({ ...form, hasDisability: e.target.checked })} /> Has Disability</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.is4PsBeneficiary} onChange={(e) => setForm({ ...form, is4PsBeneficiary: e.target.checked })} /> 4Ps Beneficiary</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.isSoloParentChild} onChange={(e) => setForm({ ...form, isSoloParentChild: e.target.checked })} /> Solo Parent</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.isIndigenous} onChange={(e) => setForm({ ...form, isIndigenous: e.target.checked })} /> Indigenous</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.isInformalSettler} onChange={(e) => setForm({ ...form, isInformalSettler: e.target.checked })} /> Informal Settler</label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm" className="bg-navy text-white hover:bg-navy-light font-body">Save</Button>
              <Button onClick={() => setShowForm(false)} variant="ghost" size="sm" className="font-body">Cancel</Button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl shadow-soft border border-border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-32"><div className="animate-spin h-6 w-6 border-4 border-accent border-t-transparent rounded-full" /></div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Readiness (Current Level)</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trend (Recent Direction)</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Safehouse</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Social Worker</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admitted</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr></thead>
                  <tbody>
                    {residents.map((r) => (
                      <tr key={r.residentId} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-body text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <span>{r.firstName} {r.lastName}</span>
                            {r.readinessTier && (
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getReadinessPillClass(r.readinessTier)}`}>
                                {r.readinessTier}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {r.readinessScore != null ? (
                            <span className={`text-xs font-body px-2 py-1 rounded-full ${getReadinessPillClass(r.readinessTier)}`}>
                              {(r.readinessScore * 100).toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-xs font-body text-muted-foreground">Not scored</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {r.trendLabel ? (
                            <span className={`text-xs font-body px-2 py-1 rounded-full ${getTrendPillClass(r.trendLabel)}`}>
                              {r.trendLabel}
                            </span>
                          ) : (
                            <span className="text-xs font-body text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3"><span className={`text-xs font-body px-2 py-1 rounded-full ${r.caseStatus === "Active" ? "bg-teal/10 text-teal" : r.caseStatus === "Reintegrated" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>{r.caseStatus}</span></td>
                        <td className="px-4 py-3 font-body text-sm text-muted-foreground">{r.caseCategory}</td>
                        <td className="px-4 py-3 font-body text-sm text-muted-foreground">{r.safehouse?.safehouseName || r.safehouseId || "—"}</td>
                        <td className="px-4 py-3 font-body text-sm text-muted-foreground">{r.assignedSocialWorker || "—"}</td>
                        <td className="px-4 py-3 font-body text-sm text-muted-foreground">{r.admissionDate || "—"}</td>
                        <td className="px-4 py-3 flex gap-1">
                          <Button onClick={() => openEdit(r)} variant="ghost" size="sm" className="text-xs font-body h-7">Edit</Button>
                          <Button onClick={() => setResidentToDelete(r)} variant="ghost" size="sm" className="text-xs font-body h-7 text-destructive">Delete</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                <p className="font-body text-xs text-muted-foreground">{total} residents</p>
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

      <DeleteConfirmDialog
        open={residentToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deletePending) setResidentToDelete(null);
        }}
        title="Delete this resident?"
        description={
          residentToDelete ? (
            <>
              Remove <span className="font-medium text-foreground">{residentToDelete.firstName} {residentToDelete.lastName}</span> from the caseload? This permanently removes their record and cannot be undone.
            </>
          ) : (
            "This permanently removes the record from the caseload. This cannot be undone."
          )
        }
        pending={deletePending}
        onConfirm={executeDeleteResident}
      />
    </AdminLayout>
  );
};

export default CaseloadPage;
