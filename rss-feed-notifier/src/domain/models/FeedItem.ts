/**
 * FeedItem Entity
 *
 * RSSフィードのアイテムを表すエンティティ。
 * 一意の識別子を持つ。
 */

import { Timestamp } from './Timestamp.ts';
import { Url } from './Url.ts';

/**
 * FeedItem Entity
 *
 * @example
 * ```typescript
 * const item = FeedItem.create({
 *   id: "https://example.com/article/1",
 *   title: "Example Article",
 *   url: "https://example.com/article/1",
 *   publishedAt: new Date(),
 *   description: "This is an example article"
 * });
 * ```
 */
export class FeedItem {
  private constructor(
    private readonly id: string,
    private readonly title: string,
    private readonly url: Url,
    private readonly publishedAt: Timestamp,
    private readonly description: string,
  ) {}

  /**
   * FeedItemを生成する
   *
   * @param data - フィードアイテムのデータ
   * @returns FeedItemインスタンス
   */
  static create(data: {
    id: string;
    title: string;
    url: string;
    publishedAt: Date;
    description: string;
  }): FeedItem {
    return new FeedItem(
      data.id,
      data.title,
      Url.create(data.url),
      Timestamp.fromDate(data.publishedAt),
      data.description,
    );
  }

  /**
   * RSS feedパーサーのレスポンスからFeedItemを生成する
   *
   * @param rawItem - RSSフィードの生データ
   * @returns FeedItemインスタンス
   */
  static fromRaw(rawItem: {
    id: string;
    title?: { value?: string };
    links: { href?: string }[];
    published?: string | Date;
    description?: { value?: string };
  }): FeedItem {
    const publishedAt = (() => {
      if (!rawItem.published) return new Date();
      if (typeof rawItem.published === 'string') {
        return new Date(rawItem.published);
      }
      return rawItem.published;
    })();

    return FeedItem.create({
      id: rawItem.id,
      title: rawItem.title?.value || '',
      url: rawItem.links[0]?.href || '',
      publishedAt,
      description: rawItem.description?.value || '',
    });
  }

  /**
   * IDを取得する
   *
   * @returns ID
   */
  getId(): string {
    return this.id;
  }

  /**
   * タイトルを取得する
   *
   * @returns タイトル
   */
  getTitle(): string {
    return this.title;
  }

  /**
   * URLを取得する
   *
   * @returns URL
   */
  getUrl(): Url {
    return this.url;
  }

  /**
   * 公開日時を取得する
   *
   * @returns 公開日時
   */
  getPublishedAt(): Timestamp {
    return this.publishedAt;
  }

  /**
   * 説明を取得する
   *
   * @returns 説明
   */
  getDescription(): string {
    return this.description;
  }

  /**
   * 指定されたタイムスタンプより後に公開されたかチェックする
   *
   * @param timestamp - 比較対象のタイムスタンプ
   * @returns 後に公開された場合true
   */
  isPublishedAfter(timestamp: Timestamp): boolean {
    return this.publishedAt.isAfter(timestamp);
  }

  /**
   * 別のFeedItemと同じかチェックする
   *
   * @param other - 比較対象のFeedItem
   * @returns 同じ場合true
   */
  equals(other: FeedItem): boolean {
    return this.id === other.id;
  }

  /**
   * JSON表現を取得する
   *
   * @returns JSON表現
   */
  toJSON(): {
    id: string;
    title: { value: string };
    links: { href: string }[];
    published: string;
    description: { value: string };
  } {
    return {
      id: this.id,
      title: { value: this.title },
      links: [{ href: this.url.toString() }],
      published: this.publishedAt.toISOString(),
      description: { value: this.description },
    };
  }
}
