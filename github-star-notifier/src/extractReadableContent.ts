/**
 * Webページから読みやすいテキストコンテンツを抽出するモジュール
 */

import { JSDOM } from 'npm:jsdom';
import { Readability } from 'npm:@mozilla/readability';

/**
 * 指定されたURLから記事の本文を抽出する
 *
 * Mozilla Readabilityを使用してWebページから
 * 読みやすいテキストコンテンツを抽出します。
 *
 * @param url - コンテンツを抽出するURL
 * @returns 抽出されたテキストコンテンツ。失敗した場合は空文字列
 */
export default async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
      return '';
    }
    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (article && article.textContent) {
      return article.textContent.trim();
    } else {
      console.warn(`Readability could not parse content from ${url}`);
      return '';
    }
  } catch (error) {
    console.error(`Error extracting content from ${url}:`, error);
    return '';
  }
};
