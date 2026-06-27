import { AtpAgent, RichText } from '@atproto/api';

export default async (agent: AtpAgent, link: string, summary: string) => {
  const rt = new RichText({ text: `${summary}\n\n${link}` });
  await rt.detectFacets(agent);

  console.log('Success createBlueskyProps');
  return { bskyText: rt };
};
