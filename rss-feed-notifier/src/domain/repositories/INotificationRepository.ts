/**
 * INotificationRepository
 *
 * 通知（BlueskyとWebhook）を抽象化するリポジトリインターフェース
 */

import { RichText } from 'npm:@atproto/api';

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

  /**
   * Webhookに通知する
   *
   * @param text - 通知テキスト
   */
  notifyViaWebhook(text: string): Promise<void>;
}
