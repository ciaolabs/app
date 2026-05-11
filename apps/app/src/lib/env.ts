import { z } from "zod";

const _schema = z
  .object({
    // Required
    WORKOS_CLIENT_ID: z.string().min(1),
    WORKOS_API_KEY: z.string().min(1),
    WORKOS_COOKIE_PASSWORD: z.string().min(32),
    NEXT_PUBLIC_WORKOS_REDIRECT_URI: z.string().min(1),
    NEXT_PUBLIC_SURVEY_URL: z.string().min(1),

    // Optional
    WORKOS_COOKIE_DOMAIN: z.string().optional(),
    SURVEY_INTERNAL_URL: z.string().optional(),
    SURVEY_CONTEXT_SECRET: z.string().optional(),
    API_KEY_ENCRYPTION_SECRET: z
      .string()
      .min(32, "API_KEY_ENCRYPTION_SECRET must be at least 32 characters when set")
      .optional(),
    SURVEY_STORAGE: z.enum(["memory", "postgres"]).default("memory"),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    // Database (at least one required — validated via .refine below)
    DATABASE_URL: z.string().optional(),
    POSTGRES_URL: z.string().optional(),
    POSTGRES_PRISMA_URL: z.string().optional(),
  })
  .refine(
    (data) =>
      Boolean(data.DATABASE_URL || data.POSTGRES_URL || data.POSTGRES_PRISMA_URL),
    {
      message:
        "At least one database URL must be set: DATABASE_URL, POSTGRES_URL, or POSTGRES_PRISMA_URL",
      path: ["DATABASE_URL"],
    }
  );

function parseEnv() {
  const result = _schema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`❌ Invalid environment variables:\n${issues}`);
  }
  // Resolve SURVEY_INTERNAL_URL fallback to NEXT_PUBLIC_SURVEY_URL
  const data = result.data;
  if (!data.SURVEY_INTERNAL_URL) {
    data.SURVEY_INTERNAL_URL = data.NEXT_PUBLIC_SURVEY_URL;
  }
  return data;
}

export const env = parseEnv();
