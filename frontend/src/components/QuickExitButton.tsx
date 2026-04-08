import { ShieldAlert } from "lucide-react";
import { useCookieConsent } from "@/context/CookieConsentContext";
import { cn } from "@/lib/utils";

const QUICK_EXIT_URL = "https://www.google.com";

const QuickExitButton = () => {
  const { hasConsented } = useCookieConsent();

  const handleQuickExit = () => {
    window.location.replace(QUICK_EXIT_URL);
  };

  return (
    <button
      type="button"
      onClick={handleQuickExit}
      className={cn(
        "fixed right-4 z-40 inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-3 text-xs font-body font-semibold uppercase tracking-[0.18em] text-white shadow-elevated transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-red-700 sm:right-6",
        hasConsented ? "bottom-4 sm:bottom-6" : "bottom-32 sm:bottom-28"
      )}
      aria-label="Quick exit, immediately leave this site"
    >
      <ShieldAlert className="h-4 w-4" />
      Quick Exit
    </button>
  );
};

export default QuickExitButton;
