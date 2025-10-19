/**
 * Feed Repository Interface
 *
 * RSSフィードの取得とタイムスタンプ管理を抽象化します。
 */

import type { FeedEntry } from 'jsr:@mikaelporttila/rss';

/**
 * フィードリポジトリのインターフェース
 */
export interface IFeedRepository {
  /**
   * フィードから最新のアイテムを取得する
   *
   * @param feedUrl - フィードのURL
   * @returns 最新のフィードアイテムのリスト
   */
  fetchLatestItems(feedUrl: string): Promise<FeedEntry[]>;

  /**
   * 最後にフィードを取得したタイムスタンプを取得する
   *
   * @returns 最後の取得時刻（ミリ秒）、まだ取得していない場合は0
   */
  getLastFetchedTimestamp(): Promise<number>;

  /**
   * フィードを取得したタイムスタンプを保存する
   *
   * @param timestamp - 取得時刻（ミリ秒）
   */
  saveLastFetchedTimestamp(timestamp: number): Promise<void>;
}
