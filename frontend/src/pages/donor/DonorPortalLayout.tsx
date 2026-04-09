import { useMemo, useState } from "react";
import { Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { Anchor, Gift, MapPin, Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import Navbar from "@/components/landing/Navbar";

const navItems = [
  { to: "/donor", end: true, label: "Donate", icon: Gift },
  { to: "/donor/why", end: false, label: "Why donate", icon: MapPin },
] as const;

export default function DonorPortalLayout() {
  const { authSession, isAuthenticated } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const donorDisplayName = useMemo(() => {
    if (!authSession?.email) return "Donor";
    const localPart = authSession.email.split("@")[0] ?? "";
    if (!localPart) return "Donor";
    return localPart
      .split(/[._-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }, [authSession?.email]);

  const { pageTitle, pageSubtitle } = useMemo(() => {
    if (location.pathname.startsWith("/donor/why")) {
      return {
        pageTitle: "Why donate",
        pageSubtitle: "See how gifts help and explore coverage gaps",
      };
    }
    return {
      pageTitle: "Donate",
      pageSubtitle: "Make a gift and view your giving stats and history",
    };
  }, [location.pathname]);

  if (!isAuthenticated) return <Navigate to="/donor/login" replace />;

  const sidebarNav = (
    <nav aria-label="Donor portal navigation" className="flex-1 p-4 space-y-1 overflow-y-auto">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={() => setSidebarOpen(false)}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body font-medium transition-colors",
              isActive ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
            )
          }
        >
          <item.icon className="h-4 w-4 shrink-0 text-teal-light" aria-hidden />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-muted">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:px-3 focus:py-2 focus:rounded-md focus:bg-background focus:text-foreground focus:shadow-md"
      >
        Skip to main content
      </a>
      <Navbar />

      <div className="flex pt-16 lg:pt-20">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-64 flex-col bg-navy text-white fixed left-0 top-16 lg:top-20 bottom-0 z-30">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Anchor className="h-5 w-5 text-teal-light shrink-0" aria-hidden />
              <span className="font-heading text-lg font-bold">Donor Portal</span>
            </div>
            <p className="font-body text-xs text-white/40 mt-1">Giving, impact, and coverage</p>
            <p className="font-body text-sm text-white/80 mt-3 leading-snug">Welcome back, {donorDisplayName}</p>
          </div>
          {sidebarNav}
          <div className="p-4 border-t border-white/10">
            <p className="font-body text-xs text-white/40 truncate">{authSession?.email}</p>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-x-0 top-16 bottom-0 z-40">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setSidebarOpen(false)}
              role="button"
              tabIndex={0}
              aria-label="Close navigation menu"
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSidebarOpen(false);
                }
              }}
            />
            <aside
              id="donor-mobile-sidebar"
              className="absolute left-0 top-0 bottom-0 w-64 max-w-[85vw] bg-navy text-white flex flex-col"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-start gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Anchor className="h-5 w-5 text-teal-light shrink-0" aria-hidden />
                    <span className="font-heading text-lg font-bold">Donor Portal</span>
                  </div>
                  <p className="font-body text-xs text-white/40 mt-1">Giving, impact, and coverage</p>
                  <p className="font-body text-sm text-white/80 mt-2 leading-snug">Welcome back, {donorDisplayName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="text-white/60 hover:text-white shrink-0"
                  aria-label="Close navigation menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {sidebarNav}
              <div className="p-4 border-t border-white/10">
                <p className="font-body text-xs text-white/40 truncate">{authSession?.email}</p>
              </div>
            </aside>
          </div>
        )}

        {/* Main column */}
        <div className="flex-1 lg:ml-64 min-w-0">
          <header className="sticky top-16 lg:top-20 z-20 bg-background/95 backdrop-blur border-b border-border px-6 py-4 flex items-center justify-between shadow-soft">
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="lg:hidden text-foreground"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={sidebarOpen}
                aria-controls="donor-mobile-sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <h1 className="font-heading text-xl font-bold text-foreground">{pageTitle}</h1>
                <p className="font-body text-xs text-muted-foreground">{pageSubtitle}</p>
              </div>
            </div>
          </header>

          <main id="main-content" tabIndex={-1} className="p-6 outline-none">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
