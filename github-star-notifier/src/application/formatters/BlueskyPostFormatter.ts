import AtprotoAPI from 'npm:@atproto/api';
import type { BlueskyFormatterParams, BlueskyPostContent } from '../../types/index.ts';
import { logger } from '../../utils/logger.ts';
const { RichText } = AtprotoAPI;

export default async ({ agent, item }: BlueskyFormatterParams): Promise<BlueskyPostContent> => {
  const title: string = (item.title?.value || '').trim();
  const link = item.links[0].href || '';
  const summary = item.summary;

  // Bluesky用のテキストを作成
  const richText = await (async () => {
    let text = `${title}\n${link}`;

    if (summary) {
      text = `${summary}\n\n${text}`;
    }

    const rt = new RichText({ text });
    await rt.detectFacets(agent);
    return rt;
  })();

  logger.debug('Formatted Bluesky post', { title, link });
  return { richText };
};
