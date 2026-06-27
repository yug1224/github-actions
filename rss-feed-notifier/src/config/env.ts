/**
 * 環境変数の検証と取得
 */

export interface EnvConfig {
  RSS_URL: string;
  BLUESKY_IDENTIFIER: string;
  BLUESKY_PASSWORD: string;
}

/**
 * 必須の環境変数を検証し、取得する
 * @throws {Error} 必須の環境変数が不足している場合
 */
export function validateAndGetEnv(): EnvConfig {
  const requiredEnvVars = ['RSS_URL', 'BLUESKY_IDENTIFIER', 'BLUESKY_PASSWORD'];

  const missingVars: string[] = [];

  for (const varName of requiredEnvVars) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `必須の環境変数が設定されていません: ${missingVars.join(', ')}\n` +
        '.envファイルまたは環境変数にこれらの値を設定してください。',
    );
  }

  return {
    RSS_URL: process.env['RSS_URL']!,
    BLUESKY_IDENTIFIER: process.env['BLUESKY_IDENTIFIER']!,
    BLUESKY_PASSWORD: process.env['BLUESKY_PASSWORD']!,
  };
}
