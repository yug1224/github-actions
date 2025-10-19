/**
 * Timestamp Value Object
 *
 * エポックミリ秒のタイムスタンプを表す値オブジェクト。
 * 不変で、値による等価性を持つ。
 */

/**
 * 無効なタイムスタンプ例外
 */
export class InvalidTimestampError extends Error {
  constructor(value: number | string) {
    super(`無効なタイムスタンプ: ${value}`);
    this.name = 'InvalidTimestampError';
  }
}

/**
 * Timestamp Value Object
 *
 * @example
 * ```typescript
 * // 現在時刻のタイムスタンプを生成
 * const now = Timestamp.now();
 *
 * // 特定の時刻から生成
 * const ts = Timestamp.fromDate(new Date('2024-01-01'));
 *
 * // エポックミリ秒から生成
 * const ts2 = Timestamp.fromMillis(1704067200000);
 * ```
 */
export class Timestamp {
  private readonly value: number;

  /**
   * プライベートコンストラクタ
   * 外部からは now(), fromDate(), fromMillis() などを使用する
   */
  private constructor(millis: number) {
    this.value = millis;
  }

  /**
   * 現在時刻のタイムスタンプを生成する
   *
   * @returns Timestampインスタンス
   */
  static now(): Timestamp {
    return new Timestamp(Date.now());
  }

  /**
   * Dateオブジェクトからタイムスタンプを生成する
   *
   * @param date - Date オブジェクト
   * @returns Timestampインスタンス
   * @throws {InvalidTimestampError} 無効な日付の場合
   */
  static fromDate(date: Date): Timestamp {
    const millis = date.getTime();
    if (isNaN(millis)) {
      throw new InvalidTimestampError(date.toString());
    }
    return new Timestamp(millis);
  }

  /**
   * エポックミリ秒からタイムスタンプを生成する
   *
   * @param millis - エポックミリ秒
   * @returns Timestampインスタンス
   * @throws {InvalidTimestampError} 無効な値の場合
   */
  static fromMillis(millis: number): Timestamp {
    if (!Number.isFinite(millis) || millis < 0) {
      throw new InvalidTimestampError(millis);
    }
    return new Timestamp(millis);
  }

  /**
   * ISO 8601文字列からタイムスタンプを生成する
   *
   * @param isoString - ISO 8601形式の日時文字列
   * @returns Timestampインスタンス
   * @throws {InvalidTimestampError} 無効な文字列の場合
   */
  static fromISOString(isoString: string): Timestamp {
    const date = new Date(isoString);
    return Timestamp.fromDate(date);
  }

  /**
   * 文字列からタイムスタンプを生成する
   *
   * @param value - タイムスタンプ文字列（エポックミリ秒またはISO 8601形式）
   * @returns Timestampインスタンス
   * @throws {InvalidTimestampError} 無効な文字列の場合
   */
  static fromString(value: string): Timestamp {
    // エポックミリ秒の文字列の場合
    const millis = Number(value);
    if (!isNaN(millis) && Number.isFinite(millis)) {
      return Timestamp.fromMillis(millis);
    }

    // ISO 8601形式の場合
    return Timestamp.fromISOString(value);
  }

  /**
   * 別のTimestampと等価かチェックする
   *
   * @param other - 比較対象のTimestamp
   * @returns 等価な場合true
   */
  equals(other: Timestamp): boolean {
    return this.value === other.value;
  }

  /**
   * 別のTimestampより前かチェックする
   *
   * @param other - 比較対象のTimestamp
   * @returns 前の場合true
   */
  isBefore(other: Timestamp): boolean {
    return this.value < other.value;
  }

  /**
   * 別のTimestampより後かチェックする
   *
   * @param other - 比較対象のTimestamp
   * @returns 後の場合true
   */
  isAfter(other: Timestamp): boolean {
    return this.value > other.value;
  }

  /**
   * エポックミリ秒を取得する
   *
   * @returns エポックミリ秒
   */
  toMillis(): number {
    return this.value;
  }

  /**
   * Dateオブジェクトに変換する
   *
   * @returns Date オブジェクト
   */
  toDate(): Date {
    return new Date(this.value);
  }

  /**
   * ISO 8601形式の文字列に変換する
   *
   * @returns ISO 8601形式の日時文字列
   */
  toISOString(): string {
    return this.toDate().toISOString();
  }

  /**
   * 文字列表現を取得する（エポックミリ秒）
   *
   * @returns エポックミリ秒の文字列
   */
  toString(): string {
    return this.value.toString();
  }

  /**
   * JSON表現を取得する
   *
   * @returns エポックミリ秒
   */
  toJSON(): number {
    return this.value;
  }
}
