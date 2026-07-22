import { HubApiError } from "@/lib/hub/api";
import { validTimezone } from "@/lib/hub/collaboration-validation";

type LocalDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

function parseLocalDateTime(value: unknown): LocalDateTimeParts {
  const match = typeof value === "string" ? LOCAL_DATE_TIME.exec(value) : null;
  if (!match) throw new HubApiError("Data e hora local invalida.", 422);
  const [, year, month, day, hour, minute] = match.map(Number);
  const probe = new Date(Date.UTC(year, month - 1, day, hour, minute));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day ||
    probe.getUTCHours() !== hour ||
    probe.getUTCMinutes() !== minute
  )
    throw new HubApiError("Data e hora local invalida.", 422);
  return { year, month, day, hour, minute };
}

export function zonedParts(date: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: validTimezone(timezone, "UTC"),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || "";
  const weekdays: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    weekday: weekdays[get("weekday")],
    date: `${get("year")}-${get("month")}-${get("day")}`,
  };
}

function sameLocal(a: ReturnType<typeof zonedParts>, b: LocalDateTimeParts) {
  return (
    a.year === b.year &&
    a.month === b.month &&
    a.day === b.day &&
    a.hour === b.hour &&
    a.minute === b.minute
  );
}

/**
 * Converts a wall-clock value in an IANA timezone to UTC. Nonexistent DST
 * values are rejected. When a DST fallback makes a value ambiguous, the
 * earliest matching UTC instant is selected deterministically.
 */
export function zonedLocalDateTimeToUtc(
  localDateTime: unknown,
  timezone: string,
) {
  const zone = validTimezone(timezone, "UTC");
  const local = parseLocalDateTime(localDateTime);
  const naive = Date.UTC(
    local.year,
    local.month - 1,
    local.day,
    local.hour,
    local.minute,
  );
  const offsets = new Set<number>();
  for (let hours = -48; hours <= 48; hours += 6) {
    const instant = new Date(naive + hours * 3_600_000);
    const parts = zonedParts(instant, zone);
    const represented = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
    );
    offsets.add(represented - instant.getTime());
  }
  const matches = [...offsets]
    .map((offset) => new Date(naive - offset))
    .filter((candidate) => sameLocal(zonedParts(candidate, zone), local))
    .sort((a, b) => a.getTime() - b.getTime());
  if (!matches.length)
    throw new HubApiError(
      "Este horario local nao existe no fuso informado por causa da transicao de horario de verao.",
      422,
    );
  return matches[0];
}

export function parseMeetingLocalRange(input: {
  startLocal: unknown;
  endLocal: unknown;
  timezone: string;
}) {
  const startAt = zonedLocalDateTimeToUtc(input.startLocal, input.timezone);
  const endAt = zonedLocalDateTimeToUtc(input.endLocal, input.timezone);
  if (endAt <= startAt || endAt.getTime() - startAt.getTime() < 15 * 60_000)
    throw new HubApiError("A reuniao deve durar ao menos 15 minutos.", 422);
  return { startAt, endAt };
}

export function organizationDate(date: Date, timezone: string) {
  return zonedParts(date, timezone).date;
}

export function organizationDayUtcRange(dateText: string, timezone: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText))
    throw new HubApiError("Data invalida.", 422);
  const startAt = zonedLocalDateTimeToUtc(`${dateText}T00:00`, timezone);
  const nextProbe = new Date(`${dateText}T12:00:00.000Z`);
  nextProbe.setUTCDate(nextProbe.getUTCDate() + 1);
  const next = nextProbe.toISOString().slice(0, 10);
  const endAt = zonedLocalDateTimeToUtc(`${next}T00:00`, timezone);
  return { startAt, endAt };
}

export function addCivilDays(dateText: string, days: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText) || !Number.isInteger(days))
    throw new HubApiError("Data invalida.", 422);
  const probe = new Date(`${dateText}T12:00:00.000Z`);
  probe.setUTCDate(probe.getUTCDate() + days);
  return probe.toISOString().slice(0, 10);
}
