import 'jsr:@std/dotenv/load';
import * as path from 'jsr:@std/path';
import AtprotoAPI from 'npm:@atproto/api';
import createBlueskyProps from './src/createBlueskyProps.ts';
import createPDF from './src/createPDF.ts';
import createPDFSummary from './src/createPDFSummary.ts';
import createSummary from './src/createSummary.ts';
import createYouTubeSummary from './src/createYouTubeSummary.ts';
import extractReadableContent from './src/extractReadableContent.ts';
import getOgp from './src/getOgp.ts';
import postBluesky from './src/postBluesky.ts';
import postWebhook from './src/postWebhook.ts';
import resizeImage from './src/resizeImage.ts';

interface Ogp {
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: { url: string }[];
}

try {
  const timestamp = new Date().getTime();

  // リンクを取得
  const LINK = (Deno.env.get('LINK') || '').trim();
  console.log(LINK);

  // 対象がなかったら終了
  if (!LINK.length) {
    console.log('not found link');
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

  // OGP情報を取得
  let og: Ogp = {};
  if (LINK.endsWith('.pdf')) {
    // PDFの場合はファイル名をタイトルとする
    og = { ogTitle: path.basename(LINK) };
  } else {
    og = await getOgp(LINK);
  }

  // 要約を生成
  let summary = '';
  if (LINK.startsWith('https://www.youtube.com')) {
    summary = await createYouTubeSummary(LINK);
  } else if (
    LINK.endsWith('.pdf') ||
    [
      'https://speakerdeck.com',
      'https://www.docswell.com',
    ].some((url) => LINK.startsWith(url))
  ) {
    const pdfPath = `${timestamp}.pdf`;
    await createPDF(LINK, pdfPath);

    let fileInfo;
    try {
      fileInfo = await Deno.stat(pdfPath);
    } catch {
      console.log('file not found');
    }
    // PDFファイルサイズが40MB未満の場合のみ要約を作成
    if (fileInfo && fileInfo.size < 40 * 1024 * 1024) {
      summary = await createPDFSummary(pdfPath);
    }
  } else {
    const articleText = await extractReadableContent(LINK);
    if (articleText && articleText.trim() !== '') {
      summary = await createSummary(articleText);
    }
  }

  // Summaryが空の場合は終了
  if (!summary || summary.trim() === '') {
    console.log('summary is empty');
    Deno.exit(0);
  }

  // Bluesky および X 投稿用のデータを準備
  const { bskyText } = await createBlueskyProps(
    agent,
    LINK,
    summary,
  );
  const xText = `${summary}\n${LINK}`;

  // OGP画像をリサイズ
  const { mimeType, resizedImage } = await (async () => {
    const ogImage = og.ogImage?.at(0);
    if (!ogImage) {
      console.log('ogp image not found');
      return {};
    }

    const { href, hostname } = new URL(ogImage.url, LINK);

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
    title: og.ogTitle || '',
    link: LINK,
    description: og.ogDescription || '',
    mimeType,
    image: resizedImage,
  });

  // Webhook を送信 (Xへの投稿)
  await postWebhook(xText);

  console.log('Success main');
  Deno.exit(0);
} catch (e: unknown) {
  // エラー情報を出力
  if (e instanceof Error) {
    console.error(e.stack);
  }
  console.error(JSON.stringify(e, null, 2));
  Deno.exit(1);
}
