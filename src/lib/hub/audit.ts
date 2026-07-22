import type { Prisma, PrismaClient } from "@prisma/client";

type AuditClient = PrismaClient | Prisma.TransactionClient;

export async function writeHubAudit(
  client: AuditClient,
  input: {
    organizationId: string;
    memberId?: string | null;
    action: string;
    entity: string;
    entityId?: string | null;
    metadata?: Prisma.InputJsonValue;
  },
) {
  return client.hubAuditLog.create({
    data: {
      organizationId: input.organizationId,
      memberId: input.memberId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      metadata: input.metadata,
    },
  });
}
