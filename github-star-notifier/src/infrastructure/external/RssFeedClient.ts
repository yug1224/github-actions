/**
 * RSS feedから記事リストを取得するモジュール
 */

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
 * RSSフィードから新規アイテムを取得する
 *
 * 指定されたRSS URLからフィードを取得し、最終取得時刻以降の
 * "starred"を含むアイテムのみをフィルタリングして返す。
 * タイムスタンプの永続化は FeedRepository の責務とする。
 *
 * @param rssUrl - RSS フィードのURL
 * @param lastFetchedTimestampMs - 最終取得時刻（ミリ秒）
 * @returns フィードエントリーの配列（最大MAX_FEED_ITEMS件、古い順）
 */
export default async (rssUrl: string, lastFetchedTimestampMs: number): Promise<FeedEntry[]> => {
  try {
    const response = await fetch(rssUrl);
    if (!response.ok) {
      throw new NetworkError(rssUrl, response.status);
    }

    const xml = await response.text();
    const feed = await parser.parseString(xml);
    const entries = feed.items.map(mapItemToFeedEntry);
    const lastFetchedAt = new Date(lastFetchedTimestampMs);

    const foundList = entries.reverse().filter((item) => {
      return (
        item.published &&
        lastFetchedAt < new Date(item.published) &&
        PATTERNS.STARRED_FILTER.test(item.title?.value || '')
      );
    });

    const result = foundList.slice(0, MAX_FEED_ITEMS);
    logger.debug('Fetched feed items', {
      total: entries.length,
      filtered: result.length,
      lastFetchedTimestampMs,
    });
    return result;
  } catch (error) {
    logger.error('Failed to fetch feed items', error, { rssUrl });
    throw error;
  }
};
