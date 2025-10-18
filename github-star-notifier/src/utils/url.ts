/**
 * URLユーティリティ
 *
 * URL処理の共通ロジックを提供します。
 */

/**
 * URLを検証し、正規化する
 *
 * @param url - 検証するURL
 * @param baseUrl - ベースURL（相対URLの場合に使用）
 * @returns 正規化されたURL
 * @throws {Error} 無効なURLの場合
 */
export function validateAndNormalizeUrl(url: string, baseUrl?: string): string {
  try {
    const normalized = new URL(url, baseUrl);
    return normalized.href;
  } catch (error) {
    throw new Error(`Invalid URL: ${url}`, { cause: error });
  }
}

/**
 * URLが有効かチェックする
 *
 * @param url - チェックするURL
 * @returns 有効な場合true
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 相対URLを絶対URLに変換する
 *
 * @param relativeUrl - 相対URL
 * @param baseUrl - ベースURL
 * @returns 絶対URL
 */
export function toAbsoluteUrl(relativeUrl: string, baseUrl: string): string {
  return validateAndNormalizeUrl(relativeUrl, baseUrl);
}

/**
 * URLからドメインを取得する
 *
 * @param url - URL
 * @returns ドメイン名
 */
export function getDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return '';
  }
}
