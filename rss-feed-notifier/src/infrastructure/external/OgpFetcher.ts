/**
 * OGP（Open Graph Protocol）フェッチャー
 *
 * WebページからOGPメタデータを取得する機能を提供
 */

import { DOMParser } from 'jsr:@b-fuze/deno-dom';
import ogs from 'npm:open-graph-scraper';
import { extractText } from 'npm:unpdf';
import { logger } from '../../utils/logger.ts';
import { USER_AGENT } from '../../config/constants.ts';

/**
 * OGPデータ（外部ライブラリの型）
 */
export interface RawOgpData {
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: Array<{ url: string }>;
}

/**
 * OGPフェッチャー
 */
export class OgpFetcher {
  /**
   * URLからOGPデータを取得する
   *
   * @param url - 取得対象のURL
   * @returns OGPデータ（取得失敗時は空オブジェクト）
   */
  async fetch(url: string): Promise<RawOgpData> {
    try {
      logger.info('OGPデータを取得しています', { url });

      const response = await fetch(url, {
        headers: { 'user-agent': USER_AGENT.OGP_FETCH },
      });

      if (!response.ok) {
        logger.warn('OGPデータの取得に失敗しました', { url, status: response.status });
        return {};
      }

      const arrayBuffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || '';

      // PDFの場合は特別処理
      if (contentType.includes('pdf')) {
        return await this.extractPdfTitle(arrayBuffer);
      }

      // HTMLの場合はOGPをパース
      return await this.parseHtmlOgp(arrayBuffer);
    } catch (error) {
      logger.error('OGPデータの取得中にエラーが発生しました', error, { url });
      return {};
    }
  }

  /**
   * PDFからタイトルを抽出する
   *
   * @param arrayBuffer - PDFのバイナリデータ
   * @returns OGPデータ
   */
  private async extractPdfTitle(arrayBuffer: ArrayBuffer): Promise<RawOgpData> {
    try {
      const text = (await extractText(arrayBuffer)).text[0]?.replace(/\n/g, '') || '';
      logger.info('PDFからタイトルを抽出しました', { title: text });
      return { ogTitle: text };
    } catch (error) {
      logger.error('PDFタイトルの抽出に失敗しました', error);
      return {};
    }
  }

  /**
   * HTMLからOGPデータをパースする
   *
   * @param arrayBuffer - HTMLのバイナリデータ
   * @returns OGPデータ
   */
  private async parseHtmlOgp(arrayBuffer: ArrayBuffer): Promise<RawOgpData> {
    try {
      // 文字コードを検出してデコード
      const html = this.decodeHtml(arrayBuffer);
      const { result } = await ogs({ html });

      logger.info('OGPデータの取得に成功しました', {
        hasTitle: !!result.ogTitle,
        hasDescription: !!result.ogDescription,
        hasImage: !!result.ogImage,
      });

      return result as RawOgpData;
    } catch (error) {
      logger.error('OGPのパースに失敗しました', error);
      return {};
    }
  }

  /**
   * HTMLをデコードする（文字コード自動判定）
   *
   * @param arrayBuffer - HTMLのバイナリデータ
   * @returns デコードされたHTML文字列
   */
  private decodeHtml(arrayBuffer: ArrayBuffer): string {
    // まずUTF-8でデコードしてみる
    let html = new TextDecoder('utf-8').decode(arrayBuffer);
    const doc = new DOMParser().parseFromString(html, 'text/html');

    if (!doc) {
      return html;
    }

    // meta タグから文字コードを検出
    const charset = this.detectCharset(doc);

    // UTF-8以外の場合は再デコード
    if (charset && charset.toLowerCase() !== 'utf-8') {
      try {
        html = new TextDecoder(charset).decode(arrayBuffer);
        logger.debug('HTMLを再デコードしました', { charset });
      } catch (_error) {
        logger.warn('文字コードでのデコードに失敗しました', { charset });
      }
    }

    return html;
  }

  /**
   * HTMLから文字コードを検出する
   *
   * @param doc - DOMドキュメント
   * @returns 文字コード
   */
  private detectCharset(doc: ReturnType<DOMParser['parseFromString']>): string | null {
    if (!doc?.documentElement) return null;

    // content-type の charset
    const contentType = doc.documentElement
      .querySelector('meta[http-equiv="content-type"]')
      ?.attributes.getNamedItem('content')?.value;

    if (contentType) {
      const match = contentType.toLowerCase().match(/charset=(.*)/);
      if (match?.[1]) return match[1];
    }

    // charset 属性
    const charsetMeta = doc.documentElement
      .querySelector('meta[charset]')
      ?.attributes.getNamedItem('charset')?.value;

    return charsetMeta?.toLowerCase() || null;
  }
}
