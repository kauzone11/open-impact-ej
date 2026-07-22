import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  INVITATION_TTL_HOURS: z.coerce.number().int().min(1).max(720).default(72),
  RESEND_API_KEY: z.string().optional(),
  INVITATION_EMAIL_FROM: z.union([z.literal(""), z.string().email()]).optional(),
});

export type AppEnv = z.infer<typeof EnvSchema>;
export function parseEnv(environment: NodeJS.ProcessEnv = process.env): AppEnv { return EnvSchema.parse(environment); }
export function runtimeEnv(): AppEnv { return parseEnv(process.env); }
