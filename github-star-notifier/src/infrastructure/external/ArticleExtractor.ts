/**
 * Webページから読みやすいテキストコンテンツを抽出するモジュール
 */

import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { logger } from '../../utils/logger.ts';

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
      logger.warn('Failed to fetch content', { url, status: response.status });
      return '';
    }
    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (article && article.textContent) {
      logger.debug('Successfully extracted content', {
        url,
        length: article.textContent.length,
      });
      return article.textContent.trim();
    } else {
      logger.warn('Readability could not parse content', { url });
      return '';
    }
  } catch (error) {
    logger.error('Error extracting content', error, { url });
    return '';
  }
};
