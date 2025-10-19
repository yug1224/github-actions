import { logger } from '../../utils/logger.ts';

export default async (text: string, webhookUrl?: string): Promise<void> => {
  if (!webhookUrl) {
    logger.info('WEBHOOK_URL is not defined, skipping webhook post');
    return;
  }

  try {
    const postObj = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value1: text }),
    };

    logger.debug('Posting to webhook', { webhookUrl });
    await fetch(webhookUrl, postObj);
    logger.info('Successfully posted to webhook');
  } catch (error) {
    logger.error('Failed to post to webhook', error, { webhookUrl });
    throw error;
  }
};
