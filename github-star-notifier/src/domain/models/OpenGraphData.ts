/**
 * OpenGraphData Value Object
 *
 * Open Graph Protocol のメタデータを表す値オブジェクト。
 * 不変で、値による等価性を持つ。
 */

import { Url } from './Url.ts';

/**
 * OGP画像情報
 */
export interface OgpImage {
  url: Url;
  width?: number;
  height?: number;
  type?: string;
}

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
 *   image: "https://example.com/image.jpg",
 *   url: "https://example.com"
 * });
 *
 * console.log(ogp.getTitle()); // "Example Page"
 * console.log(ogp.hasImage()); // true
 * ```
 */
export class OpenGraphData {
  private readonly title?: string;
  private readonly description?: string;
  private readonly images: readonly OgpImage[];
  private readonly url?: Url;

  /**
   * プライベートコンストラクタ
   * 外部からは create() を使用する
   */
  private constructor(
    title?: string,
    description?: string,
    images: OgpImage[] = [],
    url?: Url,
  ) {
    this.title = title;
    this.description = description;
    this.images = Object.freeze([...images]);
    this.url = url;
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
    image?: string | string[];
    images?: Array<{
      url: string;
      width?: number;
      height?: number;
      type?: string;
    }>;
    url?: string;
  }): OpenGraphData {
    // URL の変換
    const url = data.url ? Url.create(data.url) : undefined;

    // 画像データの変換
    let ogpImages: OgpImage[] = [];

    // images プロパティがある場合
    if (data.images && data.images.length > 0) {
      ogpImages = data.images.map((img) => ({
        url: Url.create(img.url),
        width: img.width,
        height: img.height,
        type: img.type,
      }));
    } // image プロパティがある場合
    else if (data.image) {
      const imageUrls = Array.isArray(data.image) ? data.image : [data.image];
      ogpImages = imageUrls.map((imgUrl) => ({
        url: Url.create(imgUrl),
      }));
    }

    return new OpenGraphData(
      data.title,
      data.description,
      ogpImages,
      url,
    );
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
    ogImage?: Array<{
      url: string;
      width?: number;
      height?: number;
      type?: string;
    }>;
    ogUrl?: string;
  }): OpenGraphData {
    return OpenGraphData.create({
      title: ogpData.ogTitle,
      description: ogpData.ogDescription,
      images: ogpData.ogImage,
      url: ogpData.ogUrl,
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
      this.images.length === other.images.length &&
      this.images.every((img, index) => img.url.equals(other.images[index].url)) &&
      (this.url?.equals(other.url!) ?? this.url === other.url)
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
   * 最初の画像を取得する
   *
   * @returns 最初の画像（存在しない場合はundefined）
   */
  getFirstImage(): OgpImage | undefined {
    return this.images[0];
  }

  /**
   * すべての画像を取得する
   *
   * @returns すべての画像の配列
   */
  getImages(): readonly OgpImage[] {
    return this.images;
  }

  /**
   * URLを取得する
   *
   * @returns URL（存在しない場合はundefined）
   */
  getUrl(): Url | undefined {
    return this.url;
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
    return this.images.length > 0;
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
    images: Array<{
      url: string;
      width?: number;
      height?: number;
      type?: string;
    }>;
    url?: string;
  } {
    return {
      title: this.title,
      description: this.description,
      images: this.images.map((img) => ({
        url: img.url.toString(),
        width: img.width,
        height: img.height,
        type: img.type,
      })),
      url: this.url?.toString(),
    };
  }
}
