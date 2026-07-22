import type { HubOrganizationPosition } from "@prisma/client";

export function effectiveMemberLabel(member: { organizationPosition: HubOrganizationPosition; isDirector: boolean }) {
  if (member.organizationPosition === "PRESIDENT") return "Presidente";
  if (member.organizationPosition === "COUNSELOR") return "Conselheiro";
  if (member.isDirector) return "Diretor(a)";
  return "Membro";
}
