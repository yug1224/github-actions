/**
 * FeedRepository実装
 *
 * RSSフィードの取得と保存を管理
 */

import { IFeedRepository } from '../../domain/repositories/IFeedRepository.ts';
import { FeedItem } from '../../domain/models/FeedItem.ts';
import { Timestamp } from '../../domain/models/Timestamp.ts';
import { Url } from '../../domain/models/Url.ts';
import { RssFeedClient } from '../external/RssFeedClient.ts';
import { logger } from '../../utils/logger.ts';
import { FileNotFoundError } from '../../utils/errors.ts';
import { FILE_PATHS } from '../../config/constants.ts';

/**
 * フィードリポジトリ実装
 */
export class FeedRepository implements IFeedRepository {
  constructor(private readonly rssFeedClient: RssFeedClient) {}

  /**
   * RSSフィードから最新のアイテムを取得する
   */
  async fetchLatestItems(feedUrl: Url): Promise<FeedItem[]> {
    logger.info('RSSフィードからアイテムを取得しています', {
      feedUrl: feedUrl.toString(),
    });

    const entries = await this.rssFeedClient.fetchFeed(feedUrl.toString());

    // 新しい順にソート（逆順）
    const sortedEntries = entries.reverse();

    const items = sortedEntries.map((entry) => FeedItem.fromRaw(entry));

    logger.info('フィードアイテムの取得に成功しました', {
      count: items.length,
    });

    return items;
  }

  /**
   * 最終取得タイムスタンプを取得する
   */
  async getLastFetchedTimestamp(): Promise<Timestamp | null> {
    try {
      const content = await Deno.readTextFile(FILE_PATHS.TIMESTAMP);
      const timestamp = Timestamp.fromString(content.trim());

      logger.info('最終取得タイムスタンプを読み込みました', {
        timestamp: timestamp.toISOString(),
      });

      return timestamp;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        logger.warn('タイムスタンプファイルが見つかりません', {
          path: FILE_PATHS.TIMESTAMP,
        });
        return null;
      }

      throw new FileNotFoundError(FILE_PATHS.TIMESTAMP, error as Error);
    }
  }

  /**
   * 最終取得タイムスタンプを保存する
   */
  async saveLastFetchedTimestamp(timestamp: Timestamp): Promise<void> {
    await Deno.writeTextFile(FILE_PATHS.TIMESTAMP, timestamp.toString());

    logger.info('最終取得タイムスタンプを保存しました', {
      timestamp: timestamp.toISOString(),
    });
  }

  /**
   * 未投稿のアイテムリストを取得する
   */
  async getUnpostedItems(): Promise<FeedItem[]> {
    try {
      const content = await Deno.readTextFile(FILE_PATHS.ITEM_LIST);
      const jsonData = JSON.parse(content);

      if (!Array.isArray(jsonData)) {
        logger.warn('アイテムリストの形式が不正です');
        return [];
      }

      const items = jsonData.map((item) => FeedItem.fromRaw(item));

      logger.info('未投稿アイテムリストを読み込みました', {
        count: items.length,
      });

      return items;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        logger.info('未投稿アイテムリストが見つかりません', {
          path: FILE_PATHS.ITEM_LIST,
        });
        return [];
      }

      logger.error('未投稿アイテムリストの読み込みに失敗しました', error);
      return [];
    }
  }

  /**
   * 未投稿のアイテムリストを保存する
   */
  async saveUnpostedItems(items: FeedItem[]): Promise<void> {
    const jsonData = items.map((item) => item.toJSON());
    await Deno.writeTextFile(FILE_PATHS.ITEM_LIST, JSON.stringify(jsonData));

    logger.info('未投稿アイテムリストを保存しました', {
      count: items.length,
    });
  }
}
