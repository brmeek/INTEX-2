import { useCallback, useEffect, useMemo, type ReactNode } from "react";
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";
import { ThemeContext, type ThemeContextType } from "@/context/ThemeContextValue";

const COOKIE_NAME = "theme";
const COOKIE_MAX_AGE_SECONDS = 31_536_000;

function getStoredTheme(): "light" | "dark" {
  const match = document.cookie
    .split(";")
    .find((cookieEntry) => cookieEntry.trim().startsWith(`${COOKIE_NAME}=`));

  return match?.split("=")[1] === "dark" ? "dark" : "light";
}

function ThemeContextBridge({ children }: { children: ReactNode }) {
  const { theme, resolvedTheme, setTheme } = useNextTheme();
  const effectiveTheme: "light" | "dark" = resolvedTheme === "dark" || theme === "dark" ? "dark" : "light";

  useEffect(() => {
    setTheme(getStoredTheme());
  }, [setTheme]);

  useEffect(() => {
    document.body.setAttribute("data-theme", effectiveTheme);
  }, [effectiveTheme]);

  const toggleTheme = useCallback(() => {
    const nextTheme = effectiveTheme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.cookie = `${COOKIE_NAME}=${nextTheme}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}`;
  }, [effectiveTheme, setTheme]);

  const value = useMemo<ThemeContextType>(
    () => ({
      theme: effectiveTheme,
      toggleTheme,
    }),
    [effectiveTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <ThemeContextBridge>{children}</ThemeContextBridge>
    </NextThemesProvider>
  );
}
