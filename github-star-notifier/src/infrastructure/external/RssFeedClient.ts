/**
 * RSS feedから記事リストを取得するモジュール
 */

import { readFile } from 'node:fs/promises';
import Parser, { type Item } from 'rss-parser';
import type { FeedEntry } from '../../types/feedEntry.ts';
import { MAX_FEED_ITEMS, PATTERNS } from '../../config/constants.ts';
import { logger } from '../../utils/logger.ts';
import { NetworkError } from '../../utils/errors.ts';

const parser = new Parser();

/**
 * rss-parser のアイテムを FeedEntry 形式に変換する
 */
export function mapItemToFeedEntry(item: Item): FeedEntry {
  const dateStr = item.pubDate ?? item.isoDate;
  return {
    id: item.guid || item.link,
    title: item.title ? { value: item.title } : undefined,
    links: item.link ? [{ href: item.link }] : [],
    published: dateStr ? new Date(dateStr) : undefined,
    description: item.content
      ? { value: item.content }
      : item.contentSnippet
        ? { value: item.contentSnippet }
        : undefined,
  };
}

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
    const timestamp = await readFile('data/.timestamp', 'utf-8');
    logger.debug('Last execution time', { timestamp: timestamp.trim() });
    return timestamp.trim();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
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
    const feed = await parser.parseString(xml);
    const entries = feed.items.map(mapItemToFeedEntry);

    const foundList = entries.reverse().filter((item) => {
      return (
        item.published &&
        new Date(Number(lastExecutionTime)) < new Date(item.published) &&
        PATTERNS.STARRED_FILTER.test(item.title?.value || '')
      );
    });

    const result = foundList.slice(0, MAX_FEED_ITEMS);
    logger.debug('Fetched feed items', {
      total: entries.length,
      filtered: result.length,
    });
    return result;
  } catch (error) {
    logger.error('Failed to fetch feed items', error, { rssUrl });
    throw error;
  }
};
