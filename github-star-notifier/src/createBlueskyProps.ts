import AtprotoAPI from 'npm:@atproto/api';
import type { BlueskyProps, CreateBlueskyPropsParams } from './types/index.ts';
const { RichText } = AtprotoAPI;

export default async ({ agent, item }: CreateBlueskyPropsParams): Promise<BlueskyProps> => {
  const title: string = (item.title?.value || '').trim();
  const link = item.links[0].href || '';
  const summary = item.summary;

  // Bluesky用のテキストを作成
  const bskyText = await (async () => {
    let text = `${title}\n${link}`;

    if (summary) {
      text = `${summary}\n\n${text}`;
    }

    const rt = new RichText({ text });
    await rt.detectFacets(agent);
    return rt;
  })();

  console.log('Success createBlueskyProps');
  return { bskyText };
};
