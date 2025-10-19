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

    return OpenGraphData.fromRaw(rawOgp);
  }
}
