/**
 * Feed Repository Implementation
 *
 * RSSフィードの取得とタイムスタンプ管理の実装。
 */

import { readFile, writeFile } from 'node:fs/promises';
import type { FeedEntry } from '../../types/feedEntry.ts';
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
      const content = await readFile(this.timestampFile, 'utf-8');
      return parseInt(content, 10) || 0;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return 0;
      }
      throw error;
    }
  }

  /**
   * フィードを取得したタイムスタンプを保存する
   */
  async saveLastFetchedTimestamp(timestamp: number): Promise<void> {
    await writeFile(this.timestampFile, timestamp.toString(), 'utf-8');
  }
}
