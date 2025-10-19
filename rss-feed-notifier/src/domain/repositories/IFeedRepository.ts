/**
 * IFeedRepository
 *
 * RSSフィードの取得と管理を抽象化するリポジトリインターフェース
 */

import { FeedItem } from '../models/FeedItem.ts';
import { Timestamp } from '../models/Timestamp.ts';
import { Url } from '../models/Url.ts';

/**
 * フィードリポジトリインターフェース
 */
export interface IFeedRepository {
  /**
   * RSSフィードから最新のアイテムを取得する
   *
   * @param feedUrl - RSSフィードのURL
   * @returns フィードアイテムの配列
   */
  fetchLatestItems(feedUrl: Url): Promise<FeedItem[]>;

  /**
   * 最終取得タイムスタンプを取得する
   *
   * @returns 最終取得タイムスタンプ（存在しない場合はnull）
   */
  getLastFetchedTimestamp(): Promise<Timestamp | null>;

  /**
   * 最終取得タイムスタンプを保存する
   *
   * @param timestamp - 保存するタイムスタンプ
   */
  saveLastFetchedTimestamp(timestamp: Timestamp): Promise<void>;

  /**
   * 未投稿のアイテムリストを取得する
   *
   * @returns 未投稿のフィードアイテムの配列
   */
  getUnpostedItems(): Promise<FeedItem[]>;

  /**
   * 未投稿のアイテムリストを保存する
   *
   * @param items - 保存するフィードアイテムの配列
   */
  saveUnpostedItems(items: FeedItem[]): Promise<void>;
}
