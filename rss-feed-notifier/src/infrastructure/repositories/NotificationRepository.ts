/**
 * NotificationRepository実装
 *
 * Bluesky投稿とWebhook通知を管理
 */

import {
  BlueskyPostData,
  INotificationRepository,
} from '../../domain/repositories/INotificationRepository.ts';
import { BlueskyClient } from '../external/BlueskyClient.ts';
import { WebhookClient } from '../external/WebhookClient.ts';
import { logger } from '../../utils/logger.ts';

/**
 * 通知リポジトリ実装
 */
export class NotificationRepository implements INotificationRepository {
  constructor(
    private readonly blueskyClient: BlueskyClient,
    private readonly webhookClient?: WebhookClient,
  ) {}

  /**
   * Blueskyに投稿する
   */
  async postToBluesky(postData: BlueskyPostData): Promise<void> {
    logger.info('Blueskyに投稿します', {
      text: postData.richText.text,
      url: postData.url,
    });

    await this.blueskyClient.post({
      richText: postData.richText,
      title: postData.title,
      url: postData.url,
      description: postData.description,
      image: postData.image,
    });

    logger.info('Blueskyへの投稿が完了しました');
  }

  /**
   * Webhookに通知する
   */
  async notifyViaWebhook(text: string): Promise<void> {
    if (!this.webhookClient) {
      logger.info('Webhook URLが設定されていないため、通知をスキップします');
      return;
    }

    logger.info('Webhookに通知します', { textLength: text.length });

    await this.webhookClient.send(text);

    logger.info('Webhookへの通知が完了しました');
  }
}
