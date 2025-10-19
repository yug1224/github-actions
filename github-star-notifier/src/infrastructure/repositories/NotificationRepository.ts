/**
 * Notification Repository Implementation
 *
 * SNS投稿とWebhook通知の実装。
 */

import type { AtpAgent, RichText } from 'npm:@atproto/api';
import type { INotificationRepository } from '../../domain/repositories/index.ts';
import publishToBluesky from '../external/BlueskyClient.ts';
import sendWebhookNotification from '../external/WebhookClient.ts';

/**
 * 通知リポジトリの実装
 */
export class NotificationRepository implements INotificationRepository {
  /**
   * Blueskyに投稿する
   */
  async publishToBluesky(params: {
    agent: AtpAgent;
    richText: RichText;
    title: string;
    link: string;
    mimeType?: string;
    image?: Uint8Array;
  }): Promise<void> {
    await publishToBluesky(params);
  }

  /**
   * Webhookに通知を送信する
   */
  async sendWebhookNotification(message: string, webhookUrl?: string): Promise<void> {
    await sendWebhookNotification(message, webhookUrl);
  }
}
