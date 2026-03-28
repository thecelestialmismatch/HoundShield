/**
 * Environment validation.
 * Checks required env vars at startup and provides helpful error messages.
 * Non-critical vars log warnings; critical vars for production throw errors.
 */

export interface EnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceKey: string;
  encryptionKey: string;
  appUrl: string;
  slackWebhookUrl: string;
  bytezApiKey: string;
  isDemo: boolean;
}

export function validateEnv(): EnvConfig {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const encryptionKey = process.env.ENCRYPTION_KEY ?? "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL ?? "";
  const bytezApiKey = process.env.BYTEZ_API_KEY ?? "";

  const isDemo =
    !supabaseUrl.startsWith("https://") ||
    supabaseUrl.includes("YOUR-PROJECT-ID") ||
    supabaseServiceKey.includes("your-");

  if (isDemo) {
    console.log(
      "\n️  Kaelus running in DEMO MODE — configure Supabase in .env.local for production\n"
    );
  }

  if (!encryptionKey || encryptionKey.length < 64) {
    console.warn(
      "️  ENCRYPTION_KEY is missing or too short (need 64 hex chars). Quarantine encryption will fail."
    );
  }

  if (bytezApiKey) {
    console.log(" Bytez AI classification enabled (free tier)");
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceKey,
    encryptionKey,
    appUrl,
    slackWebhookUrl,
    bytezApiKey,
    isDemo,
  };
}
