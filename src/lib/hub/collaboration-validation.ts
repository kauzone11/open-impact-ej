import { HubApiError } from "@/lib/hub/api";
import { isIP } from "node:net";

export function text(
  value: unknown,
  label: string,
  max: number,
  required?: true,
): string;
export function text(
  value: unknown,
  label: string,
  max: number,
  required: false,
): string | null;
export function text(
  value: unknown,
  label: string,
  max: number,
  required = true,
) {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (required && !normalized)
    throw new HubApiError(`${label} e obrigatorio.`, 422);
  if (normalized.length > max)
    throw new HubApiError(
      `${label} deve ter no maximo ${max} caracteres.`,
      422,
    );
  return normalized || null;
}
export function dateValue(value: unknown, label: string) {
  const parsed =
    typeof value === "string" ? new Date(value) : new Date(Number.NaN);
  if (Number.isNaN(parsed.getTime()))
    throw new HubApiError(`${label} invalido.`, 422);
  return parsed;
}
export function validTimezone(value: unknown, fallback: string) {
  const timezone =
    typeof value === "string" && value.trim() ? value.trim() : fallback;
  try {
    new Intl.DateTimeFormat("pt-BR", { timeZone: timezone }).format();
  } catch {
    throw new HubApiError("Fuso horario IANA invalido.", 422);
  }
  return timezone;
}
export function safeHttpsUrl(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  try {
    const url = new URL(String(value));
    if (url.protocol !== "https:" || url.username || url.password)
      throw new Error();
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    const ipVersion = isIP(host);
    const privateIpv4 =
      ipVersion === 4 &&
      (/^0\./.test(host) ||
        /^127\./.test(host) ||
        /^10\./.test(host) ||
        /^192\.168\./.test(host) ||
        /^169\.254\./.test(host) ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(host));
    const privateIpv6 =
      ipVersion === 6 &&
      (host === "::" ||
        host === "::1" ||
        /^f[cd]/.test(host) ||
        /^fe[89ab]/.test(host) ||
        /^::ffff:(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(
          host,
        ));
    const validHostname =
      ipVersion > 0 ||
      (host.includes(".") &&
        host.length <= 253 &&
        host.split(".").every(
          (label) =>
            Boolean(label) &&
            label.length <= 63 &&
            /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label),
        ));
    if (
      host === "localhost" ||
      host.endsWith(".local") ||
      privateIpv4 ||
      privateIpv6 ||
      !validHostname
    )
      throw new Error();
    return url.toString();
  } catch {
    throw new HubApiError(
      "O link da reuniao deve usar HTTPS publico e nao pode conter credenciais.",
      422,
    );
  }
}
export function eventUuid(value: unknown, label = "Evento") {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      normalized,
    )
  )
    throw new HubApiError(`${label} deve ser um UUID valido.`, 422);
  return normalized.toLowerCase();
}
export function stringIds(value: unknown) {
  return Array.isArray(value)
    ? [
        ...new Set(
          value
            .filter(
              (item): item is string =>
                typeof item === "string" && Boolean(item.trim()),
            )
            .map((item) => item.trim()),
        ),
      ]
    : [];
}
export function idempotencyKey(value: unknown) {
  return text(value, "Chave de idempotencia", 120) as string;
}
