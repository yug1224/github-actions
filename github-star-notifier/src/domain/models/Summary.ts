/**
 * Summary Value Object
 *
 * AI生成の要約文を表す値オブジェクト。
 * 不変で、値による等価性を持つ。
 * 最大文字数の制約を持つ。
 */

/**
 * 無効な要約例外
 */
export class InvalidSummaryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSummaryError';
  }
}

/**
 * Summary Value Object
 *
 * @example
 * ```typescript
 * // 有効な要約の場合
 * const summary = Summary.create("これは記事の要約です。");
 * console.log(summary.toString()); // "これは記事の要約です。"
 *
 * // 空の要約はエラー
 * Summary.create(""); // throws InvalidSummaryError
 *
 * // 長すぎる要約はエラー
 * Summary.create("x".repeat(1001)); // throws InvalidSummaryError
 * ```
 */
export class Summary {
  private readonly text: string;
  private readonly generatedAt: Date;

  /**
   * 要約文の最大文字数
   */
  static readonly MAX_LENGTH = 1000;

  /**
   * Bluesky投稿用の推奨最大文字数
   * （タイトルやURLを含めた全体で300文字以内にするため）
   */
  static readonly BLUESKY_RECOMMENDED_LENGTH = 200;

  /**
   * プライベートコンストラクタ
   * 外部からは create() を使用する
   */
  private constructor(text: string, generatedAt: Date = new Date()) {
    this.text = text;
    this.generatedAt = generatedAt;
  }

  /**
   * 要約を生成する
   *
   * @param text - 要約文
   * @param generatedAt - 生成日時（省略時は現在時刻）
   * @returns Summaryインスタンス
   * @throws {InvalidSummaryError} 無効な要約の場合
   */
  static create(text: string, generatedAt?: Date): Summary {
    // 空文字チェック
    if (!text || text.trim().length === 0) {
      throw new InvalidSummaryError('要約文は空にできません');
    }

    // 最大文字数チェック
    if (text.length > Summary.MAX_LENGTH) {
      throw new InvalidSummaryError(
        `要約文は${Summary.MAX_LENGTH}文字以内にしてください（現在: ${text.length}文字）`,
      );
    }

    return new Summary(text.trim(), generatedAt);
  }

  /**
   * Bluesky投稿用に短縮された要約を生成する
   *
   * @param text - 要約文
   * @param maxLength - 最大文字数（デフォルト: BLUESKY_RECOMMENDED_LENGTH）
   * @returns Summaryインスタンス
   */
  static createForBluesky(
    text: string,
    maxLength: number = Summary.BLUESKY_RECOMMENDED_LENGTH,
  ): Summary {
    const trimmed = text.trim();

    // 最大文字数を超える場合は切り詰める
    if (trimmed.length > maxLength) {
      const truncated = trimmed.substring(0, maxLength - 3) + '...';
      return new Summary(truncated);
    }

    return Summary.create(trimmed);
  }

  /**
   * 別のSummaryと等価かチェックする
   *
   * @param other - 比較対象のSummary
   * @returns 等価な場合true
   */
  equals(other: Summary): boolean {
    return this.text === other.text;
  }

  /**
   * 要約文を取得する
   *
   * @returns 要約文
   */
  getText(): string {
    return this.text;
  }

  /**
   * 生成日時を取得する
   *
   * @returns 生成日時
   */
  getGeneratedAt(): Date {
    return new Date(this.generatedAt);
  }

  /**
   * 文字数を取得する
   *
   * @returns 文字数
   */
  getLength(): number {
    return this.text.length;
  }

  /**
   * Bluesky投稿に適した長さかチェックする
   *
   * @returns 適した長さの場合true
   */
  isSuitableForBluesky(): boolean {
    return this.text.length <= Summary.BLUESKY_RECOMMENDED_LENGTH;
  }

  /**
   * 指定した文字数に切り詰める
   *
   * @param maxLength - 最大文字数
   * @returns 切り詰められた新しいSummaryインスタンス
   */
  truncate(maxLength: number): Summary {
    if (this.text.length <= maxLength) {
      return this;
    }

    const truncated = this.text.substring(0, maxLength - 3) + '...';
    return new Summary(truncated, this.generatedAt);
  }

  /**
   * 文字列表現を取得する
   *
   * @returns 要約文
   */
  toString(): string {
    return this.text;
  }

  /**
   * JSON表現を取得する
   *
   * @returns 要約文と生成日時を含むオブジェクト
   */
  toJSON(): { text: string; generatedAt: string } {
    return {
      text: this.text,
      generatedAt: this.generatedAt.toISOString(),
    };
  }
}
