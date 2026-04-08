import { AuthSession } from "../types/AuthSession";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? "";

export async function getAuthSession(): Promise<AuthSession> {
  const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Unable to load auth session.");
  return response.json();
}

export async function registerUser(email: string, password: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/auth/register-donor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error("Unable to register user.");
}

export async function loginUser(email: string, password: string, rememberMe: boolean): Promise<void> {
  const searchParams = new URLSearchParams({ useCookies: rememberMe ? "true" : "false" });
  const response = await fetch(`${apiBaseUrl}/api/auth/login?${searchParams}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error("Unable to log in.");
}

export async function logoutUser(): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) throw new Error("Unable to log out.");
}
