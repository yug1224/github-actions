import 'jsr:@std/dotenv/load';
import AtprotoAPI from 'npm:@atproto/api';
import createBlueskyProps from './src/createBlueskyProps.ts';
import createSummary from './src/createSummary.ts';
import createXProps from './src/createXProps.ts';
import getItemList from './src/getItemList.ts';
import extractReadableContent from './src/extractReadableContent.ts';
import getOgp from './src/getOgp.ts';
import postBluesky from './src/postBluesky.ts';
import postWebhook from './src/postWebhook.ts';
import resizeImage from './src/resizeImage.ts';

try {
  let cnt = 0;
  // rss feedから記事リストを取得
  const itemList = await getItemList();
  console.log(JSON.stringify(itemList, null, 2));

  // 対象がなかったら終了
  if (!itemList.length) {
    console.log('not found feed item');
    Deno.exit(0);
  }

  // Blueskyにログイン
  const { BskyAgent } = AtprotoAPI;
  const service = 'https://bsky.social';
  const agent = new BskyAgent({ service });
  const identifier = Deno.env.get('BLUESKY_IDENTIFIER') || '';
  const password = Deno.env.get('BLUESKY_PASSWORD') || '';
  await agent.login({ identifier, password });

  // 取得した記事リストをループ処理
  for await (const item of itemList) {
    // 投稿回数をカウントし、3件以上投稿したら終了
    cnt++;
    if (cnt > 3) {
      console.log('post count over');
      break;
    }

    // 最終実行時間を更新
    const timestamp = item.published ? new Date(item.published).getTime() : new Date().getTime();
    await Deno.writeTextFile('.timestamp', timestamp.toString());

    const link = item.links[0].href ? new URL(item.links[0].href, 'https://github.com').href : '';

    // URLからOGPの取得
    const og = await getOgp(link);

    // Readability.jsで記事本文を抽出
    const articleText = await extractReadableContent(link);

    let summary = ''; // summaryを初期化
    if (articleText && articleText.trim() !== '') {
      summary = await createSummary(articleText);
    }

    // 投稿記事のプロパティを作成
    const { bskyText } = await createBlueskyProps({
      agent,
      item: {
        ...item,
        summary, // 抽出された、または空のsummaryを使用
      },
    });
    const { xText } = await createXProps({
      item: {
        ...item,
        summary, // 抽出された、または空のsummaryを使用
      },
    });

    // 画像のリサイズ
    const { mimeType, resizedImage } = await (async () => {
      const ogImage = og.ogImage?.at(0);
      if (!ogImage) {
        console.log('ogp image not found');
        return {};
      }
      return await resizeImage(new URL(ogImage.url, link).href, timestamp);
    })();

    // Blueskyに投稿
    await postBluesky({
      agent,
      rt: bskyText,
      title: (og.ogTitle || '').trim(),
      link,
      description: (og.ogDescription || '').trim(),
      mimeType,
      image: resizedImage,
    });

    // IFTTTを使ってXに投稿
    await postWebhook(xText);
  }

  // 終了
  Deno.exit(0);
} catch (e) {
  // エラーが発生したらログを出力して終了
  if (e instanceof Error) {
    console.error(e.stack);
  }

  Deno.exit(1);
}
