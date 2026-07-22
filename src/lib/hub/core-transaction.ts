import { Prisma, type PrismaClient } from "@prisma/client";
import { prismaErrorCode, serializationConflict } from "@/lib/hub/collaboration-idempotency";

type TransactionClient = Prisma.TransactionClient;

const SERIALIZABLE = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
} as const;

export async function hubCoreTransaction<T>(
  client: PrismaClient,
  operation: (tx: TransactionClient) => Promise<T>,
) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      return await client.$transaction(operation, SERIALIZABLE);
    } catch (error) {
      if (!["P2034", "40001", "40P01"].includes(prismaErrorCode(error))) throw error;
      if (attempt === 5) throw serializationConflict();
      await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 15));
    }
  }

  throw serializationConflict();
}
