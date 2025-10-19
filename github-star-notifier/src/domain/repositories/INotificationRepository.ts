/**
 * Notification Repository Interface
 *
 * SNS投稿とWebhook通知を抽象化します。
 */

import type { AtpAgent, RichText } from '@atproto/api';

/**
 * 通知リポジトリのインターフェース
 */
export interface INotificationRepository {
  /**
   * Blueskyに投稿する
   *
   * @param params - 投稿パラメータ
   */
  publishToBluesky(params: {
    agent: AtpAgent;
    richText: RichText;
    title: string;
    link: string;
    mimeType?: string;
    image?: Uint8Array;
  }): Promise<void>;

  /**
   * Webhookに通知を送信する
   *
   * @param message - 通知メッセージ
   * @param webhookUrl - Webhook URL
   */
  sendWebhookNotification(message: string, webhookUrl?: string): Promise<void>;
}
