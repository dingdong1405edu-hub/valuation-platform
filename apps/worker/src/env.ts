import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  ANTHROPIC_API_KEY: z.string().min(10),
  TAVILY_API_KEY: z.string().optional(),
  MISTRAL_API_KEY: z.string().optional(),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().optional(),
  STORAGE_DRIVER: z.enum(["local", "r2"]).default("local"),
  STORAGE_PATH: z.string().default("./storage"),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  LOG_LEVEL: z.string().default("info"),
  JOB_TIMEOUT_MS: z.coerce.number().int().default(1_200_000),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;
export function env(): Env {
  if (cached) return cached;
  cached = EnvSchema.parse(process.env);
  return cached;
}
