/**
 * RSS feedから記事リストを取得するモジュール
 */

import { type FeedEntry, parseFeed } from 'jsr:@mikaelporttila/rss';
import { MAX_FEED_ITEMS, PATTERNS } from '../../config/constants.ts';
import { logger } from '../../utils/logger.ts';
import { NetworkError } from '../../utils/errors.ts';

/**
 * 最終実行時間を取得する
 *
 * .timestampファイルから最終実行時間を読み込む。
 * ファイルが存在しない場合は'0'を返す。
 *
 * @returns 最終実行時間のタイムスタンプ文字列
 */
const getLastExecutionTime = async (): Promise<string> => {
  try {
    const timestamp = await Deno.readTextFile('data/.timestamp');
    logger.debug('Last execution time', { timestamp: timestamp.trim() });
    return timestamp.trim();
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      logger.info('No timestamp file found, using default value (0)');
      return '0';
    }
    throw error;
  }
};

/**
 * RSSフィードから新規アイテムを取得する
 *
 * 指定されたRSS URLからフィードを取得し、最終実行時間以降の
 * "starred"を含むアイテムのみをフィルタリングして返す。
 *
 * @param rssUrl - RSS フィードのURL
 * @returns フィードエントリーの配列（最大MAX_FEED_ITEMS件）
 */
export default async (rssUrl: string): Promise<FeedEntry[]> => {
  try {
    const lastExecutionTime = await getLastExecutionTime();

    const response = await fetch(rssUrl);
    if (!response.ok) {
      throw new NetworkError(rssUrl, response.status);
    }

    const xml = await response.text();
    const feed = await parseFeed(xml);

    // 最終実行時間以降かつ"starred"を含む記事を抽出
    const foundList = feed.entries.reverse().filter((item) => {
      return (
        item.published &&
        new Date(Number(lastExecutionTime)) < new Date(item.published) &&
        PATTERNS.STARRED_FILTER.test(item.title?.value || '')
      );
    });
    // foundListの上限件数までを返す
    const result = foundList.slice(0, MAX_FEED_ITEMS);
    logger.debug('Fetched feed items', {
      total: feed.entries.length,
      filtered: result.length,
    });
    return result;
  } catch (error) {
    logger.error('Failed to fetch feed items', error, { rssUrl });
    throw error;
  }
};
