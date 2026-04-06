import { Anchor } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-secondary border-t border-border py-10">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <Anchor className="h-5 w-5 text-accent" />
          <span className="font-heading text-lg font-bold text-foreground">Hope Harbor Sanctuary</span>
        </div>
        <p className="text-xs font-body text-muted-foreground">
          © 2025 Hope Harbor Sanctuary. All rights reserved.
        </p>
        <div className="flex gap-6 text-xs font-body text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-foreground transition-colors">Annual Report</a>
          <a href="#" className="hover:text-foreground transition-colors">Contact Support</a>
          <a href="#" className="hover:text-foreground transition-colors">Staff Login</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
