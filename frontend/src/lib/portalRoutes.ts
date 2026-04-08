import type { AuthSession } from "@/types/AuthSession";

export function getStaffPortalPath(authSession: AuthSession | null): string {
  if (authSession?.isAuthenticated && authSession.roles.includes("Admin")) {
    return "/admin";
  }

  return "/login";
}

export function getDonorPortalPath(authSession: AuthSession | null): string {
  if (
    authSession?.isAuthenticated &&
    (authSession.roles.includes("Donor") || authSession.roles.includes("Admin"))
  ) {
    return "/donor";
  }

  return "/donor/login";
}
