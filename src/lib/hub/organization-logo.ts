import { isIP } from "node:net";

export const MAX_HUB_LOGO_URL_LENGTH = 500;

function isBlockedIpv4(hostname: string) {
  const octets = hostname.split(".").map(Number);
  if (octets.length !== 4 || octets.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) return true;
  const [a, b] = octets;
  return a === 0
    || a === 10
    || a === 127
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168);
}

function isBlockedIpv6(hostname: string) {
  const normalized = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (normalized === "::" || normalized === "::1") return true;
  if (/^(?:fc|fd|fe[89ab])/.test(normalized)) return true;
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return mapped ? isBlockedIpv4(mapped[1]) : false;
}

export function normalizeHubLogoUrl(value: unknown) {
  if (value === null || value === "") return null;
  if (typeof value !== "string" || value.length > MAX_HUB_LOGO_URL_LENGTH) throw new Error("URL do logo invalida.");
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("URL do logo invalida.");
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) throw new Error("URL do logo invalida.");
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) throw new Error("URL do logo invalida.");
  const ipVersion = isIP(hostname.replace(/^\[|\]$/g, ""));
  if ((ipVersion === 4 && isBlockedIpv4(hostname)) || (ipVersion === 6 && isBlockedIpv6(hostname))) throw new Error("URL do logo invalida.");
  url.hostname = hostname;
  url.hash = "";
  const normalized = url.toString();
  if (normalized.length > MAX_HUB_LOGO_URL_LENGTH) throw new Error("URL do logo invalida.");
  return normalized;
}
