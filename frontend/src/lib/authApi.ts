import { AuthSession } from "../types/AuthSession";
import { TwoFactorStatus } from "../types/TwoFactorStatus";

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

export async function loginUser(
  email: string,
  password: string,
  rememberMe: boolean
): Promise<void> {
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

export async function getTwoFactorStatus(): Promise<TwoFactorStatus> {
  const response = await fetch(`${apiBaseUrl}/manage/2fa`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Unable to get 2FA status.");
  return response.json();
}

export async function enableTwoFactor(code: string): Promise<TwoFactorStatus> {
  const response = await fetch(`${apiBaseUrl}/manage/2fa`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ enable: true, twoFactorCode: code }),
  });
  if (!response.ok) throw new Error("Unable to enable 2FA.");
  return response.json();
}

export async function disableTwoFactor(): Promise<TwoFactorStatus> {
  const response = await fetch(`${apiBaseUrl}/manage/2fa`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ enable: false }),
  });
  if (!response.ok) throw new Error("Unable to disable 2FA.");
  return response.json();
}

export async function resetRecoveryCodes(): Promise<TwoFactorStatus> {
  const response = await fetch(`${apiBaseUrl}/manage/2fa`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ resetRecoveryCodes: true }),
  });
  if (!response.ok) throw new Error("Unable to reset recovery codes.");
  return response.json();
}
