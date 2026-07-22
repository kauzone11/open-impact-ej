import type { HubRole, HubMemberStatus, HubOrganizationPosition, Prisma } from "@prisma/client";
import { HubApiError } from "./api";

export function normalizeHubEmail(value: string) {
  return value.trim().toLowerCase();
}

export async function assertOrganizationRetainsSettingsAdministrator(
  tx: Prisma.TransactionClient,
  input: { organizationId: string; memberId: string; currentRole: HubRole; currentStatus: HubMemberStatus; currentPosition: HubOrganizationPosition; nextRole: HubRole; nextStatus: HubMemberStatus; nextPosition?: HubOrganizationPosition },
) {
  const currentAccess = input.currentStatus === "ACTIVE" && (input.currentRole === "SUPER_ADMIN" || input.currentPosition === "PRESIDENT" || input.currentPosition === "COUNSELOR");
  const nextPosition = input.nextPosition ?? input.currentPosition;
  const nextAccess = input.nextStatus === "ACTIVE" && (input.nextRole === "SUPER_ADMIN" || nextPosition === "PRESIDENT" || nextPosition === "COUNSELOR");
  if (!currentAccess || nextAccess) return;
  const others = await tx.hubMember.count({ where: { organizationId: input.organizationId, id: { not: input.memberId }, status: "ACTIVE", OR: [{ role: "SUPER_ADMIN" }, { organizationPosition: { in: ["PRESIDENT", "COUNSELOR"] } }] } });
  if (!others) throw new HubApiError("A organização deve manter ao menos um administrador de Ajustes.", 409);
}

export async function assertOrganizationRetainsActiveSuperAdmin(
  tx: Prisma.TransactionClient,
  input: {
    organizationId: string;
    currentRole: HubRole;
    currentStatus: HubMemberStatus;
    nextRole: HubRole;
    nextStatus: HubMemberStatus;
  },
) {
  const removesAuthority = input.currentRole === "SUPER_ADMIN"
    && input.currentStatus === "ACTIVE"
    && (input.nextRole !== "SUPER_ADMIN" || input.nextStatus !== "ACTIVE");
  if (!removesAuthority) return;
  const activeSuperAdmins = await tx.hubMember.count({
    where: { organizationId: input.organizationId, role: "SUPER_ADMIN", status: "ACTIVE" },
  });
  if (activeSuperAdmins <= 1) {
    throw new HubApiError("O último superadministrador ativo não pode ser removido ou desativado.", 409);
  }
}
