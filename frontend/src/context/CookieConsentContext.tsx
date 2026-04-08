import { createContext, useCallback, useContext, useMemo, useState } from "react";

type CookieConsentContextValue = {
  hasConsented: boolean;
  acceptCookies: () => void;
};

const COOKIE_NAME = "hh_cookie_consent";
const ACCEPTED_VALUE = "accepted";

const CookieConsentContext = createContext<CookieConsentContextValue | undefined>(undefined);

function hasAcceptedConsentCookie(): boolean {
  if (typeof document === "undefined") return false;

  const cookies = document.cookie.split(";").map((cookie) => cookie.trim());
  return cookies.includes(`${COOKIE_NAME}=${ACCEPTED_VALUE}`);
}

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [hasConsented, setHasConsented] = useState<boolean>(() => hasAcceptedConsentCookie());

  const acceptCookies = useCallback(() => {
    document.cookie = `${COOKIE_NAME}=${ACCEPTED_VALUE}; max-age=31536000; path=/; SameSite=Lax`;
    setHasConsented(true);
  }, []);

  const value = useMemo(
    () => ({
      hasConsented,
      acceptCookies,
    }),
    [hasConsented, acceptCookies]
  );

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>;
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error("useCookieConsent must be used within a CookieConsentProvider");
  }
  return context;
}
