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
        "fixed right-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-600 p-0 text-white shadow-elevated transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-red-700 sm:right-6 sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-3 sm:text-xs sm:font-body sm:font-semibold sm:uppercase sm:tracking-[0.18em]",
        hasConsented ? "bottom-4 sm:bottom-6" : "bottom-32 sm:bottom-28"
      )}
      aria-label="Quick exit, immediately leave this site"
    >
      <ShieldAlert className="h-4 w-4" />
      <span className="hidden sm:inline">Quick Exit</span>
    </button>
  );
};

export default QuickExitButton;
