import type { WebhookFormatterParams, WebhookMessage } from '../../types/index.ts';
import { logger } from '../../utils/logger.ts';

export default ({ item }: WebhookFormatterParams): WebhookMessage => {
  const title: string = (item.title?.value || '').trim();
  const link: string = item.links[0].href || '';
  const summary = item.summary;

  // Webhook用のメッセージを作成
  const content = (() => {
    return summary ? `${summary}\n\n${title}\n${link}` : `${title}\n${link}`;
  })();

  logger.debug('Formatted webhook message', { title, link });
  return { content };
};
