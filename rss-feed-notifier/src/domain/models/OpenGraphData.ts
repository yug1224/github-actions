/**
 * OpenGraphData Value Object
 *
 * Open Graph Protocol のメタデータを表す値オブジェクト。
 * 不変で、値による等価性を持つ。
 */

import { Url } from './Url.ts';

/**
 * 無効なOGPデータ例外
 */
export class InvalidOpenGraphDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidOpenGraphDataError';
  }
}

/**
 * OpenGraphData Value Object
 *
 * @example
 * ```typescript
 * // OGPデータの生成
 * const ogp = OpenGraphData.create({
 *   title: "Example Page",
 *   description: "This is an example page",
 *   imageUrl: "https://example.com/image.jpg"
 * });
 *
 * console.log(ogp.getTitle()); // "Example Page"
 * console.log(ogp.hasImage()); // true
 * ```
 */
export class OpenGraphData {
  private readonly title?: string;
  private readonly description?: string;
  private readonly imageUrl?: Url;

  /**
   * プライベートコンストラクタ
   * 外部からは create() を使用する
   */
  private constructor(
    title?: string,
    description?: string,
    imageUrl?: Url,
  ) {
    this.title = title;
    this.description = description;
    this.imageUrl = imageUrl;
  }

  /**
   * OGPデータを生成する
   *
   * @param data - OGPデータ
   * @returns OpenGraphDataインスタンス
   */
  static create(data: {
    title?: string;
    description?: string;
    imageUrl?: string;
  }): OpenGraphData {
    const imageUrl = data.imageUrl ? Url.create(data.imageUrl) : undefined;
    return new OpenGraphData(data.title, data.description, imageUrl);
  }

  /**
   * 空のOGPデータを生成する
   *
   * @returns 空のOpenGraphDataインスタンス
   */
  static empty(): OpenGraphData {
    return new OpenGraphData();
  }

  /**
   * 既存のOGPデータオブジェクトから生成する
   * （外部ライブラリのレスポンスから変換する用）
   *
   * @param ogpData - 既存のOGPデータ
   * @returns OpenGraphDataインスタンス
   */
  static fromRaw(ogpData: {
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: Array<{ url: string }> | { url: string };
  }): OpenGraphData {
    const imageUrl = (() => {
      if (!ogpData.ogImage) return undefined;
      if (Array.isArray(ogpData.ogImage)) {
        return ogpData.ogImage[0]?.url;
      }
      return ogpData.ogImage.url;
    })();

    return OpenGraphData.create({
      title: ogpData.ogTitle,
      description: ogpData.ogDescription,
      imageUrl,
    });
  }

  /**
   * 別のOpenGraphDataと等価かチェックする
   *
   * @param other - 比較対象のOpenGraphData
   * @returns 等価な場合true
   */
  equals(other: OpenGraphData): boolean {
    return (
      this.title === other.title &&
      this.description === other.description &&
      (this.imageUrl?.equals(other.imageUrl!) ?? this.imageUrl === other.imageUrl)
    );
  }

  /**
   * タイトルを取得する
   *
   * @returns タイトル（存在しない場合はundefined）
   */
  getTitle(): string | undefined {
    return this.title;
  }

  /**
   * 説明を取得する
   *
   * @returns 説明（存在しない場合はundefined）
   */
  getDescription(): string | undefined {
    return this.description;
  }

  /**
   * 画像URLを取得する
   *
   * @returns 画像URL（存在しない場合はundefined）
   */
  getImageUrl(): Url | undefined {
    return this.imageUrl;
  }

  /**
   * タイトルが存在するかチェックする
   *
   * @returns タイトルが存在する場合true
   */
  hasTitle(): boolean {
    return this.title !== undefined && this.title.length > 0;
  }

  /**
   * 説明が存在するかチェックする
   *
   * @returns 説明が存在する場合true
   */
  hasDescription(): boolean {
    return this.description !== undefined && this.description.length > 0;
  }

  /**
   * 画像が存在するかチェックする
   *
   * @returns 画像が存在する場合true
   */
  hasImage(): boolean {
    return this.imageUrl !== undefined;
  }

  /**
   * OGPデータが空かチェックする
   *
   * @returns すべてのフィールドが空の場合true
   */
  isEmpty(): boolean {
    return !this.hasTitle() && !this.hasDescription() && !this.hasImage();
  }

  /**
   * タイトルまたは説明を取得する（フォールバック付き）
   *
   * @param fallback - どちらも存在しない場合のフォールバック文字列
   * @returns タイトルまたは説明、両方ない場合はフォールバック
   */
  getTitleOrDescription(fallback: string = ''): string {
    return this.title || this.description || fallback;
  }

  /**
   * JSON表現を取得する
   *
   * @returns OGPデータのJSON表現
   */
  toJSON(): {
    title?: string;
    description?: string;
    imageUrl?: string;
  } {
    return {
      title: this.title,
      description: this.description,
      imageUrl: this.imageUrl?.toString(),
    };
  }
}
