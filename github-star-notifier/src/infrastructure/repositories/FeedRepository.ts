/**
 * Feed Repository Implementation
 *
 * RSSフィードの取得とタイムスタンプ管理の実装。
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { FeedEntry } from '../../types/feedEntry.ts';
import type { IFeedRepository } from '../../domain/repositories/index.ts';
import fetchFeedItems from '../external/RssFeedClient.ts';
import { logger } from '../../utils/logger.ts';

/**
 * 最終取得タイムスタンプが未設定（初回・キャッシュミス）かどうか
 */
export function isMissingLastFetchedTimestamp(timestampMs: number): boolean {
  return timestampMs === 0;
}

/**
 * フィードリポジトリの実装
 */
export class FeedRepository implements IFeedRepository {
  private readonly timestampFile = 'data/.timestamp';

  /**
   * フィードから最新のアイテムを取得する
   *
   * タイムスタンプ欠落時は履歴を投稿せず、現在時刻を保存して空配列を返す。
   */
  async fetchLatestItems(feedUrl: string): Promise<FeedEntry[]> {
    const lastTimestamp = await this.getLastFetchedTimestamp();

    if (isMissingLastFetchedTimestamp(lastTimestamp)) {
      await this.saveLastFetchedTimestamp(Date.now());
      logger.info('初回/タイムスタンプ欠落のため履歴投稿をスキップし現在時刻を保存');
      return [];
    }

    logger.debug('Last execution time', { timestamp: String(lastTimestamp) });
    return await fetchFeedItems(feedUrl, lastTimestamp);
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
        logger.info('No timestamp file found, using default value (0)');
        return 0;
      }
      throw error;
    }
  }

  /**
   * フィードを取得したタイムスタンプを保存する
   */
  async saveLastFetchedTimestamp(timestamp: number): Promise<void> {
    await mkdir(dirname(this.timestampFile), { recursive: true });
    await writeFile(this.timestampFile, timestamp.toString(), 'utf-8');
  }
}
