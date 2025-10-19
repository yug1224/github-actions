/**
 * URL Value Object
 *
 * URLを表す値オブジェクト。
 * 不変で、値による等価性を持つ。
 * 生成時にバリデーションを行い、無効なURLは生成できない。
 */

/**
 * 無効なURL例外
 */
export class InvalidUrlError extends Error {
  constructor(url: string, cause?: Error) {
    super(`無効なURL: ${url}`);
    this.name = 'InvalidUrlError';
    this.cause = cause;
  }
}

/**
 * URL Value Object
 *
 * @example
 * ```typescript
 * // 有効なURLの場合
 * const url = Url.create("https://example.com");
 * console.log(url.toString()); // "https://example.com"
 *
 * // 無効なURLの場合はエラー
 * Url.create("invalid-url"); // throws InvalidUrlError
 * ```
 */
export class Url {
  private readonly value: string;

  /**
   * プライベートコンストラクタ
   * 外部からは create() または fromString() を使用する
   */
  private constructor(url: string) {
    this.value = url;
  }

  /**
   * URLを生成する
   *
   * @param url - URL文字列
   * @returns Urlインスタンス
   * @throws {InvalidUrlError} 無効なURLの場合
   */
  static create(url: string): Url {
    if (!Url.isValid(url)) {
      throw new InvalidUrlError(url);
    }

    try {
      // URLを正規化（トレイリングスラッシュの統一など）
      const normalized = new URL(url);
      return new Url(normalized.href);
    } catch (error) {
      throw new InvalidUrlError(url, error as Error);
    }
  }

  /**
   * 文字列からURLを生成する（createのエイリアス）
   *
   * @param url - URL文字列
   * @returns Urlインスタンス
   * @throws {InvalidUrlError} 無効なURLの場合
   */
  static fromString(url: string): Url {
    return Url.create(url);
  }

  /**
   * 相対URLを絶対URLに変換して生成する
   *
   * @param relativeUrl - 相対URL
   * @param baseUrl - ベースURL
   * @returns Urlインスタンス
   * @throws {InvalidUrlError} 無効なURLの場合
   */
  static fromRelative(relativeUrl: string, baseUrl: string): Url {
    try {
      const absolute = new URL(relativeUrl, baseUrl);
      return new Url(absolute.href);
    } catch (error) {
      throw new InvalidUrlError(
        `${relativeUrl} (base: ${baseUrl})`,
        error as Error,
      );
    }
  }

  /**
   * URLが有効かチェックする
   *
   * @param url - チェックするURL文字列
   * @returns 有効な場合true
   */
  static isValid(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 別のUrlと等価かチェックする
   *
   * @param other - 比較対象のUrl
   * @returns 等価な場合true
   */
  equals(other: Url): boolean {
    return this.value === other.value;
  }

  /**
   * ドメイン名を取得する
   *
   * @returns ドメイン名（例: "example.com"）
   */
  getDomain(): string {
    try {
      const parsed = new URL(this.value);
      return parsed.hostname;
    } catch {
      return '';
    }
  }

  /**
   * プロトコルを取得する
   *
   * @returns プロトコル（例: "https:"）
   */
  getProtocol(): string {
    try {
      const parsed = new URL(this.value);
      return parsed.protocol;
    } catch {
      return '';
    }
  }

  /**
   * パスを取得する
   *
   * @returns パス（例: "/path/to/page"）
   */
  getPath(): string {
    try {
      const parsed = new URL(this.value);
      return parsed.pathname;
    } catch {
      return '';
    }
  }

  /**
   * URL文字列を取得する
   *
   * @returns URL文字列
   */
  toString(): string {
    return this.value;
  }

  /**
   * JSON表現を取得する
   *
   * @returns URL文字列
   */
  toJSON(): string {
    return this.value;
  }
}
