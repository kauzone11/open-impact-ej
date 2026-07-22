import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const sourceUrl = process.env.DATABASE_URL;
if (!sourceUrl) throw new Error("DATABASE_URL é obrigatória para testar as migrações.");

const parsed = new URL(sourceUrl);
if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
  throw new Error("O teste de migrações exige PostgreSQL.");
}

const prefix = `open_impact_migration_test_${randomUUID().replaceAll("-", "").slice(0, 12)}`;
const cleanName = `${prefix}_clean`;
const legacyName = `${prefix}_legacy`;
const adminUrl = new URL(parsed);
adminUrl.pathname = "/postgres";

function databaseUrl(name: string) {
  const url = new URL(parsed);
  url.pathname = `/${name}`;
  return url.toString();
}

function quotedIdentifier(value: string) {
  if (!/^[a-z0-9_]+$/.test(value)) throw new Error("Identificador de banco inseguro.");
  return `"${value}"`;
}

function runPrisma(url: string, args: string[]) {
  const prismaCli = path.join(process.cwd(), "node_modules", "prisma", "build", "index.js");
  const result = spawnSync(process.execPath, [prismaCli, ...args], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: url },
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(`prisma ${args.join(" ")} falhou:\n${result.error?.message || ""}\n${result.stdout || ""}\n${result.stderr || ""}`);
  }
}

function migrate(url: string) {
  runPrisma(url, ["migrate", "deploy"]);
}

function baselineLegacyDatabase(url: string) {
  const migrationName = "20260722000000_open_impact_ej_baseline";
  const migrationFile = path.join("prisma", "migrations", migrationName, "migration.sql");
  runPrisma(url, ["db", "execute", "--file", migrationFile, "--schema", "prisma/schema.prisma"]);
  runPrisma(url, ["migrate", "resolve", "--applied", migrationName]);
  migrate(url);
}

async function createDatabase(admin: PrismaClient, name: string) {
  await admin.$executeRawUnsafe(`CREATE DATABASE ${quotedIdentifier(name)}`);
}

async function dropDatabase(admin: PrismaClient, name: string) {
  await admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS ${quotedIdentifier(name)} WITH (FORCE)`);
}

async function assertCleanInstall() {
  const url = databaseUrl(cleanName);
  migrate(url);
  const database = new PrismaClient({ datasourceUrl: url });
  try {
    const migrationCount = await database.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count FROM "_prisma_migrations" WHERE finished_at IS NOT NULL
    `;
    const organizationCount = await database.hubOrganization.count();
    if (Number(migrationCount[0]?.count) !== 1 || organizationCount !== 0) {
      throw new Error("A instalação limpa não produziu o estado inicial esperado.");
    }
  } finally {
    await database.$disconnect();
  }
}

async function assertLegacyUpgrade() {
  const url = databaseUrl(legacyName);
  const legacy = new PrismaClient({ datasourceUrl: url });
  try {
    await legacy.$executeRawUnsafe(`CREATE TABLE "Study" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "methodology" TEXT NOT NULL)`);
    await legacy.$executeRawUnsafe(`CREATE TABLE "Event" ("id" TEXT PRIMARY KEY, "studyId" TEXT NOT NULL REFERENCES "Study"("id"), "attendees" INTEGER NOT NULL)`);
    await legacy.$executeRawUnsafe(`INSERT INTO "Study" ("id", "name", "methodology") VALUES ('legacy-study', 'Evento legado representativo', 'small-events')`);
    await legacy.$executeRawUnsafe(`INSERT INTO "Event" ("id", "studyId", "attendees") VALUES ('legacy-event', 'legacy-study', 120)`);
  } finally {
    await legacy.$disconnect();
  }

  baselineLegacyDatabase(url);

  const upgraded = new PrismaClient({ datasourceUrl: url });
  try {
    const legacyRows = await upgraded.$queryRaw<Array<{ studies: bigint; events: bigint }>>`
      SELECT
        (SELECT COUNT(*)::bigint FROM "Study") AS studies,
        (SELECT COUNT(*)::bigint FROM "Event") AS events
    `;
    if (Number(legacyRows[0]?.studies) !== 1 || Number(legacyRows[0]?.events) !== 1) {
      throw new Error("Registros legados foram alterados durante a aplicação da baseline.");
    }
    if (await upgraded.hubAccount.count() !== 0 || await upgraded.hubOrganization.count() !== 0) {
      throw new Error("A baseline criou contas ou organizações duplicadas.");
    }

    await upgraded.$executeRawUnsafe(`DROP TABLE "Event"`);
    await upgraded.$executeRawUnsafe(`DROP TABLE "Study"`);
    const remaining = await upgraded.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name IN ('Study', 'Event')
    `;
    if (Number(remaining[0]?.count) !== 0) throw new Error("Tabelas obsoletas permaneceram após a limpeza explícita.");
  } finally {
    await upgraded.$disconnect();
  }
}

async function main() {
  const admin = new PrismaClient({ datasourceUrl: adminUrl.toString() });
  try {
    await createDatabase(admin, cleanName);
    await createDatabase(admin, legacyName);
    await assertCleanInstall();
    await assertLegacyUpgrade();
    console.log("Migrações validadas: instalação limpa e atualização representativa do esquema legado.");
  } finally {
    await dropDatabase(admin, cleanName).catch(() => undefined);
    await dropDatabase(admin, legacyName).catch(() => undefined);
    await admin.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
