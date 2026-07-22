import type { Prisma, PrismaClient } from "@prisma/client";
import { HubApiError } from "@/lib/hub/api";
import { writeHubAudit } from "@/lib/hub/audit";
import { validTimezone } from "@/lib/hub/collaboration-validation";
import { addCivilDays, zonedParts } from "@/lib/hub/timezone";
import { canAccessMeeting } from "@/lib/hub/collaboration-policy";

type Client = PrismaClient | Prisma.TransactionClient;
export type AvailabilityRuleInput = {
  weekday: number;
  startMinute: number;
  endMinute: number;
  timezone?: string;
  isActive?: boolean;
};
export type AvailabilityConflict = {
  memberId: string;
  memberName: string;
  reason: "UNAVAILABLE" | "OUTSIDE_AVAILABILITY" | "MEETING_CONFLICT";
  conflictingMeetingId: string | null;
};

function validStartMinute(value: number) {
  return Number.isInteger(value) && value >= 0 && value <= 1439;
}
function validEndMinute(value: number) {
  return Number.isInteger(value) && value >= 1 && value <= 1440;
}
export function validateAvailabilityRules(
  rules: AvailabilityRuleInput[],
  defaultTimezone: string,
) {
  const normalized = rules.map((rule) => ({
    ...rule,
    timezone: validTimezone(rule.timezone, defaultTimezone),
    isActive: rule.isActive !== false,
  }));
  const timezones = new Set(normalized.map((rule) => rule.timezone));
  if (timezones.size > 1)
    throw new HubApiError(
      "Todos os intervalos do membro devem usar o mesmo fuso horario.",
      422,
    );
  for (const rule of normalized) {
    if (!Number.isInteger(rule.weekday) || rule.weekday < 0 || rule.weekday > 6)
      throw new HubApiError("Dia da semana invalido.", 422);
    if (
      !validStartMinute(rule.startMinute) ||
      !validEndMinute(rule.endMinute) ||
      rule.endMinute <= rule.startMinute
    )
      throw new HubApiError("Intervalo semanal invalido.", 422);
  }
  const sorted = [...normalized].sort(
    (a, b) => a.weekday - b.weekday || a.startMinute - b.startMinute,
  );
  for (let index = 1; index < sorted.length; index += 1)
    if (
      sorted[index].weekday === sorted[index - 1].weekday &&
      sorted[index].startMinute < sorted[index - 1].endMinute
    )
      throw new HubApiError(
        "Os intervalos semanais nao podem se sobrepor.",
        409,
      );
  return normalized;
}
export async function replaceAvailability(
  client: PrismaClient,
  input: {
    organizationId: string;
    actorId: string;
    memberId: string;
    rules: AvailabilityRuleInput[];
    defaultTimezone: string;
  },
) {
  return client.$transaction(
    async (tx) => {
      const member = await tx.hubMember.findFirst({
        where: {
          id: input.memberId,
          organizationId: input.organizationId,
          status: "ACTIVE",
        },
        select: { id: true },
      });
      if (!member) throw new HubApiError("Membro ativo nao encontrado.", 404);
      const rules = validateAvailabilityRules(
        input.rules,
        input.defaultTimezone,
      );
      await tx.hubAvailabilityRule.deleteMany({
        where: {
          organizationId: input.organizationId,
          memberId: input.memberId,
        },
      });
      if (rules.length)
        await tx.hubAvailabilityRule.createMany({
          data: rules.map((rule) => ({
            organizationId: input.organizationId,
            memberId: input.memberId,
            ...rule,
          })),
        });
      await writeHubAudit(tx, {
        organizationId: input.organizationId,
        memberId: input.actorId,
        action: "AVAILABILITY_REPLACED",
        entity: "AVAILABILITY",
        entityId: input.memberId,
        metadata: { intervalCount: rules.length },
      });
      return rules;
    },
    { isolationLevel: "Serializable" },
  );
}
function overlaps(
  start: number,
  end: number,
  rangeStart: number,
  rangeEnd: number,
) {
  return start < rangeEnd && end > rangeStart;
}
export async function checkAvailability(
  client: Client,
  input: {
    organizationId: string;
    requesterId: string;
    participantIds: string[];
    startAt: Date;
    endAt: Date;
    timezone: string;
    excludeMeetingId?: string;
  },
) {
  if (
    input.endAt <= input.startAt ||
    input.endAt.getTime() - input.startAt.getTime() < 15 * 60_000
  )
    throw new HubApiError("A reuniao deve durar ao menos 15 minutos.", 422);
  const organization = await client.hubOrganization.findUnique({
    where: { id: input.organizationId },
    select: { timezone: true },
  });
  if (!organization) throw new HubApiError("Organizacao nao encontrada.", 404);
  const requester = await client.hubMember.findFirst({
    where: {
      id: input.requesterId,
      organizationId: input.organizationId,
      status: "ACTIVE",
    },
    select: { id: true, role: true, directorateId: true },
  });
  if (!requester) throw new HubApiError("Solicitante nao encontrado.", 404);
  const participants = await client.hubMember.findMany({
    where: {
      id: { in: input.participantIds },
      organizationId: input.organizationId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      availabilityRules: {
        where: { isActive: true },
        orderBy: [{ weekday: "asc" }, { startMinute: "asc" }],
      },
    },
  });
  if (participants.length !== new Set(input.participantIds).size)
    throw new HubApiError(
      "Todos os participantes devem ser membros ativos da organizacao.",
      422,
    );
  const effectiveZones = new Map<string, string>();
  for (const member of participants) {
    const zones = new Set(member.availabilityRules.map((rule) => rule.timezone));
    if (zones.size > 1)
      throw new HubApiError(
        `A disponibilidade de ${member.name} possui fusos inconsistentes.`,
        409,
      );
    effectiveZones.set(
      member.id,
      zones.values().next().value || organization.timezone,
    );
  }
  const localDates = new Set<string>();
  for (const member of participants) {
    const zone = effectiveZones.get(member.id)!;
    let date = zonedParts(input.startAt, zone).date;
    const endDate = zonedParts(new Date(input.endAt.getTime() - 1), zone).date;
    for (let dayIndex = 0; ; dayIndex += 1) {
      if (dayIndex > 3660)
        throw new HubApiError("Intervalo de reuniao excessivamente longo.", 422);
      localDates.add(date);
      if (date === endDate) break;
      date = addCivilDays(date, 1);
    }
  }
  const dateValues = [...localDates].map(
    (date) => new Date(`${date}T00:00:00.000Z`),
  );
  const [exceptions, meetings] = await Promise.all([
    client.hubAvailabilityException.findMany({
      where: {
        organizationId: input.organizationId,
        memberId: { in: input.participantIds },
        date: { in: dateValues },
      },
    }),
    client.hubMeeting.findMany({
      where: {
        organizationId: input.organizationId,
        status: "SCHEDULED",
        id: input.excludeMeetingId
          ? { not: input.excludeMeetingId }
          : undefined,
        startAt: { lt: input.endAt },
        endAt: { gt: input.startAt },
        participants: { some: { memberId: { in: input.participantIds } } },
      },
      select: {
        id: true,
        organizationId: true,
        directorateId: true,
        createdById: true,
        participants: {
          select: { memberId: true },
        },
      },
    }),
  ]);
  const conflicts: AvailabilityConflict[] = [];
  for (const member of participants) {
    const zone = effectiveZones.get(member.id)!;
    const localStart = zonedParts(input.startAt, zone);
    const localEndExclusive = zonedParts(
      new Date(input.endAt.getTime() - 1),
      zone,
    );
    const startMinute = localStart.hour * 60 + localStart.minute;
    const endMinuteExclusive =
      localEndExclusive.hour * 60 + localEndExclusive.minute + 1;
    const segments: Array<{
      date: string;
      weekday: number;
      startMinute: number;
      endMinute: number;
    }> = [];
    let date = localStart.date;
    for (let dayIndex = 0; ; dayIndex += 1) {
      if (dayIndex > 3660)
        throw new HubApiError("Intervalo de reuniao excessivamente longo.", 422);
      const weekday = new Date(`${date}T12:00:00.000Z`).getUTCDay();
      segments.push({
        date,
        weekday,
        startMinute: date === localStart.date ? startMinute : 0,
        endMinute:
          date === localEndExclusive.date ? endMinuteExclusive : 1440,
      });
      if (date === localEndExclusive.date) break;
      date = addCivilDays(date, 1);
    }
    const ownExceptions = exceptions.filter(
      (item) => item.memberId === member.id,
    );
    const unavailable = segments.some((segment) =>
      ownExceptions.some(
        (item) =>
          item.date.toISOString().slice(0, 10) === segment.date &&
          item.type === "UNAVAILABLE" &&
          (item.startMinute === null ||
            overlaps(
              item.startMinute,
              item.endMinute || 1440,
              segment.startMinute,
              segment.endMinute,
            )),
      ),
    );
    const available = segments.every((segment) => {
      const temporaryAvailable = ownExceptions.some(
        (item) =>
          item.date.toISOString().slice(0, 10) === segment.date &&
          item.type === "AVAILABLE" &&
          (item.startMinute === null ||
            (item.startMinute <= segment.startMinute &&
              (item.endMinute || 1440) >= segment.endMinute)),
      );
      const weeklyAvailable = member.availabilityRules.some(
        (item) =>
          item.weekday === segment.weekday &&
          item.startMinute <= segment.startMinute &&
          item.endMinute >= segment.endMinute,
      );
      return temporaryAvailable || weeklyAvailable;
    });
    const meeting = meetings.find((item) =>
      item.participants.some(
        (participant) => participant.memberId === member.id,
      ),
    );
    if (unavailable)
      conflicts.push({
        memberId: member.id,
        memberName: member.name,
        reason: "UNAVAILABLE",
        conflictingMeetingId: null,
      });
    else if (!available)
      conflicts.push({
        memberId: member.id,
        memberName: member.name,
        reason: "OUTSIDE_AVAILABILITY",
        conflictingMeetingId: null,
      });
    if (meeting)
      conflicts.push({
        memberId: member.id,
        memberName: member.name,
        reason: "MEETING_CONFLICT",
        conflictingMeetingId: canAccessMeeting(
          {
            memberId: requester.id,
            organizationId: input.organizationId,
            role: requester.role,
            directorateId: requester.directorateId,
          },
          meeting,
        ) ? meeting.id : null,
      });
  }
  return conflicts;
}
