import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

const COOKIE_KEY = "hh_cookie_consent";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(COOKIE_KEY, "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-fade-up">
      <div className="container">
        <div className="bg-white rounded-2xl shadow-elevated border border-border p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 max-w-3xl mx-auto">
          <Shield className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-body text-sm text-foreground font-medium mb-1">
              We respect your privacy
            </p>
            <p className="font-body text-xs text-muted-foreground leading-relaxed">
              This site uses essential cookies for authentication and security.
              We do not use tracking cookies or share data with third parties.
              By continuing to use this site, you agree to our{" "}
              <a href="/privacy" className="text-accent hover:underline">Privacy Policy</a>.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button onClick={decline} variant="ghost" size="sm" className="font-body text-xs">
              Decline
            </Button>
            <Button onClick={accept} size="sm" className="bg-navy text-white hover:bg-navy-light font-body text-xs">
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
