import { parseFeed, type FeedEntry } from 'jsr:@mikaelporttila/rss';
import { MAX_FEED_ITEMS, PATTERNS } from './config/constants.ts';

const getLastExecutionTime = async (): Promise<string> => {
  try {
    const timestamp = await Deno.readTextFile('.timestamp');
    console.log('Last execution time:', timestamp.trim());
    return timestamp.trim();
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.log('No timestamp file found, using default value (0)');
      return '0';
    }
    throw error;
  }
};

export default async (rssUrl: string): Promise<FeedEntry[]> => {
  const lastExecutionTime = await getLastExecutionTime();

  const response = await fetch(rssUrl);
  const xml = await response.text();
  const feed = await parseFeed(xml);

  // 最終実行時間以降かつdescriptionがある記事を抽出
  const foundList = feed.entries.reverse().filter((item) => {
    return (
      item.published &&
      new Date(Number(lastExecutionTime)) < new Date(item.published) &&
      PATTERNS.STARRED_FILTER.test(item.title?.value || '')
    );
  });
  // foundListの上限件数までを返す
  return foundList.slice(0, MAX_FEED_ITEMS);
};
