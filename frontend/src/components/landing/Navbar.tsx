import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Anchor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { getDonorPortalPath, getStaffPortalPath } from "@/lib/portalRoutes";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { authSession } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isHome = location.pathname === "/";
  const donorPortalPath = getDonorPortalPath(authSession);
  const staffPortalPath = getStaffPortalPath(authSession);
  const navLinks = [
    { label: "About", href: "/about" },
    { label: "Impact", href: "/impact" },
    { label: "Get Involved", href: donorPortalPath },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav
        aria-label="Primary"
        className={cn(
          "relative transition-all duration-300",
          scrolled || !isHome
            ? "bg-background/95 backdrop-blur-md border-b border-border shadow-soft"
            : "border-b border-transparent"
        )}
      >
        <a
          href="#main-content"
          className="absolute left-4 top-0 z-[60] -translate-y-full rounded-b-md border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-md transition-transform focus:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Skip to main content
        </a>

        <div className="container flex items-center justify-between h-16 lg:h-20">
          <Link to="/" className="flex items-center gap-2.5 group">
            <Anchor
              aria-hidden
              className={cn(
                "h-8 w-8 shrink-0 transition-colors",
                scrolled || !isHome ? "text-accent" : "text-teal-light"
              )}
            />
            <span
              className={cn(
                "font-heading text-2xl font-bold transition-colors",
                scrolled || !isHome ? "text-foreground" : "text-white"
              )}
            >
              Hope Harbor
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className={cn(
                  "px-4 py-2 text-lg font-body font-bold transition-colors",
                  location.pathname === link.href
                    ? scrolled || !isHome
                      ? "text-foreground"
                      : "text-white"
                    : scrolled || !isHome
                      ? "text-muted-foreground hover:text-foreground"
                      : "text-white hover:text-teal-light"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <Link to={staffPortalPath}>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "font-body",
                  scrolled || !isHome
                    ? ""
                    : "text-white/80 hover:text-white hover:bg-white/10"
                )}
              >
                Staff Portal
              </Button>
            </Link>
            <Link to={donorPortalPath}>
              <Button
                size="sm"
                className="bg-accent text-accent-foreground hover:bg-teal-light rounded-full font-body font-semibold px-6"
              >
                Donate Now
              </Button>
            </Link>
          </div>

          <button
            type="button"
            className={cn(
              "lg:hidden p-2 rounded-lg transition-colors",
              scrolled || !isHome
                ? "text-foreground hover:bg-secondary"
                : "text-white hover:bg-white/10"
            )}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-primary-navigation"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>

        <div
          id="mobile-primary-navigation"
          className="lg:hidden bg-background border-b border-border shadow-card"
          role="region"
          aria-label="Mobile navigation"
          hidden={!mobileOpen}
        >
          <div className="container py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className={cn(
                  "block px-4 py-3 text-sm font-body font-medium rounded-lg transition-colors",
                  location.pathname === link.href
                    ? "text-foreground bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-border mt-3 grid grid-cols-2 gap-3">
              <Link to={staffPortalPath} className="flex-1">
                <Button variant="outline" size="sm" className="w-full font-body">
                  Staff Portal
                </Button>
              </Link>
              <Link to={donorPortalPath} className="flex-1">
                <Button
                  size="sm"
                  className="w-full bg-accent text-accent-foreground hover:bg-teal-light font-body font-semibold"
                >
                  Donate
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
