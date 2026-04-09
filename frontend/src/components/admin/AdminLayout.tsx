import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { logoutUser } from "@/lib/authApi";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/useTheme";
import {
  LayoutDashboard,
  Users,
  Heart,
  ClipboardList,
  FileText,
  Home,
  BarChart3,
  Anchor,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Map,
  Shield,
  CalendarClock,
  Megaphone,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const adminToolLinks = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Shield },
  { label: "Reports & Calculator", href: "/admin/reports", icon: BarChart3 },
  { label: "Social Media Conversion Planner", href: "/admin/social-conversion-planner", icon: Megaphone },
  { label: "Posting Calendar", href: "/admin/posting-calendar", icon: CalendarClock },
  { label: "Needs Map", href: "/admin/trafficking-map", icon: Map },
];

const metricLinks = [
  { label: "Donors", href: "/admin/donors", icon: Heart },
  { label: "Caseload", href: "/admin/caseload", icon: ClipboardList },
  { label: "Process Recording", href: "/admin/recordings", icon: FileText },
  { label: "Visitations", href: "/admin/visitations", icon: Home },
  { label: "Partners", href: "/admin/partners", icon: Users },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

type SidebarTab = "admin" | "metrics";

const AdminLayout = ({ children, title, subtitle }: AdminLayoutProps) => {
  const { authSession, refreshAuthSession } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SidebarTab>(
    metricLinks.some((link) => location.pathname.startsWith(link.href)) ? "metrics" : "admin"
  );

  useEffect(() => {
    if (metricLinks.some((link) => location.pathname.startsWith(link.href))) {
      setActiveTab("metrics");
    } else {
      setActiveTab("admin");
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    await logoutUser();
    await refreshAuthSession();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-muted flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-navy text-white fixed inset-y-0 left-0 z-30">
        <div className="p-6 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2">
            <Anchor className="h-5 w-5 text-teal-light" />
            <span className="font-heading text-lg font-bold">Hope Harbor</span>
          </Link>
          <p className="font-body text-xs text-white/40 mt-1">Staff Portal</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-white/5 mb-3">
            <button
              type="button"
              onClick={() => setActiveTab("admin")}
              className={cn(
                "px-2 py-2 rounded-md text-[11px] font-body font-semibold uppercase tracking-wider transition-colors",
                activeTab === "admin" ? "bg-white/15 text-white" : "text-white/60 hover:text-white"
              )}
            >
              Admin Tools
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("metrics")}
              className={cn(
                "px-2 py-2 rounded-md text-[11px] font-body font-semibold uppercase tracking-wider transition-colors",
                activeTab === "metrics" ? "bg-white/15 text-white" : "text-white/60 hover:text-white"
              )}
            >
              Metrics & KPIs
            </button>
          </div>

          {(activeTab === "admin" ? adminToolLinks : metricLinks).map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body font-medium transition-colors",
                location.pathname === link.href || location.pathname.startsWith(`${link.href}/`)
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <link.icon className="h-4 w-4 shrink-0" />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <p className="font-body text-xs text-white/40 truncate mb-2">{authSession?.email}</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-white/60 hover:text-white text-sm font-body transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-navy text-white flex flex-col">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <Link to="/" className="flex items-center gap-2">
                <Anchor className="h-5 w-5 text-teal-light" />
                <span className="font-heading text-lg font-bold">Hope Harbor</span>
              </Link>
              <button onClick={() => setSidebarOpen(false)} className="text-white/60 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-white/5 mb-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("admin")}
                  className={cn(
                    "px-2 py-2 rounded-md text-[11px] font-body font-semibold uppercase tracking-wider transition-colors",
                    activeTab === "admin" ? "bg-white/15 text-white" : "text-white/60 hover:text-white"
                  )}
                >
                  Admin Tools
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("metrics")}
                  className={cn(
                    "px-2 py-2 rounded-md text-[11px] font-body font-semibold uppercase tracking-wider transition-colors",
                    activeTab === "metrics" ? "bg-white/15 text-white" : "text-white/60 hover:text-white"
                  )}
                >
                  Metrics & KPIs
                </button>
              </div>

              {(activeTab === "admin" ? adminToolLinks : metricLinks).map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body font-medium transition-colors",
                    location.pathname === link.href || location.pathname.startsWith(`${link.href}/`)
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  <link.icon className="h-4 w-4 shrink-0" />
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-white/60 hover:text-white text-sm font-body transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-6 py-4 flex items-center justify-between shadow-soft">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="font-heading text-xl font-bold text-foreground">{title}</h1>
              {subtitle && <p className="font-body text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={theme === "light" ? "Dark mode" : "Light mode"}
              aria-label={theme === "light" ? "Dark mode" : "Light mode"}
              className="rounded-full"
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            <Link to="/">
              <Button variant="ghost" size="sm" className="font-body text-xs gap-1">
                <ChevronLeft className="h-3 w-3" />
                Public Site
              </Button>
            </Link>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
