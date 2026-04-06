import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Anchor } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "About", href: "/about" },
  { label: "Our Programs", href: "/programs" },
  { label: "Get Involved", href: "/donate" },
  { label: "Contact", href: "/contact" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isHome = location.pathname === "/";

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled || !isHome
          ? "bg-background/95 backdrop-blur-md border-b border-border shadow-soft"
          : "bg-transparent"
      )}
    >
      <div className="container flex items-center justify-between h-16 lg:h-20">
        <Link to="/" className="flex items-center gap-2.5 group">
          <Anchor
            className={cn(
              "h-6 w-6 transition-colors",
              scrolled || !isHome ? "text-accent" : "text-teal-light"
            )}
          />
          <span
            className={cn(
              "font-heading text-xl font-bold transition-colors",
              scrolled || !isHome ? "text-foreground" : "text-white"
            )}
          >
            Hope Harbor
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className={cn(
                "px-4 py-2 text-sm font-body font-medium rounded-lg transition-colors",
                location.pathname === link.href
                  ? scrolled || !isHome
                    ? "text-foreground bg-secondary"
                    : "text-white bg-white/15"
                  : scrolled || !isHome
                    ? "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    : "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <Link to="/login">
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
          <Link to="/donate">
            <Button
              size="sm"
              className="bg-accent text-accent-foreground hover:bg-teal-light rounded-full font-body font-semibold px-6"
            >
              Donate Now
            </Button>
          </Link>
        </div>

        <button
          className={cn(
            "lg:hidden p-2 rounded-lg transition-colors",
            scrolled || !isHome
              ? "text-foreground hover:bg-secondary"
              : "text-white hover:bg-white/10"
          )}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-background border-b border-border shadow-card animate-fade-in">
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
            <div className="pt-3 border-t border-border mt-3 flex gap-3">
              <Link to="/login" className="flex-1">
                <Button variant="outline" size="sm" className="w-full font-body">
                  Staff Portal
                </Button>
              </Link>
              <Link to="/donate" className="flex-1">
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
      )}
    </nav>
  );
};

export default Navbar;
