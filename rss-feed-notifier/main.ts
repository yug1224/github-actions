import 'jsr:@std/dotenv/load';
import * as path from 'jsr:@std/path';
import AtprotoAPI from 'npm:@atproto/api';
import createBlueskyProps from './src/createBlueskyProps.ts';
import createXProps from './src/createXProps.ts';
import getItemList from './src/getItemList.ts';
import getOgp from './src/getOgp.ts';
import postBluesky from './src/postBluesky.ts';
import postWebhook from './src/postWebhook.ts';
import resizeImage from './src/resizeImage.ts';

// フィードアイテムのインターフェース
interface Item {
  links: { href?: string }[];
  published?: string;
  title?: { value?: string };
  description?: { value?: string };
  id: string;
}

/**
 * 各フィードアイテムを処理する関数
 * @param {AtprotoAPI.AtpAgent} agent - Bluesky エージェント
 * @param {Item} item - 処理するフィードアイテム
 * @param {number} timestamp - タイムスタンプ
 */
async function processItem(
  agent: AtprotoAPI.AtpAgent,
  item: Item,
  timestamp: number,
) {
  const href = item.links[0].href || '';

  // OGP情報を取得
  let og: { ogTitle?: string; ogDescription?: string; ogImage?: { url: string }[] } = {};
  if (href.endsWith('.pdf')) {
    // PDFの場合はファイル名をタイトルとする
    og = { ogTitle: path.basename(href) };
  } else {
    og = await getOgp(href);
  }

  // Bluesky および X 投稿用のデータを準備
  const tmpItem = {
    ...item,
    title: { value: og.ogTitle || item.title?.value || '' },
    description: {
      value: og.ogDescription || item.description?.value || '',
    },
  };
  const { bskyText, title, link, description } = await createBlueskyProps(
    agent,
    tmpItem as Item,
  );
  const { xText } = await createXProps(tmpItem as Item);

  // OGP画像をリサイズ
  const { mimeType, resizedImage } = await (async () => {
    const ogImage = og.ogImage?.at(0);
    if (!ogImage) {
      console.log('ogp image not found');
      return {};
    }

    const { href, hostname } = new URL(ogImage.url, link);

    // プライベートIPアドレスの場合は処理をスキップ
    if (/^(10|172\.16|192\.168)\./.test(hostname)) {
      console.log('private ip address');
      return {};
    }

    return await resizeImage(href, timestamp);
  })();

  // Bluesky に投稿
  await postBluesky({
    agent,
    rt: bskyText,
    title,
    link,
    description,
    mimeType,
    image: resizedImage,
  });

  // Webhook を送信 (Xへの投稿)
  await postWebhook(xText);
}

/**
 * メイン関数
 */
async function main() {
  let cnt = 0;
  let currentItem: Item | undefined;
  let itemList: Item[] | undefined;

  try {
    // フィードアイテムリストを取得
    itemList = await getItemList();

    console.log('itemList.length', itemList.length);
    console.log('itemList', JSON.stringify(itemList, null, 2));
    if (!itemList.length) {
      console.log('not found feed item');
      Deno.exit(0);
    }

    // 投稿対象の時間帯か確認 (UTC時間で1時から15時の間)
    const nowHour = new Date().getUTCHours();
    if (!(nowHour >= 1 && nowHour < 15)) {
      console.log(`${nowHour}:00 is not target time`);
      Deno.exit(0);
    }

    // Bluesky エージェントを初期化
    const { BskyAgent } = AtprotoAPI;
    const service = 'https://bsky.social';
    const agent = new BskyAgent({ service });
    const identifier = Deno.env.get('BLUESKY_IDENTIFIER') || '';
    const password = Deno.env.get('BLUESKY_PASSWORD') || '';
    await agent.login({ identifier, password });

    // 10分間のタイムアウトを設定
    setTimeout(() => {
      throw new Error('Timeout main');
    }, 1000 * 60 * 10);

    // 各アイテムを処理
    for await (const item of itemList) {
      cnt++;
      // 投稿数が3件を超えたら終了
      if (cnt > 3) {
        console.log('post count over');
        break;
      }

      currentItem = item;

      // タイムスタンプをファイルに書き込む
      const timestamp = item.published ? new Date(item.published).getTime() : new Date().getTime();
      await Deno.writeTextFile('.timestamp', timestamp.toString());
      await Deno.writeTextFile(
        '.itemList.json',
        JSON.stringify(itemList.slice(cnt)),
      );

      // アイテムを処理
      await processItem(agent, item, timestamp);
    }

    console.log('Success main');
    Deno.exit(0);
  } catch (e: unknown) {
    // エラーが発生した場合、処理中のアイテムと残りのアイテムリストをファイルに保存
    if (currentItem && itemList) {
      await Deno.writeTextFile(
        '.itemList.json',
        JSON.stringify([...itemList.slice(cnt), {
          ...currentItem,
          published: itemList?.at(-1)?.published || currentItem?.published,
        }]),
      );
    }

    // エラー情報を出力
    if (e instanceof Error) {
      console.error(e.stack);
    }
    console.error(JSON.stringify(e, null, 2));
    Deno.exit(1);
  }
}

// メイン関数を実行
main();
