import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Supporter {
  supporterId: number;
  supporterName: string;
  supporterType: string;
  email: string;
  phone: string;
  status: string;
  totalGiven: number | null;
  region: string;
}

interface Donation {
  donationId: number;
  donationType: string;
  donationDate: string;
  amount: number | null;
  estimatedValue: number | null;
  campaignName: string | null;
  channelSource: string;
  isRecurring: boolean;
  supporter?: { supporterName: string };
}

const DonorsAdminPage = () => {
  const { toast } = useToast();
  const [tab, setTab] = useState<"supporters" | "donations">("supporters");
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [totalS, setTotalS] = useState(0);
  const [totalD, setTotalD] = useState(0);
  const [pageS, setPageS] = useState(1);
  const [pageD, setPageD] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Supporter | null>(null);
  const [form, setForm] = useState({ supporterName: "", supporterType: "Monetary", email: "", phone: "", status: "Active", region: "", notes: "" });

  const loadSupporters = async (p = 1) => {
    setLoading(true);
    try {
      const data = await api.get<{ items: Supporter[]; total: number }>(`/api/supporters?page=${p}&pageSize=15&search=${search}`);
      setSupporters(data.items);
      setTotalS(data.total);
      setPageS(p);
    } catch { /* empty */ }
    setLoading(false);
  };

  const loadDonations = async (p = 1) => {
    setLoading(true);
    try {
      const data = await api.get<{ items: Donation[]; total: number }>(`/api/donations?page=${p}&pageSize=15`);
      setDonations(data.items);
      setTotalD(data.total);
      setPageD(p);
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => {
    if (tab === "supporters") loadSupporters();
    else loadDonations();
  }, [tab]);

  const handleSave = async () => {
    try {
      if (editItem) {
        await api.put(`/api/supporters/${editItem.supporterId}`, { ...editItem, ...form });
        toast({ title: "Updated", description: "Supporter updated successfully." });
      } else {
        await api.post("/api/supporters", form);
        toast({ title: "Created", description: "New supporter added." });
      }
      setShowForm(false);
      setEditItem(null);
      setForm({ supporterName: "", supporterType: "Monetary", email: "", phone: "", status: "Active", region: "", notes: "" });
      loadSupporters();
    } catch (e) {
      toast({ title: "Error", description: String(e), variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this supporter?")) return;
    try {
      await api.delete(`/api/supporters/${id}`);
      toast({ title: "Deleted", description: "Supporter removed." });
      loadSupporters();
    } catch (e) {
      toast({ title: "Error", description: String(e), variant: "destructive" });
    }
  };

  const openEdit = (s: Supporter) => {
    setEditItem(s);
    setForm({ supporterName: s.supporterName, supporterType: s.supporterType, email: s.email, phone: s.phone, status: s.status, region: s.region, notes: "" });
    setShowForm(true);
  };

  const inputClass = "w-full px-3 py-2 rounded-lg border border-border bg-secondary font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent";

  return (
    <AdminLayout title="Donors & Contributions" subtitle="Manage supporters and track donations">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit">
          <button onClick={() => setTab("supporters")} className={`px-4 py-2 rounded-md text-sm font-body font-semibold transition-all ${tab === "supporters" ? "bg-white shadow-soft text-foreground" : "text-muted-foreground"}`}>
            Supporters
          </button>
          <button onClick={() => setTab("donations")} className={`px-4 py-2 rounded-md text-sm font-body font-semibold transition-all ${tab === "donations" ? "bg-white shadow-soft text-foreground" : "text-muted-foreground"}`}>
            Donations
          </button>
        </div>

        {/* Toolbar */}
        {tab === "supporters" && (
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && loadSupporters()} placeholder="Search supporters..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
            <Button onClick={() => { setEditItem(null); setForm({ supporterName: "", supporterType: "Monetary", email: "", phone: "", status: "Active", region: "", notes: "" }); setShowForm(true); }} size="sm" className="bg-accent text-white hover:bg-teal-light font-body gap-1">
              <Plus className="h-4 w-4" /> Add Supporter
            </Button>
          </div>
        )}

        {/* Form Modal */}
        {showForm && tab === "supporters" && (
          <div className="bg-white rounded-xl p-6 shadow-card border border-border">
            <h3 className="font-heading text-lg font-bold mb-4">{editItem ? "Edit" : "New"} Supporter</h3>
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <input className={inputClass} placeholder="Name" value={form.supporterName} onChange={(e) => setForm({ ...form, supporterName: e.target.value })} />
              <select className={inputClass} value={form.supporterType} onChange={(e) => setForm({ ...form, supporterType: e.target.value })}>
                <option>Monetary</option><option>Volunteer</option><option>Skills</option><option>InKind</option><option>SocialMedia</option>
              </select>
              <input className={inputClass} placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input className={inputClass} placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option>Active</option><option>Inactive</option><option>Lapsed</option>
              </select>
              <input className={inputClass} placeholder="Region" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
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
          ) : tab === "supporters" ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Given</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr></thead>
                  <tbody>
                    {supporters.map((s) => (
                      <tr key={s.supporterId} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-body text-sm font-medium">{s.supporterName}</td>
                        <td className="px-4 py-3"><span className="text-xs font-body px-2 py-1 rounded-full bg-secondary">{s.supporterType}</span></td>
                        <td className="px-4 py-3 font-body text-sm text-muted-foreground">{s.email}</td>
                        <td className="px-4 py-3"><span className={`text-xs font-body px-2 py-1 rounded-full ${s.status === "Active" ? "bg-teal/10 text-teal" : "bg-muted text-muted-foreground"}`}>{s.status}</span></td>
                        <td className="px-4 py-3 font-body text-sm">{s.totalGiven != null ? `₱${s.totalGiven.toLocaleString()}` : "—"}</td>
                        <td className="px-4 py-3 flex gap-1">
                          <Button onClick={() => openEdit(s)} variant="ghost" size="sm" className="text-xs font-body h-7">Edit</Button>
                          <Button onClick={() => handleDelete(s.supporterId)} variant="ghost" size="sm" className="text-xs font-body h-7 text-destructive">Delete</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                <p className="font-body text-xs text-muted-foreground">{totalS} supporters</p>
                <div className="flex gap-1">
                  <Button onClick={() => loadSupporters(pageS - 1)} disabled={pageS <= 1} variant="ghost" size="sm"><ChevronLeft className="h-4 w-4" /></Button>
                  <span className="font-body text-sm px-2 py-1">Page {pageS}</span>
                  <Button onClick={() => loadSupporters(pageS + 1)} disabled={pageS * 15 >= totalS} variant="ghost" size="sm"><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Supporter</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Campaign</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Channel</th>
                    <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recurring</th>
                  </tr></thead>
                  <tbody>
                    {donations.map((d) => (
                      <tr key={d.donationId} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-body text-sm">{d.donationDate}</td>
                        <td className="px-4 py-3 font-body text-sm font-medium">{d.supporter?.supporterName || "—"}</td>
                        <td className="px-4 py-3"><span className="text-xs font-body px-2 py-1 rounded-full bg-secondary">{d.donationType}</span></td>
                        <td className="px-4 py-3 font-body text-sm">{d.amount != null ? `₱${d.amount.toLocaleString()}` : d.estimatedValue != null ? `~₱${d.estimatedValue.toLocaleString()}` : "—"}</td>
                        <td className="px-4 py-3 font-body text-sm text-muted-foreground">{d.campaignName || "—"}</td>
                        <td className="px-4 py-3 font-body text-xs text-muted-foreground">{d.channelSource}</td>
                        <td className="px-4 py-3 font-body text-xs">{d.isRecurring ? "Yes" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                <p className="font-body text-xs text-muted-foreground">{totalD} donations</p>
                <div className="flex gap-1">
                  <Button onClick={() => loadDonations(pageD - 1)} disabled={pageD <= 1} variant="ghost" size="sm"><ChevronLeft className="h-4 w-4" /></Button>
                  <span className="font-body text-sm px-2 py-1">Page {pageD}</span>
                  <Button onClick={() => loadDonations(pageD + 1)} disabled={pageD * 15 >= totalD} variant="ghost" size="sm"><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default DonorsAdminPage;
