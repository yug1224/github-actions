/**
 * RSSフィードクライアント
 *
 * RSSフィードの取得とパース機能を提供
 */

import Parser from 'rss-parser';
import { logger } from '../../utils/logger.ts';
import { NetworkError } from '../../utils/errors.ts';

/**
 * RSSフィードのエントリ（外部ライブラリの型）
 */
export interface RssFeedEntry {
  id: string;
  title?: { value?: string };
  links: { href?: string }[];
  published?: string | Date;
  description?: { value?: string };
}

/**
 * RSSフィードクライアント
 */
export class RssFeedClient {
  private readonly parser = new Parser();

  /**
   * RSSフィードを取得してパースする
   *
   * @param feedUrl - フィードURL
   * @returns パースされたフィードエントリの配列
   * @throws {NetworkError} ネットワークエラーの場合
   */
  async fetchFeed(feedUrl: string): Promise<RssFeedEntry[]> {
    try {
      logger.info('RSSフィードを取得しています', { feedUrl });

      const response = await fetch(feedUrl);

      if (!response.ok) {
        throw new NetworkError(feedUrl, response.status);
      }

      const xml = await response.text();
      const feed = await this.parser.parseString(xml);

      const entries: RssFeedEntry[] = (feed.items ?? []).map((item) => ({
        id: item.guid ?? item.link ?? item.title ?? '',
        title: item.title ? { value: item.title } : undefined,
        links: item.link ? [{ href: item.link }] : [],
        published: item.pubDate ?? item.isoDate,
        description:
          (item.contentSnippet ?? item.content) ? { value: item.contentSnippet ?? item.content ?? '' } : undefined,
      }));

      logger.info('RSSフィードの取得に成功しました', {
        feedUrl,
        entryCount: entries.length,
      });

      return entries;
    } catch (error) {
      if (error instanceof NetworkError) {
        throw error;
      }

      logger.error('RSSフィードの取得に失敗しました', error, { feedUrl });
      throw new NetworkError(feedUrl, undefined, error as Error);
    }
  }
}
