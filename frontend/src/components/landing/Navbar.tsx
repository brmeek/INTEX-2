import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Anchor } from "lucide-react";

const navLinks = [
  { label: "Dashboard", href: "#" },
  { label: "Donations", href: "#" },
  { label: "Cases", href: "#" },
  { label: "Impact", href: "#" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <Anchor className="h-6 w-6 text-accent" />
          <span className="font-heading text-xl font-bold text-foreground">Hope Harbor</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-body font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" className="font-body">
            Staff Login
          </Button>
          <Button variant="hero" size="sm">
            Donate
          </Button>
        </div>

        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-background border-b border-border px-6 pb-4 animate-fade-in">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="block py-2 text-sm font-body font-medium text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
          <div className="flex gap-3 mt-3">
            <Button variant="ghost" size="sm" className="font-body">Staff Login</Button>
            <Button variant="hero" size="sm">Donate</Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
