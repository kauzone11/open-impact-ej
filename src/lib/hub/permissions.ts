import type { HubRole } from "@prisma/client";

export type HubPermission =
  | "member:access"
  | "request:create"
  | "admin:access"
  | "organization:manage"
  | "members:manage"
  | "directorates:manage"
  | "projects:manage"
  | "audit:read-full"
  | "audit:read-financial"
  | "collaboration:access"
  | "availability:manage-own"
  | "availability:read-organization"
  | "meetings:create"
  | "meetings:manage-all"
  | "boards:create"
  | "boards:manage-all"
  | "tasks:manage-all"
  | "finance:access"
  | "finance:create"
  | "finance:manage"
  | "finance:reports"
  ;

const ALL: HubPermission[] = [
  "member:access", "request:create", "admin:access", "organization:manage", "members:manage", "directorates:manage",
  "projects:manage",
  "audit:read-full", "audit:read-financial",
  "collaboration:access", "availability:manage-own", "availability:read-organization",
  "meetings:create", "meetings:manage-all", "boards:create", "boards:manage-all", "tasks:manage-all",
  "finance:access", "finance:create", "finance:manage", "finance:reports",
];

export const HUB_ROLE_PERMISSIONS: Record<HubRole, readonly HubPermission[]> = {
  SUPER_ADMIN: ALL,
  ADMIN: ALL,
  FINANCE: ["member:access", "request:create", "audit:read-financial", "collaboration:access", "availability:manage-own", "meetings:create", "finance:access", "finance:create", "finance:manage", "finance:reports"],
  DIRECTOR: ["member:access", "request:create", "projects:manage", "collaboration:access", "availability:manage-own", "availability:read-organization", "meetings:create", "boards:create", "finance:access"],
  MEMBER: ["member:access", "request:create", "collaboration:access", "availability:manage-own", "finance:access"],
  VIEWER: ["member:access", "collaboration:access"],
};

export function hasHubPermission(role: HubRole | string | null | undefined, permission: HubPermission) {
  if (!role || !(role in HUB_ROLE_PERMISSIONS)) return false;
  return HUB_ROLE_PERMISSIONS[role as HubRole].includes(permission);
}

const HUB_ROLE_LEVELS: Record<HubRole, number> = {
  SUPER_ADMIN: 60,
  ADMIN: 50,
  FINANCE: 40,
  DIRECTOR: 30,
  MEMBER: 20,
  VIEWER: 10,
};

export class HubMemberPolicyError extends Error {
  readonly status = 403 as const;

  constructor() {
    super("Ação não permitida.");
    this.name = "HubMemberPolicyError";
  }
}

export function hubRoleLevel(role: HubRole) {
  return HUB_ROLE_LEVELS[role];
}

export function canManageHubMember(actorRole: HubRole, targetRole: HubRole) {
  if (!hasHubPermission(actorRole, "members:manage")) return false;
  if (targetRole === "SUPER_ADMIN") return actorRole === "SUPER_ADMIN";
  return hubRoleLevel(targetRole) <= hubRoleLevel(actorRole);
}

export function canAssignHubRole(actorRole: HubRole, targetRole: HubRole) {
  if (!hasHubPermission(actorRole, "members:manage")) return false;
  if (targetRole === "SUPER_ADMIN") return actorRole === "SUPER_ADMIN";
  return hubRoleLevel(targetRole) <= hubRoleLevel(actorRole);
}

export function assertCanManageHubMember(actorRole: HubRole, targetRole: HubRole) {
  if (!canManageHubMember(actorRole, targetRole)) throw new HubMemberPolicyError();
}

export function assertCanAssignHubRole(actorRole: HubRole, targetRole: HubRole) {
  if (!canAssignHubRole(actorRole, targetRole)) throw new HubMemberPolicyError();
}
