import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

function readDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const env = readFileSync(".env", "utf8");
  const match = env.match(/^DATABASE_URL=(.+)$/m);
  if (!match) {
    throw new Error("DATABASE_URL is required. Copy .env.example to .env for local development.");
  }

  return match[1].trim().replace(/^"|"$/g, "");
}

function sqlitePathFromUrl(databaseUrl) {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error("The local db:push helper currently supports SQLite file: URLs only.");
  }

  const rawPath = databaseUrl.slice("file:".length);
  if (rawPath.startsWith("./")) {
    return path.join("prisma", rawPath.slice(2));
  }

  return rawPath;
}

function tryAlter(db, statement) {
  try {
    db.exec(statement);
  } catch (error) {
    if (!String(error.message).includes("duplicate column name")) {
      throw error;
    }
  }
}

const dbPath = sqlitePathFromUrl(readDatabaseUrl());
mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);

db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS "Study" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventName" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventSize" TEXT NOT NULL,
    "expectedAudience" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "SurveyResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studyId" TEXT NOT NULL,
    "isLocalResident" BOOLEAN NOT NULL,
    "originCity" TEXT NOT NULL,
    "cameSpecificallyForEvent" BOOLEAN NOT NULL,
    "groupSize" INTEGER NOT NULL,
    "foodSpend" REAL NOT NULL DEFAULT 0,
    "transportSpend" REAL NOT NULL DEFAULT 0,
    "shoppingSpend" REAL NOT NULL DEFAULT 0,
    "lodgingSpend" REAL NOT NULL DEFAULT 0,
    "otherSpend" REAL NOT NULL DEFAULT 0,
    "stayedOvernight" BOOLEAN NOT NULL DEFAULT false,
    "averageStayDays" REAL NOT NULL DEFAULT 1,
    "spendingScope" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SurveyResponse_studyId_fkey"
      FOREIGN KEY ("studyId") REFERENCES "Study" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
  );

  CREATE INDEX IF NOT EXISTS "SurveyResponse_studyId_idx" ON "SurveyResponse"("studyId");
`);

tryAlter(db, `ALTER TABLE "SurveyResponse" ADD COLUMN "otherSpend" REAL NOT NULL DEFAULT 0;`);
tryAlter(db, `ALTER TABLE "SurveyResponse" ADD COLUMN "stayedOvernight" BOOLEAN NOT NULL DEFAULT false;`);

db.close();

console.log(`SQLite schema is ready at ${dbPath}`);
