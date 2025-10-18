/**
 * 環境変数の検証と取得
 */

export interface EnvConfig {
  BLUESKY_IDENTIFIER: string;
  BLUESKY_PASSWORD: string;
  GOOGLE_AI_API_KEY: string;
  GEMINI_MODEL: string;
  RSS_URL: string;
  WEBHOOK_URL?: string;
}

/**
 * 必須の環境変数を検証し、取得する
 * @throws {Error} 必須の環境変数が不足している場合
 */
export function validateAndGetEnv(): EnvConfig {
  const requiredEnvVars = [
    'BLUESKY_IDENTIFIER',
    'BLUESKY_PASSWORD',
    'GOOGLE_AI_API_KEY',
    'RSS_URL',
  ];

  const missingVars: string[] = [];

  for (const varName of requiredEnvVars) {
    const value = Deno.env.get(varName);
    if (!value || value.trim() === '') {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
        'Please set these variables in your .env file or environment.',
    );
  }

  return {
    BLUESKY_IDENTIFIER: Deno.env.get('BLUESKY_IDENTIFIER')!,
    BLUESKY_PASSWORD: Deno.env.get('BLUESKY_PASSWORD')!,
    GOOGLE_AI_API_KEY: Deno.env.get('GOOGLE_AI_API_KEY')!,
    GEMINI_MODEL: Deno.env.get('GEMINI_MODEL') || 'gemini-2.0-flash-lite',
    RSS_URL: Deno.env.get('RSS_URL')!,
    WEBHOOK_URL: Deno.env.get('WEBHOOK_URL'),
  };
}
