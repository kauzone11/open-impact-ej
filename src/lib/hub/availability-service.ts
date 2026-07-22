import crypto from "crypto";
import type { HubRole, PrismaClient } from "@prisma/client";
import { HubApiError } from "@/lib/hub/api";
import { writeHubAudit } from "@/lib/hub/audit";
import { zonedLocalDateTimeToUtc } from "@/lib/hub/timezone";
import { hubCoreTransaction } from "@/lib/hub/core-transaction";

type Actor = { organizationId: string; memberId: string; role: HubRole; directorateId?: string | null; timezone: string };

function civilDate(date: Date) { return date.toISOString().slice(0, 10); }
function slotsFor(dates: Date[], startMinute: number, endMinute: number, slotMinutes: number, timezone: string) {
  const slots: Date[] = [];
  for (const date of dates) for (let minute = startMinute; minute < endMinute; minute += slotMinutes) {
    const hour = String(Math.floor(minute / 60)).padStart(2, "0"); const rest = String(minute % 60).padStart(2, "0");
    slots.push(zonedLocalDateTimeToUtc(`${civilDate(date)}T${hour}:${rest}`, timezone));
  }
  return slots;
}

export async function createAvailabilityPoll(client: PrismaClient, actor: Actor, input: { title: string; description?: string | null; dates: Date[]; startMinute: number; endMinute: number; slotMinutes: 15 | 30 | 60; directorateIds?: string[]; participantIds?: string[]; responseDeadline?: Date | null }) {
  if (actor.role === "VIEWER") throw new HubApiError("Ação não permitida.", 403);
  const dates = [...new Map(input.dates.map((date) => [civilDate(date), date])).values()].sort((a, b) => a.getTime() - b.getTime());
  if (input.title.trim().length < 2 || !dates.length || dates.length > 31 || ![15, 30, 60].includes(input.slotMinutes) || input.startMinute < 0 || input.endMinute > 1440 || input.startMinute >= input.endMinute || (input.endMinute - input.startMinute) % input.slotMinutes) throw new HubApiError("Configuração de disponibilidade inválida.", 400);
  return hubCoreTransaction(client, async (tx) => {
    const directorateIds = [...new Set(input.directorateIds || [])];
    if (await tx.hubDirectorate.count({ where: { id: { in: directorateIds }, organizationId: actor.organizationId, archivedAt: null } }) !== directorateIds.length) throw new HubApiError("Diretoria não encontrada.", 404);
    const directorateMembers = directorateIds.length ? await tx.hubMember.findMany({ where: { organizationId: actor.organizationId, status: "ACTIVE", directorateId: { in: directorateIds } }, select: { id: true } }) : [];
    const participantIds = [...new Set([actor.memberId, ...(input.participantIds || []), ...directorateMembers.map((item) => item.id)])];
    if (await tx.hubMember.count({ where: { id: { in: participantIds }, organizationId: actor.organizationId, status: "ACTIVE" } }) !== participantIds.length) throw new HubApiError("Participante não encontrado.", 404);
    const poll = await tx.hubAvailabilityPoll.create({ data: { organizationId: actor.organizationId, title: input.title.trim(), description: input.description?.trim() || null, dates, startMinute: input.startMinute, endMinute: input.endMinute, slotMinutes: input.slotMinutes, timezone: actor.timezone, responseDeadline: input.responseDeadline || null, directorateId: directorateIds[0] || null, createdById: actor.memberId, participants: { create: participantIds.map((memberId) => ({ memberId })) } } });
    await writeHubAudit(tx, { organizationId: actor.organizationId, memberId: actor.memberId, action: "AVAILABILITY_POLL_CREATED", entity: "AVAILABILITY_POLL", entityId: poll.id, metadata: { dates: dates.length, participants: participantIds.length, slotMinutes: input.slotMinutes } });
    return poll;
  });
}

