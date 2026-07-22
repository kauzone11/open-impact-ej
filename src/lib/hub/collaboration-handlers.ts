import type { PrismaClient } from "@prisma/client";
import { HubApiError } from "@/lib/hub/api";
import type { HubActor } from "@/lib/hub/collaboration-policy";
import {
  createBoard,
  createMeeting,
  createTask,
  moveTask,
  respondMeeting,
  scheduleMeeting,
} from "@/lib/hub/collaboration-service";
import { canCreateBoardInScope } from "@/lib/hub/collaboration-policy";
import { hasHubPermission } from "@/lib/hub/permissions";
import {
  eventUuid,
  idempotencyKey,
  safeHttpsUrl,
  stringIds,
  text,
  validTimezone,
} from "@/lib/hub/collaboration-validation";
import { parseMeetingLocalRange, zonedLocalDateTimeToUtc } from "@/lib/hub/timezone";

type Actor = HubActor & { organization: { timezone: string } };
type Body = Record<string, unknown> | null;

export async function handleCreateMeeting(
  client: PrismaClient,
  actor: Actor,
  body: Body,
) {
  if (!hasHubPermission(actor.role, "meetings:create"))
    throw new HubApiError("Seu perfil nao pode criar reunioes.", 403);
  if (!body) throw new HubApiError("Dados invalidos.", 422);
  const timezone = validTimezone(body.timezone, actor.organization.timezone);
  const range = parseMeetingLocalRange({
    startLocal: body.startLocal,
    endLocal: body.endLocal,
    timezone,
  });
  return createMeeting(client, actor, {
    title: text(body.title, "Titulo", 160),
    description: text(body.description, "Descricao", 4000, false),
    status: body.status === "DRAFT" ? "DRAFT" : "SCHEDULED",
    ...range,
    timezone,
    location: text(body.location, "Local", 240, false),
    meetingUrl: safeHttpsUrl(body.meetingUrl),
    directorateId:
      typeof body.directorateId === "string" ? body.directorateId : null,
    directorateIds: stringIds(body.directorateIds),
    organizationWide: body.organizationWide === true,
    participantIds: stringIds(body.participantIds),
    externalGuests: Array.isArray(body.externalGuests) ? body.externalGuests.slice(0, 100).map((value) => {
      const guest = value && typeof value === "object" ? value as Record<string, unknown> : {};
      return { name: text(guest.name, "Nome do convidado", 160), email: typeof guest.email === "string" ? guest.email.trim().toLowerCase() : null };
    }) : [],
    idempotencyKey: idempotencyKey(body.idempotencyKey),
    confirmConflicts: body.confirmConflicts === true,
    overrideReason: text(
      body.overrideReason,
      "Motivo da confirmacao",
      240,
      false,
    ),
  });
}

export function handleScheduleMeeting(
  client: PrismaClient,
  actor: Actor,
  meetingId: string,
  body: Body,
) {
  return scheduleMeeting(client, actor, meetingId, {
    confirmConflicts: body?.confirmConflicts === true,
    overrideReason: text(
      body?.overrideReason,
      "Motivo da confirmacao",
      240,
      false,
    ),
  });
}

export function handleRespondMeeting(
  client: PrismaClient,
  actor: Actor,
  meetingId: string,
  body: Body,
) {
  if (
    !body?.status ||
    !["ACCEPTED", "DECLINED", "TENTATIVE"].includes(String(body.status))
  )
    throw new HubApiError("Resposta invalida.", 422);
  return respondMeeting(
    client,
    actor,
    meetingId,
    body.status as "ACCEPTED" | "DECLINED" | "TENTATIVE",
    eventUuid(body.eventId, "Evento de resposta"),
    Number.isInteger(Number(body.version)) ? Number(body.version) : undefined,
    text(body.declineReason, "Motivo da recusa", 500, false),
  );
}

export function handleCreateBoard(
  client: PrismaClient,
  actor: Actor,
  body: Body,
) {
  const scope = body?.scope === "DIRECTORATE" ? "DIRECTORATE" : "ORGANIZATION";
  const directorateId =
    typeof body?.directorateId === "string" ? body.directorateId : null;
  if (!canCreateBoardInScope(actor, scope, directorateId))
    throw new HubApiError(
      "Diretores criam quadros apenas na propria diretoria.",
      403,
    );
  return createBoard(client, actor, {
    name: text(body?.name, "Nome", 120),
    description: text(body?.description, "Descricao", 2000, false),
    scope,
    directorateId,
  });
}

export function handleCreateTask(
  client: PrismaClient,
  actor: Actor,
  body: Body,
) {
  if (!body) throw new HubApiError("Dados invalidos.", 422);
  const priority = ["LOW", "NORMAL", "HIGH", "URGENT"].includes(
    String(body.priority),
  )
    ? String(body.priority)
    : "NORMAL";
  return createTask(client, actor, {
    boardId: String(body.boardId || ""),
    columnId: String(body.columnId || ""),
    sourceMeetingId:
      typeof body.sourceMeetingId === "string" ? body.sourceMeetingId : null,
    title: text(body.title, "Titulo", 180),
    description: text(body.description, "Descricao", 10000, false),
    priority: priority as "LOW" | "NORMAL" | "HIGH" | "URGENT",
    dueAt: body.dueLocal
      ? zonedLocalDateTimeToUtc(
          body.dueLocal,
          validTimezone(body.timezone, actor.organization.timezone),
        )
      : null,
    assigneeIds: stringIds(body.assigneeIds),
    idempotencyKey: idempotencyKey(body.idempotencyKey),
  });
}

export function handleMoveTask(
  client: PrismaClient,
  actor: Actor,
  taskId: string,
  body: Body,
) {
  if (
    typeof body?.columnId !== "string" ||
    !Number.isInteger(Number(body.version))
  )
    throw new HubApiError("Movimento invalido.", 422);
  return moveTask(client, actor, {
    taskId,
    columnId: body.columnId,
    beforeTaskId:
      typeof body.beforeTaskId === "string" ? body.beforeTaskId : null,
    version: Number(body.version),
  });
}
