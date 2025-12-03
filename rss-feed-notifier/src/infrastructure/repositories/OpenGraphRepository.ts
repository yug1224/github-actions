/**
 * OpenGraphRepository実装
 *
 * OGPデータの取得を管理
 */

import { IOpenGraphRepository } from '../../domain/repositories/IOpenGraphRepository.ts';
import { OpenGraphData } from '../../domain/models/OpenGraphData.ts';
import { Url } from '../../domain/models/Url.ts';
import { OgpFetcher } from '../external/OgpFetcher.ts';
import { logger } from '../../utils/logger.ts';
import * as path from 'jsr:@std/path';

/**
 * Open Graphリポジトリ実装
 */
export class OpenGraphRepository implements IOpenGraphRepository {
  constructor(private readonly ogpFetcher: OgpFetcher) {}

  /**
   * URLからOGPデータを取得する
   */
  async fetch(url: Url): Promise<OpenGraphData> {
    logger.info('OGPデータを取得しています', { url: url.toString() });

    // PDFファイルの場合は特別処理
    if (url.isPdf()) {
      const filename = path.basename(url.toString());
      logger.info('PDFファイルのため、ファイル名をタイトルとして使用します', {
        filename,
      });

      return OpenGraphData.create({ title: filename });
    }

    // 通常のWebページの場合はOGPを取得
    const rawOgp = await this.ogpFetcher.fetch(url.toString());

    if (!rawOgp || Object.keys(rawOgp).length === 0) {
      logger.warn('OGPデータが取得できませんでした', {
        url: url.toString(),
      });
      return OpenGraphData.empty();
    }

    // 画像URLが相対パスの場合、絶対URLに変換
    const normalizedOgp = this.normalizeImageUrl(rawOgp, url.toString());

    return OpenGraphData.fromRaw(normalizedOgp);
  }

  /**
   * OGP画像URLが相対パスの場合、絶対URLに変換する
   *
   * @param rawOgp - 取得したOGPデータ
   * @param baseUrl - ベースURL（元のページURL）
   * @returns 画像URLが正規化されたOGPデータ
   */
  private normalizeImageUrl(
    rawOgp: {
      ogTitle?: string;
      ogDescription?: string;
      ogImage?: Array<{ url: string }> | { url: string };
    },
    baseUrl: string,
  ): typeof rawOgp {
    if (!rawOgp.ogImage) {
      return rawOgp;
    }

    // 画像URLを取得
    const imageUrl = Array.isArray(rawOgp.ogImage) ? rawOgp.ogImage[0]?.url : rawOgp.ogImage.url;

    if (!imageUrl) {
      return rawOgp;
    }

    // 既に有効な絶対URLの場合はそのまま返す
    if (Url.isValid(imageUrl)) {
      return rawOgp;
    }

    // 相対URLを絶対URLに変換
    try {
      const absoluteUrl = Url.fromRelative(imageUrl, baseUrl);
      logger.info('相対URLを絶対URLに変換しました', {
        relativeUrl: imageUrl,
        absoluteUrl: absoluteUrl.toString(),
      });

      // 変換後のURLでOGPデータを更新
      if (Array.isArray(rawOgp.ogImage)) {
        return {
          ...rawOgp,
          ogImage: [{ url: absoluteUrl.toString() }],
        };
      }
      return {
        ...rawOgp,
        ogImage: { url: absoluteUrl.toString() },
      };
    } catch (error) {
      // 変換に失敗した場合は画像なしとして扱う
      logger.warn('相対URLの変換に失敗しました', {
        relativeUrl: imageUrl,
        baseUrl,
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        ...rawOgp,
        ogImage: undefined,
      };
    }
  }
}
