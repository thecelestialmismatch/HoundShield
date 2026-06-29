export function getSecret(name: string, fallback: string = ""): string {
  return process.env[name] ?? fallback
}

export const googleApiKey = (): string => getSecret("GOOGLE_API_KEY");
export const openAiApiKey = (): string => getSecret("OPENAI_API_KEY");
