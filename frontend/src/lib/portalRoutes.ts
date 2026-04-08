import type { AuthSession } from "@/types/AuthSession";

export type PortalTarget = "admin" | "donor";

export function getPortalRedirectPath(target?: PortalTarget): string {
  if (!target) {
    return "/portal";
  }

  return `/portal?target=${target}`;
}

export function getPortalLandingPath(authSession: AuthSession | null, preferredTarget?: PortalTarget): string {
  const isAuthenticated = authSession?.isAuthenticated ?? false;
  const roles = authSession?.roles ?? [];
  const hasAdminAccess = roles.includes("Admin");
  const hasDonorAccess = roles.includes("Donor");

  if (!isAuthenticated) {
    return preferredTarget === "admin" ? "/login" : "/donor/login";
  }

  if (preferredTarget === "donor" && hasDonorAccess) {
    return "/donor";
  }

  if (preferredTarget === "admin" && hasAdminAccess) {
    return "/admin";
  }

  if (hasAdminAccess) {
    return "/admin";
  }

  if (hasDonorAccess) {
    return "/donor";
  }

  return preferredTarget === "admin" ? "/login" : "/donor/login";
}

export function getStaffPortalPath(authSession: AuthSession | null): string {
  if (authSession?.isAuthenticated && authSession.roles.includes("Admin")) {
    return "/admin";
  }

  return "/login";
}

export function getDonorPortalPath(authSession: AuthSession | null): string {
  if (
    authSession?.isAuthenticated &&
    authSession.roles.includes("Donor")
  ) {
    return "/donor";
  }

  return "/donor/login";
}
