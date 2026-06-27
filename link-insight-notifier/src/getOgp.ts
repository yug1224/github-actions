import { JSDOM } from 'jsdom';
import ogs from 'open-graph-scraper';
import { extractText } from 'unpdf';

const parseHtml = (html: string) => new JSDOM(html, { contentType: 'text/html' }).window.document;

export default async (url: string) => {
  try {
    const response = await fetch(url, {
      headers: { 'user-agent': 'Twitterbot' },
    });

    // OGP取得のリクエストに失敗した場合は空オブジェクトを返す
    if (!response.ok) {
      console.log('Failed getOgp');
      return {};
    }

    const arrayBuffer = await response.arrayBuffer();

    // content-typeがpdfの場合は最初の文字列（おそらくタイトル）を抽出して返す
    if (response.headers.get('content-type')?.includes('pdf')) {
      const text = (await extractText(arrayBuffer)).text[0].replace(/\n/g, '');
      return {
        ogTitle: text,
      };
    }

    let html = new TextDecoder().decode(arrayBuffer);
    let doc = parseHtml(html);

    // 文字コードがutf-8以外の場合はデコードし直す
    const charset =
      ((doc.documentElement.querySelector('meta[http-equiv="content-type"]')?.getAttribute('content') || '')
        .toLowerCase()
        .match(/charset=(.*)/) || '')[1] ||
      (doc.documentElement.querySelector('meta[charset]')?.getAttribute('charset') || '').toLowerCase() ||
      'utf-8';

    if (charset !== 'utf-8') {
      html = new TextDecoder(charset).decode(arrayBuffer);
      doc = parseHtml(html);
    }

    const { result } = await ogs({ html });
    console.log('result', JSON.stringify(result, null, 2));
    console.log('Success getOgp');
    return result;
  } catch (e) {
    console.error(e);
    console.log('Failed getOgp');
    return {};
  }
};
