import 'jsr:@std/dotenv/load';
import AtprotoAPI from 'npm:@atproto/api';
import type { AtpAgent } from 'npm:@atproto/api';
import type { FeedEntry } from 'jsr:@mikaelporttila/rss';
import createBlueskyProps from './src/createBlueskyProps.ts';
import createSummary from './src/createSummary.ts';
import createXProps from './src/createXProps.ts';
import getItemList from './src/getItemList.ts';
import extractReadableContent from './src/extractReadableContent.ts';
import getOgp from './src/getOgp.ts';
import postBluesky from './src/postBluesky.ts';
import postWebhook from './src/postWebhook.ts';
import resizeImage from './src/resizeImage.ts';
import { validateAndGetEnv } from './src/config/env.ts';
import { BLUESKY_SERVICE_URL, MAX_POST_COUNT } from './src/config/constants.ts';
import type { FeedItem } from './src/types/index.ts';

/**
 * Blueskyエージェントの初期化とログイン
 */
async function initializeBlueskyAgent(identifier: string, password: string): Promise<AtpAgent> {
  const { BskyAgent } = AtprotoAPI;
  const agent = new BskyAgent({ service: BLUESKY_SERVICE_URL });
  await agent.login({ identifier, password });
  console.log('Successfully logged in to Bluesky');
  return agent;
}

/**
 * タイムスタンプファイルを更新
 */
async function updateTimestamp(timestamp: number): Promise<void> {
  await Deno.writeTextFile('data/.timestamp', timestamp.toString());
}

/**
 * フィードアイテムの絶対URLを取得
 */
function getAbsoluteUrl(item: FeedEntry): string {
  const href = item.links[0]?.href;
  if (!href) return '';
  return new URL(href, 'https://github.com').href;
}

/**
 * 記事のサマリーを生成
 */
async function generateSummary(link: string, apiKey: string, modelName: string): Promise<string> {
  const articleText = await extractReadableContent(link);
  if (!articleText || articleText.trim() === '') {
    return '';
  }
  return await createSummary(articleText, apiKey, modelName);
}

/**
 * 個別のフィードアイテムを処理
 */
async function processItem(
  agent: AtpAgent,
  item: FeedEntry,
  env: ReturnType<typeof validateAndGetEnv>,
): Promise<void> {
  const link = getAbsoluteUrl(item);
  if (!link) {
    console.log('Invalid link, skipping item');
    return;
  }

  // タイムスタンプ更新
  const timestamp = item.published ? new Date(item.published).getTime() : new Date().getTime();
  await updateTimestamp(timestamp);

  // OGP取得と記事本文抽出を並列実行
  const [og, summary] = await Promise.all([
    getOgp(link),
    generateSummary(link, env.GOOGLE_AI_API_KEY, env.GEMINI_MODEL),
  ]);

  // FeedItemの作成
  const feedItem: FeedItem = {
    ...item,
    summary,
    links: [{ href: link }],
  };

  // Bluesky用とX用のテキストを並列作成
  const [{ bskyText }, { xText }] = await Promise.all([
    createBlueskyProps({ agent, item: feedItem }),
    Promise.resolve(createXProps({ item: feedItem })),
  ]);

  // 画像のリサイズ
  const { mimeType, resizedImage } = await (async () => {
    const ogImage = og.ogImage?.at(0);
    if (!ogImage) {
      console.log('OGP image not found');
      return {};
    }
    return await resizeImage(new URL(ogImage.url, link).href, timestamp);
  })();

  // Bluesky投稿とWebhook投稿を並列実行
  await Promise.all([
    postBluesky({
      agent,
      rt: bskyText,
      title: (og.ogTitle || '').trim(),
      link,
      description: (og.ogDescription || '').trim(),
      mimeType,
      image: resizedImage,
    }),
    postWebhook(xText, env.WEBHOOK_URL),
  ]);

  console.log('Successfully processed item:', link);
}

/**
 * メイン処理
 */
async function main(): Promise<void> {
  // 環境変数の検証
  const env = validateAndGetEnv();

  // RSS feedから記事リストを取得
  const itemList = await getItemList(env.RSS_URL);
  console.log('Found items:', itemList.length);

  // 対象がなかったら終了
  if (itemList.length === 0) {
    console.log('No feed items found');
    return;
  }

  // Blueskyにログイン
  const agent = await initializeBlueskyAgent(env.BLUESKY_IDENTIFIER, env.BLUESKY_PASSWORD);

  // 取得した記事リストをループ処理
  let postCount = 0;
  for (const item of itemList) {
    // 投稿回数をカウントし、上限以上投稿したら終了
    postCount++;
    if (postCount > MAX_POST_COUNT) {
      console.log(`Post count limit reached (${MAX_POST_COUNT})`);
      break;
    }

    await processItem(agent, item, env);
  }

  console.log(`Processed ${postCount} items`);
}

// エントリーポイント
try {
  await main();
  Deno.exit(0);
} catch (e) {
  // エラーが発生したらログを出力して終了
  if (e instanceof Error) {
    console.error('Error occurred:', e.message);
    console.error(e.stack);
  } else {
    console.error('Unknown error:', e);
  }

  Deno.exit(1);
}
