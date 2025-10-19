/**
 * Webhookメッセージフォーマッター
 *
 * Webhook通知用のテキストを生成
 */

import { FeedItem } from '../../domain/models/FeedItem.ts';
import { OpenGraphData } from '../../domain/models/OpenGraphData.ts';
import { TEXT_LIMITS } from '../../config/constants.ts';
import { logger } from '../../utils/logger.ts';

/**
 * 文字列の書記素クラスタ数をカウントする
 */
function countGraphemes(text: string): number {
  return [...text].length;
}

/**
 * 文字列を書記素クラスタ単位で分割する
 */
function splitGraphemes(text: string): string[] {
  return [...text];
}

/**
 * Webhookメッセージフォーマッター
 */
export class WebhookMessageFormatter {
  /**
   * Webhook通知用のテキストを作成する
   *
   * @param feedItem - フィードアイテム
   * @param ogpData - OGPデータ
   * @returns フォーマットされたテキスト
   */
  formatMessage(
    feedItem: FeedItem,
    ogpData: OpenGraphData,
  ): string {
    const url = feedItem.getUrl().toString();
    const title = ogpData.getTitle() || feedItem.getTitle() || '';

    if (!title) {
      logger.debug('タイトルがないため、URLのみを返します', { url });
      return url;
    }

    const formattedTitle = this.formatTitle(title);
    const message = `${formattedTitle}\n${url}`;

    logger.debug('Webhookメッセージを作成しました', {
      title: formattedTitle,
      url,
    });

    return message;
  }

  /**
   * タイトルをフォーマットする
   *
   * @param title - タイトル
   * @returns フォーマットされたタイトル
   */
  private formatTitle(title: string): string {
    const ellipsis = '...';
    const count = countGraphemes(title);

    if (count > TEXT_LIMITS.TITLE_MAX_LENGTH) {
      const truncated = splitGraphemes(title)
        .slice(0, TEXT_LIMITS.TITLE_ELLIPSIS_LENGTH)
        .join('');
      return truncated + ellipsis;
    }

    return title;
  }
}
