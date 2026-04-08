import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";

interface AdminUser {
  id: string;
  email: string | null;
  userName: string | null;
  roles: string[];
}

interface UserFormState {
  email: string;
  password: string;
  isAdmin: boolean;
  isDonor: boolean;
}

const defaultForm: UserFormState = {
  email: "",
  password: "",
  isAdmin: false,
  isDonor: true,
};

function getErrorMessage(error: unknown): string {
  const fallback = "Request failed.";
  if (!(error instanceof Error)) return fallback;

  try {
    const parsed = JSON.parse(error.message) as { message?: string };
    return parsed.message || error.message || fallback;
  } catch {
    return error.message || fallback;
  }
}

const UsersAdminPage = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<UserFormState>(defaultForm);

  const loadUsers = async (targetPage = 1) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(targetPage),
        pageSize: "15",
        search: search.trim(),
      });
      const data = await api.get<{ items: AdminUser[]; total: number }>(`/api/admin/users?${query.toString()}`);
      setUsers(data.items);
      setTotal(data.total);
      setPage(targetPage);
    } catch (error) {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openCreate = () => {
    setEditUser(null);
    setForm(defaultForm);
    setShowForm(true);
  };

  const openEdit = (user: AdminUser) => {
    setEditUser(user);
    setForm({
      email: user.email ?? "",
      password: "",
      isAdmin: user.roles.includes("Admin"),
      isDonor: user.roles.includes("Donor"),
    });
    setShowForm(true);
  };

  const getSelectedRoles = () => {
    const roles: string[] = [];
    if (form.isAdmin) roles.push("Admin");
    if (form.isDonor) roles.push("Donor");
    return roles;
  };

  const handleSave = async () => {
    const selectedRoles = getSelectedRoles();
    if (selectedRoles.length === 0) {
      toast({
        title: "Role Required",
        description: "Select at least one role.",
        variant: "destructive",
      });
      return;
    }

    if (!editUser && form.password.trim().length < 14) {
      toast({
        title: "Password Too Short",
        description: "New users require a password with at least 14 characters.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editUser) {
        await api.put(`/api/admin/users/${editUser.id}`, {
          email: form.email.trim(),
          password: form.password.trim() ? form.password : null,
          roles: selectedRoles,
        });
        toast({ title: "Updated", description: "User updated successfully." });
      } else {
        await api.post("/api/admin/users", {
          email: form.email.trim(),
          password: form.password,
          roles: selectedRoles,
        });
        toast({ title: "Created", description: "User created successfully." });
      }

      setShowForm(false);
      setEditUser(null);
      setForm(defaultForm);
      await loadUsers(editUser ? page : 1);
    } catch (error) {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (user: AdminUser) => {
    if (!confirm(`Delete user ${user.email}? This action cannot be undone.`)) return;

    try {
      await api.delete(`/api/admin/users/${user.id}`);
      toast({ title: "Deleted", description: "User removed." });
      const canStayOnPage = page > 1 && users.length === 1;
      await loadUsers(canStayOnPage ? page - 1 : page);
    } catch (error) {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-border bg-secondary font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent";

  return (
    <AdminLayout title="User Management" subtitle="Create, edit, and delete portal users">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadUsers(1)}
              placeholder="Search users by email..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <Button onClick={() => loadUsers(1)} size="sm" variant="outline" className="font-body">
            Search
          </Button>
          <Button onClick={openCreate} size="sm" className="bg-accent text-white hover:bg-teal-light font-body gap-1">
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl p-6 shadow-card border border-border">
            <h3 className="font-heading text-lg font-bold mb-4">{editUser ? "Edit User" : "New User"}</h3>

            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <input
                className={inputClass}
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
              <input
                className={inputClass}
                placeholder={editUser ? "New password (optional)" : "Password (min 14 chars)"}
                type="password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              />
            </div>

            <div className="mb-4">
              <p className="font-body text-sm font-medium text-foreground mb-2">Roles</p>
              <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center gap-2 font-body text-sm">
                  <input
                    type="checkbox"
                    checked={form.isAdmin}
                    onChange={(e) => setForm((prev) => ({ ...prev, isAdmin: e.target.checked }))}
                  />
                  Admin
                </label>
                <label className="inline-flex items-center gap-2 font-body text-sm">
                  <input
                    type="checkbox"
                    checked={form.isDonor}
                    onChange={(e) => setForm((prev) => ({ ...prev, isDonor: e.target.checked }))}
                  />
                  Donor
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm" className="bg-navy text-white hover:bg-navy-light font-body">
                Save
              </Button>
              <Button onClick={() => setShowForm(false)} variant="ghost" size="sm" className="font-body">
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-soft border border-border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin h-6 w-6 border-4 border-accent border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                      <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Roles</th>
                      <th className="text-left px-4 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-body text-sm font-medium">{user.email ?? user.userName ?? "Unknown user"}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {user.roles.length === 0 ? (
                              <span className="text-xs font-body text-muted-foreground">No roles</span>
                            ) : (
                              user.roles.map((role) => (
                                <span key={role} className="text-xs font-body px-2 py-1 rounded-full bg-secondary">
                                  {role}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 flex gap-1">
                          <Button onClick={() => openEdit(user)} variant="ghost" size="sm" className="text-xs font-body h-7">
                            Edit
                          </Button>
                          <Button onClick={() => handleDelete(user)} variant="ghost" size="sm" className="text-xs font-body h-7 text-destructive">
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center font-body text-sm text-muted-foreground">
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                <p className="font-body text-xs text-muted-foreground">{total} users</p>
                <div className="flex gap-1">
                  <Button onClick={() => loadUsers(page - 1)} disabled={page <= 1} variant="ghost" size="sm">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-body text-sm px-2 py-1">Page {page}</span>
                  <Button onClick={() => loadUsers(page + 1)} disabled={page * 15 >= total} variant="ghost" size="sm">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default UsersAdminPage;
