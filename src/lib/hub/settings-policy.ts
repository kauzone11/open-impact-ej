import type { HubOrganizationPosition, HubRole } from "@prisma/client";

export function canAccessHubSettings(
  role: HubRole | string | null | undefined,
  organizationPosition: HubOrganizationPosition | string | null | undefined,
) {
  return role === "SUPER_ADMIN"
    || organizationPosition === "PRESIDENT"
    || organizationPosition === "COUNSELOR";
}
