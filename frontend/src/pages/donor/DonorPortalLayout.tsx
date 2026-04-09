import { useMemo } from "react";
import { Navigate, NavLink, Outlet } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import Navbar from "@/components/landing/Navbar";

const tabCard =
  "group relative flex w-full flex-col items-start gap-1 rounded-xl border-2 px-5 py-4 text-left transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background min-h-[5.25rem] sm:min-h-0";

export default function DonorPortalLayout() {
  const { authSession, isAuthenticated } = useAuth();

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

  if (!isAuthenticated) return <Navigate to="/donor/login" replace />;

  return (
    <div className="min-h-screen bg-muted">
      <Navbar />

      <div className="pt-16 lg:pt-20">
        <main id="main-content" tabIndex={-1} className="container py-8 space-y-6 outline-none">
          <section className="bg-card border border-border rounded-2xl p-6 shadow-soft space-y-5">
            <div>
              <p className="font-body text-xs font-semibold tracking-widest uppercase text-accent mb-3">
                Donor Portal
              </p>
              <h1 className="font-heading text-3xl font-bold text-foreground">
                Welcome back, {donorDisplayName}
              </h1>
            </div>

            <div className="space-y-3">
              <p className="font-body text-sm font-semibold text-foreground">
                Tap a section to open it — you can switch anytime:
              </p>
              <nav aria-label="Donor portal sections" className="grid gap-3 sm:grid-cols-2">
                <NavLink
                  to="/donor"
                  end
                  className={({ isActive }) =>
                    cn(
                      tabCard,
                      isActive
                        ? "border-navy bg-navy text-white shadow-md"
                        : "border-border bg-card text-foreground shadow-sm hover:border-accent hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className="font-heading text-lg font-bold tracking-tight">Donate</span>
                      <span
                        className={cn(
                          "font-body text-sm leading-snug",
                          isActive ? "text-white/85" : "text-muted-foreground group-hover:text-foreground"
                        )}
                      >
                        Make a gift and view your giving stats and history
                      </span>
                      {!isActive && (
                        <span className="font-body text-xs font-semibold text-accent mt-1" aria-hidden>
                          Open →
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
                <NavLink
                  to="/donor/why"
                  className={({ isActive }) =>
                    cn(
                      tabCard,
                      isActive
                        ? "border-navy bg-navy text-white shadow-md"
                        : "border-border bg-card text-foreground shadow-sm hover:border-accent hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className="font-heading text-lg font-bold tracking-tight">Why donate</span>
                      <span
                        className={cn(
                          "font-body text-sm leading-snug",
                          isActive ? "text-white/85" : "text-muted-foreground group-hover:text-foreground"
                        )}
                      >
                        See how gifts help and explore coverage gaps
                      </span>
                      {!isActive && (
                        <span className="font-body text-xs font-semibold text-accent mt-1" aria-hidden>
                          Open →
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </nav>
            </div>
          </section>

          <Outlet />

          <section className="bg-secondary border border-border rounded-xl p-4 flex items-start gap-3">
            <ShieldCheck className="h-4 w-4 text-accent mt-0.5 shrink-0" aria-hidden />
            <p className="font-body text-xs text-muted-foreground">
              Access is role-restricted. Donor and staff accounts can use this portal, but staff-only admin dashboards
              remain separate.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
