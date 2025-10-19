/**
 * Feed Repository Implementation
 *
 * RSSフィードの取得とタイムスタンプ管理の実装。
 */

import type { FeedEntry } from '@mikaelporttila/rss';
import type { IFeedRepository } from '../../domain/repositories/index.ts';
import fetchFeedItems from '../external/RssFeedClient.ts';

/**
 * フィードリポジトリの実装
 */
export class FeedRepository implements IFeedRepository {
  private readonly timestampFile = 'data/.timestamp';

  /**
   * フィードから最新のアイテムを取得する
   */
  async fetchLatestItems(feedUrl: string): Promise<FeedEntry[]> {
    return await fetchFeedItems(feedUrl);
  }

  /**
   * 最後にフィードを取得したタイムスタンプを取得する
   */
  async getLastFetchedTimestamp(): Promise<number> {
    try {
      const content = await Deno.readTextFile(this.timestampFile);
      return parseInt(content, 10) || 0;
    } catch {
      return 0;
    }
  }

  /**
   * フィードを取得したタイムスタンプを保存する
   */
  async saveLastFetchedTimestamp(timestamp: number): Promise<void> {
    await Deno.writeTextFile(this.timestampFile, timestamp.toString());
  }
}
