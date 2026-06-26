/**
 * INotificationRepository
 *
 * 通知（Bluesky）を抽象化するリポジトリインターフェース
 */

import { RichText } from '@atproto/api';

/**
 * Bluesky投稿データ
 */
export interface BlueskyPostData {
  richText: RichText;
  title: string;
  url: string;
  description: string;
  image?: {
    data: Uint8Array;
    mimeType: string;
  };
}

/**
 * 通知リポジトリインターフェース
 */
export interface INotificationRepository {
  /**
   * Blueskyに投稿する
   *
   * @param postData - 投稿データ
   */
  postToBluesky(postData: BlueskyPostData): Promise<void>;
}
