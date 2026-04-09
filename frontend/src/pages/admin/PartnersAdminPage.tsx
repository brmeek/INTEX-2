import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Partner {
  partnerId: number;
  partnerName: string;
  partnerType: string;
  roleType: string;
  contactName: string;
  email: string;
  phone: string;
  region: string;
  status: string;
}

const PartnersAdminPage = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Partner[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Partner | null>(null);
  const [partnerToDelete, setPartnerToDelete] = useState<Partner | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [form, setForm] = useState({
    partnerName: "", partnerType: "Individual", roleType: "SafehouseOps",
    contactName: "", email: "", phone: "", region: "Luzon", status: "Active", notes: "",
  });

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const data = await api.get<{ items: Partner[]; total: number }>(`/api/partners?page=${p}&pageSize=15`);
      setItems(data.items);
      setTotal(data.total);
      setPage(p);
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    try {
      if (editItem) {
        await api.put(`/api/partners/${editItem.partnerId}`, { ...editItem, ...form });
        toast({ title: "Updated" });
      } else {
        await api.post("/api/partners", form);
        toast({ title: "Created" });
      }
      setShowForm(false);
      setEditItem(null);
      load();
    } catch (e) {
      toast({ title: "Error", description: String(e), variant: "destructive" });
    }
  };

  const executeDeletePartner = async () => {
    if (!partnerToDelete) return;
    if (
      !window.confirm(
        `Delete partner "${partnerToDelete.partnerName}"? They will be removed from the partners list and this cannot be undone.`
      )
    ) {
      return;
    }
    setDeletePending(true);
    try {
      await api.delete(`/api/partners/${partnerToDelete.partnerId}`);
      toast({ title: "Deleted" });
      setPartnerToDelete(null);
      load();
    } catch (e) {
      toast({ title: "Error", description: String(e), variant: "destructive" });
    } finally {
      setDeletePending(false);
    }
  };

  const inputClass = "w-full px-3 py-2 rounded-lg border border-border bg-secondary font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent";

  return (
    <AdminLayout title="Partners" subtitle="In-country partners and contractors">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => { setEditItem(null); setShowForm(true); }} size="sm" className="bg-accent text-white hover:bg-teal-light font-body gap-1">
            <Plus className="h-4 w-4" /> Add Partner
          </Button>
        </div>

        {showForm && (
          <div className="bg-card rounded-xl p-6 shadow-card border border-border">
            <h3 className="font-heading text-lg font-bold mb-4">{editItem ? "Edit" : "New"} Partner</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              <input className={inputClass} placeholder="Name" value={form.partnerName} onChange={(e) => setForm({ ...form, partnerName: e.target.value })} />
              <select className={inputClass} value={form.partnerType} onChange={(e) => setForm({ ...form, partnerType: e.target.value })}>
                <option>Individual</option><option>Organization</option>
              </select>
              <select className={inputClass} value={form.roleType} onChange={(e) => setForm({ ...form, roleType: e.target.value })}>
                <option>SafehouseOps</option><option>Education</option><option>Evaluation</option><option>Logistics</option><option>Maintenance</option><option>Transport</option><option>FindSafehouse</option>
              </select>
              <input className={inputClass} placeholder="Contact Name" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
              <input className={inputClass} placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input className={inputClass} placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <select className={inputClass} value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}>
                <option>Luzon</option><option>Visayas</option><option>Mindanao</option>
              </select>
              <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option>Active</option><option>Inactive</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm" className="bg-navy text-white hover:bg-navy-light font-body">Save</Button>
              <Button onClick={() => setShowForm(false)} variant="ghost" size="sm" className="font-body">Cancel</Button>
            </div>
          </div>
        )}

        <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-32"><div className="animate-spin h-6 w-6 border-4 border-accent border-t-transparent rounded-full" /></div>
          ) : (
            <>
              <div className="md:hidden space-y-3 p-3">
                {items.map((p) => (
                  <div key={p.partnerId} className="rounded-lg border border-border bg-background p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-body text-sm font-semibold text-foreground">{p.partnerName}</p>
                        <p className="font-body text-xs text-muted-foreground mt-1">{p.roleType} · {p.region}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${p.status === "Active" ? "bg-teal/10 text-teal" : "bg-muted text-muted-foreground"}`}>
                        {p.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-secondary">{p.partnerType}</span>
                    </div>
                    <p className="font-body text-xs text-muted-foreground break-all">{p.email}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => { setEditItem(p); setForm({ partnerName: p.partnerName, partnerType: p.partnerType, roleType: p.roleType, contactName: p.contactName, email: p.email, phone: p.phone, region: p.region, status: p.status, notes: "" }); setShowForm(true); }} variant="ghost" size="sm" className="text-xs font-body h-7">Edit</Button>
                      <Button
                        onClick={() => setPartnerToDelete(p)}
                        disabled={deletePending}
                        variant="ghost"
                        size="sm"
                        className="text-xs font-body h-7 text-destructive"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead><tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Region</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr></thead>
                  <tbody>
                    {items.map((p) => (
                      <tr key={p.partnerId} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-body text-sm font-medium">{p.partnerName}</td>
                        <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full bg-secondary">{p.partnerType}</span></td>
                        <td className="px-4 py-3 font-body text-sm text-muted-foreground">{p.roleType}</td>
                        <td className="px-4 py-3 font-body text-sm text-muted-foreground">{p.region}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${p.status === "Active" ? "bg-teal/10 text-teal" : "bg-muted text-muted-foreground"}`}>{p.status}</span></td>
                        <td className="px-4 py-3 font-body text-xs text-muted-foreground">{p.email}</td>
                        <td className="px-4 py-3 flex gap-1">
                          <Button onClick={() => { setEditItem(p); setForm({ partnerName: p.partnerName, partnerType: p.partnerType, roleType: p.roleType, contactName: p.contactName, email: p.email, phone: p.phone, region: p.region, status: p.status, notes: "" }); setShowForm(true); }} variant="ghost" size="sm" className="text-xs font-body h-7">Edit</Button>
                          <Button
                            onClick={() => setPartnerToDelete(p)}
                            disabled={deletePending}
                            variant="ghost"
                            size="sm"
                            className="text-xs font-body h-7 text-destructive"
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                <p className="font-body text-xs text-muted-foreground">{total} partners</p>
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
        open={partnerToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deletePending) setPartnerToDelete(null);
        }}
        title="Delete this partner?"
        description={
          partnerToDelete ? (
            <>
              Remove <span className="font-medium text-foreground">{partnerToDelete.partnerName}</span> from the partners list. This cannot be undone.
            </>
          ) : (
            "This removes them from the partners list. This cannot be undone."
          )
        }
        pending={deletePending}
        onConfirm={executeDeletePartner}
      />
    </AdminLayout>
  );
};

export default PartnersAdminPage;
