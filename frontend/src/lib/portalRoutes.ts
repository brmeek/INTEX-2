import type { AuthSession } from "@/types/AuthSession";

export type PortalTarget = "admin" | "donor";

export function hasAdminAccess(authSession: AuthSession | null): boolean {
  return Boolean(authSession?.isAuthenticated && authSession.roles.includes("Admin"));
}

export function hasDonorPortalAccess(authSession: AuthSession | null): boolean {
  return Boolean(
    authSession?.isAuthenticated &&
    (authSession.roles.includes("Donor") || authSession.roles.includes("Admin"))
  );
}

export function getPortalRedirectPath(target?: PortalTarget): string {
  if (!target) {
    return "/portal";
  }

  return `/portal?target=${target}`;
}

export function getPortalLandingPath(authSession: AuthSession | null, preferredTarget?: PortalTarget): string {
  const isAuthenticated = authSession?.isAuthenticated ?? false;
  const canAccessAdmin = hasAdminAccess(authSession);
  const canAccessDonorPortal = hasDonorPortalAccess(authSession);

  if (!isAuthenticated) {
    return preferredTarget === "admin" ? "/login" : "/donor/login";
  }

  if (preferredTarget === "donor" && canAccessDonorPortal) {
    return "/donor";
  }

  if (preferredTarget === "admin" && canAccessAdmin) {
    return "/admin";
  }

  if (canAccessAdmin) {
    return "/admin";
  }

  if (canAccessDonorPortal) {
    return "/donor";
  }

  return preferredTarget === "admin" ? "/login" : "/donor/login";
}

export function getStaffPortalPath(authSession: AuthSession | null): string {
  if (hasAdminAccess(authSession)) {
    return "/admin";
  }

  return "/login";
}

export function getDonorPortalPath(authSession: AuthSession | null): string {
  if (hasDonorPortalAccess(authSession)) {
    return "/donor";
  }

  return "/donor/login";
}
