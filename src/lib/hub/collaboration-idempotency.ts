import { createHash } from "node:crypto";
import { HubApiError } from "@/lib/hub/api";

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, stable(item)]),
    );
  return value;
}

export function requestHash(value: unknown) {
  return createHash("sha256")
    .update(JSON.stringify(stable(value)))
    .digest("hex");
}

export function assertMatchingRequestHash(
  stored: string | null | undefined,
  incoming: string,
) {
  if (stored && stored !== incoming)
    throw new HubApiError(
      "A chave de idempotencia ja foi usada com dados diferentes.",
      409,
    );
}

export function prismaErrorCode(error: unknown) {
  return typeof error === "object" && error && "code" in error
    ? String((error as { code?: unknown }).code || "")
    : "";
}

export function serializationConflict() {
  return new HubApiError(
    "Outra alteracao concorrente venceu. Atualize e tente novamente.",
    409,
    { code: "CONCURRENT_WRITE" },
  );
}
