import type { Prisma } from "@prisma/client";
import { hasHubPermission, type HubPermission } from "@/lib/hub/permissions";

export const HUB_NOTIFICATION_TYPES = [
  "WELCOME", "MEMBER_UPDATED", "PROJECT_APPROVED", "PROJECT_CANCELLED",
  "MEETING_INVITED", "MEETING_UPDATED", "MEETING_CANCELLED", "MEETING_RESPONSE",
  "MEETING_COMPLETED", "MEETING_DECISION_RECORDED", "MEETING_PARTICIPANT_REMOVED", "TASK_ASSIGNED", "TASK_UPDATED",
  "TASK_COMMENTED", "TASK_DUE_CHANGED", "TASK_COMPLETED",
] as const;
export type HubNotificationType = (typeof HUB_NOTIFICATION_TYPES)[number];

export type HubNotificationInput = {
  organizationId: string; recipientMemberId: string; actorMemberId?: string | null;
  type: HubNotificationType; title: string; body: string; href: string;
  entityType: string; entityId: string; idempotencyKey: string;
};

export type HubNotificationCreationResult = {
  created: number;
  skippedInactive: number;
  duplicate: number;
};

function safeText(value: string, max: number) {
  return value.replace(/[\r\n\t]+/g, " ").trim().slice(0, max);
}

export function assertHubNotificationHref(href: string) {
  const allowedPrefixes = ["/inicio", "/diretorias", "/projetos", "/tarefas", "/agenda", "/reunioes", "/financas", "/ajustes", "/minha-conta"];
  if (!allowedPrefixes.some((prefix) => href === prefix || href.startsWith(`${prefix}/`) || href.startsWith(`${prefix}?`)) || href.startsWith("//") || /[\r\n]/.test(href)) {
    throw new Error("Links de notificação devem ser internos ao Open Impact EJ.");
  }
  return href;
}

export async function resolveHubNotificationRecipients(
  tx: Prisma.TransactionClient, organizationId: string, permission: HubPermission, excludeMemberId?: string,
) {
  const members = await tx.hubMember.findMany({
    where: { organizationId, status: "ACTIVE", ...(excludeMemberId ? { id: { not: excludeMemberId } } : {}) },
    select: { id: true, role: true },
  });
  return members.filter((member) => hasHubPermission(member.role, permission)).map((member) => member.id);
}

export async function createHubNotifications(tx: Prisma.TransactionClient, inputs: HubNotificationInput[]) {
  if (!inputs.length) return { created: 0, skippedInactive: 0, duplicate: 0 } satisfies HubNotificationCreationResult;
  const organizationId = inputs[0].organizationId;
  if (inputs.some((item) => item.organizationId !== organizationId)) throw new Error("Notificações devem pertencer a uma única organização.");
  const recipientIds = [...new Set(inputs.map((item) => item.recipientMemberId))];
  const actorIds = [...new Set(inputs.map((item) => item.actorMemberId).filter((id): id is string => Boolean(id)))];
  const memberIds = [...new Set([...recipientIds, ...actorIds])];
  const members = await tx.hubMember.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, organizationId: true, status: true },
  });
  const membersById = new Map(members.map((member) => [member.id, member]));
  for (const recipientId of recipientIds) {
    const recipient = membersById.get(recipientId);
    if (!recipient) throw new Error("Destinatário de notificação inexistente.");
    if (recipient.organizationId !== organizationId) throw new Error("Destinatário de notificação pertence a outra organização.");
  }
  for (const actorId of actorIds) {
    const actor = membersById.get(actorId);
    if (!actor) throw new Error("Ator de notificação inexistente.");
    if (actor.organizationId !== organizationId) throw new Error("Ator de notificação pertence a outra organização.");
  }

  const activeInputs = inputs.filter((item) => membersById.get(item.recipientMemberId)?.status === "ACTIVE");
  const skippedInactive = inputs.length - activeInputs.length;
  if (!activeInputs.length) return { created: 0, skippedInactive, duplicate: 0 };
  const result = await tx.hubNotification.createMany({
    data: activeInputs.map((item) => ({ ...item, actorMemberId: item.actorMemberId || null, title: safeText(item.title, 160), body: safeText(item.body, 500), href: assertHubNotificationHref(item.href) })),
    skipDuplicates: true,
  });
  return { created: result.count, skippedInactive, duplicate: activeInputs.length - result.count } satisfies HubNotificationCreationResult;
}

export async function notifyHubPermissionRecipients(
  tx: Prisma.TransactionClient,
  input: Omit<HubNotificationInput, "recipientMemberId"> & { permission: HubPermission; excludeActor?: boolean },
) {
  const recipients = await resolveHubNotificationRecipients(tx, input.organizationId, input.permission, input.excludeActor ? input.actorMemberId || undefined : undefined);
  const notification: Omit<HubNotificationInput, "recipientMemberId"> = {
    organizationId: input.organizationId,
    actorMemberId: input.actorMemberId,
    type: input.type,
    title: input.title,
    body: input.body,
    href: input.href,
    entityType: input.entityType,
    entityId: input.entityId,
    idempotencyKey: input.idempotencyKey,
  };
  return createHubNotifications(tx, recipients.map((recipientMemberId) => ({ ...notification, recipientMemberId, idempotencyKey: `${input.idempotencyKey}:${recipientMemberId}` })));
}
