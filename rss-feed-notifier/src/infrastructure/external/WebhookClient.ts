/**
 * Webhookクライアント
 *
 * Webhook経由での通知機能を提供
 */

import { logger } from '../../utils/logger.ts';

/**
 * Webhookクライアント
 */
export class WebhookClient {
  constructor(private readonly webhookUrl: string) {}

  /**
   * Webhookに通知を送信する
   *
   * @param text - 通知テキスト
   */
  async send(text: string): Promise<void> {
    logger.info('Webhookに通知を送信しています', {
      webhookUrl: this.webhookUrl.substring(0, 30) + '...',
      textLength: text.length,
    });

    const payload = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value1: text }),
    };

    logger.debug('Webhookペイロード', { payload });

    await fetch(this.webhookUrl, payload);

    logger.info('Webhookへの通知送信に成功しました');
  }
}
