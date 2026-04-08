import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { useCookieConsent } from "@/context/CookieConsentContext";

const CookieConsentBanner = () => {
  const { hasConsented, acceptCookies } = useCookieConsent();

  if (hasConsented) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-fade-up">
      <div className="container">
        <div className="bg-white rounded-2xl shadow-elevated border border-border p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 max-w-3xl mx-auto">
          <Shield className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-body text-sm text-foreground font-medium mb-1">Cookie Notice</p>
            <p className="font-body text-xs text-muted-foreground leading-relaxed">
              We use essential cookies for login/session security and a cookie consent preference
              cookie. We do not use tracking or analytics cookies. By using this site, you agree
              to our <a href="/cookies" className="text-accent hover:underline">Cookie Policy</a>.
            </p>
          </div>
          <div className="shrink-0">
            <Button
              onClick={acceptCookies}
              size="sm"
              className="bg-navy text-white hover:bg-navy-light font-body text-xs"
            >
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