export async function getAvailabilityPoll(client: PrismaClient, actor: Actor, id: string) {
  const poll = await client.hubAvailabilityPoll.findFirst({ where: { id, organizationId: actor.organizationId }, include: { participants: { include: { member: { select: { id: true, name: true, avatarUrl: true } } } }, selections: { select: { memberId: true, slotStart: true } } } });
  if (!poll || !poll.participants.some((item) => item.memberId === actor.memberId) && !["SUPER_ADMIN", "ADMIN"].includes(actor.role)) throw new HubApiError("Consulta de disponibilidade não encontrada.", 404);
  const slots = slotsFor(poll.dates, poll.startMinute, poll.endMinute, poll.slotMinutes, poll.timezone);
  const total = poll.participants.length;
  const aggregate = slots.map((slotStart) => {
    const memberIds = poll.selections.filter((item) => item.slotStart.getTime() === slotStart.getTime()).map((item) => item.memberId);
    return { slotStart, count: memberIds.length, percentage: total ? Math.round(memberIds.length * 10000 / total) / 100 : 0, fullAttendance: total > 0 && memberIds.length === total, selectedByMe: memberIds.includes(actor.memberId), memberIds };
  });
  const max = Math.max(0, ...aggregate.map((item) => item.count));
  return { ...poll, participants: poll.participants.map((item) => item.member), slots: aggregate, bestSlots: aggregate.filter((item) => item.count === max && max > 0).slice(0, 10), fullAttendanceSlots: aggregate.filter((item) => item.fullAttendance), capabilities: { canManage: poll.createdById === actor.memberId || ["SUPER_ADMIN", "ADMIN"].includes(actor.role) } };
}

export async function saveAvailabilitySelection(client: PrismaClient, actor: Actor, id: string, selected: Date[]) {
  return hubCoreTransaction(client, async (tx) => {
    const poll = await tx.hubAvailabilityPoll.findFirst({ where: { id, organizationId: actor.organizationId, status: "OPEN", participants: { some: { memberId: actor.memberId } } } });
    if (!poll) throw new HubApiError("Consulta aberta não encontrada.", 404);
    if (poll.responseDeadline && poll.responseDeadline < new Date()) throw new HubApiError("O prazo de resposta terminou.", 409);
    const valid = new Set(slotsFor(poll.dates, poll.startMinute, poll.endMinute, poll.slotMinutes, poll.timezone).map((date) => date.toISOString()));
    const slots = [...new Map(selected.map((date) => [date.toISOString(), date])).values()];
    if (slots.some((date) => !valid.has(date.toISOString()))) throw new HubApiError("Horário inválido.", 400);
    await tx.hubAvailabilitySelection.deleteMany({ where: { pollId: id, memberId: actor.memberId } });
    if (slots.length) await tx.hubAvailabilitySelection.createMany({ data: slots.map((slotStart) => ({ pollId: id, memberId: actor.memberId, slotStart })) });
    await tx.hubAvailabilityPoll.update({ where: { id }, data: { version: { increment: 1 } } });
    await writeHubAudit(tx, { organizationId: actor.organizationId, memberId: actor.memberId, action: "AVAILABILITY_SELECTION_SAVED", entity: "AVAILABILITY_POLL", entityId: id, metadata: { slots: slots.length } });
    return getAvailabilityPoll(tx as unknown as PrismaClient, actor, id);
  });
}

export async function createMeetingFromAvailability(client: PrismaClient, actor: Actor, id: string, slotStart: Date, title?: string) {
  return hubCoreTransaction(client, async (tx) => {
    const poll = await tx.hubAvailabilityPoll.findFirst({ where: { id, organizationId: actor.organizationId, status: "OPEN" }, include: { participants: true } });
    if (!poll) throw new HubApiError("Consulta aberta não encontrada.", 404);
    if (poll.createdById !== actor.memberId && !["SUPER_ADMIN", "ADMIN"].includes(actor.role)) throw new HubApiError("Ação não permitida.", 403);
    if (!slotsFor(poll.dates, poll.startMinute, poll.endMinute, poll.slotMinutes, poll.timezone).some((date) => date.getTime() === slotStart.getTime())) throw new HubApiError("Horário inválido.", 400);
    const meeting = await tx.hubMeeting.create({ data: { organizationId: actor.organizationId, title: title?.trim() || poll.title, description: poll.description, status: "SCHEDULED", startAt: slotStart, endAt: new Date(slotStart.getTime() + poll.slotMinutes * 60_000), timezone: poll.timezone, directorateId: poll.directorateId, createdById: actor.memberId, idempotencyKey: `availability:${id}:${slotStart.toISOString()}:${crypto.randomUUID()}`, participants: { create: poll.participants.map((item) => ({ memberId: item.memberId, responseStatus: item.memberId === actor.memberId ? "ACCEPTED" : "PENDING", respondedAt: item.memberId === actor.memberId ? new Date() : null })) }, directorates: poll.directorateId ? { create: { directorateId: poll.directorateId } } : undefined } });
    await tx.hubAvailabilityPoll.update({ where: { id }, data: { status: "SCHEDULED", version: { increment: 1 } } });
    await writeHubAudit(tx, { organizationId: actor.organizationId, memberId: actor.memberId, action: "MEETING_CREATED_FROM_AVAILABILITY", entity: "MEETING", entityId: meeting.id, metadata: { pollId: id } });
    return meeting;
  });
}
