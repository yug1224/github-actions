/**
 * Open Graph Protocol (OGP) データを取得するモジュール
 */

import ogs from 'npm:open-graph-scraper';
import { OpenGraphData, Url } from '../../domain/models/index.ts';
import { USER_AGENT } from '../../config/constants.ts';
import { logger } from '../../utils/logger.ts';

/**
 * 指定されたURLからOGPデータを取得する
 *
 * @param url - OGPデータを取得するURL（Url Value Object）
 * @returns Open Graph データ。取得に失敗した場合は空のOpenGraphData
 */
export default async (url: Url): Promise<OpenGraphData> => {
  const urlString = url.toString();

  try {
    const response = await fetch(urlString, {
      headers: { 'user-agent': USER_AGENT.OGP_FETCH },
    });

    // OGP取得のリクエストに失敗した場合は空のOpenGraphDataを返す
    if (!response.ok) {
      logger.warn('Failed to fetch OGP', { url: urlString, status: response.status });
      return OpenGraphData.empty();
    }

    const html = await response.text();
    const { result } = await ogs({ html });
    logger.debug('Successfully fetched Open Graph data', { url: urlString, result });

    // 既存のOGPデータからValue Objectを生成
    return OpenGraphData.fromRaw({
      ogTitle: result.ogTitle,
      ogDescription: result.ogDescription,
      ogImage: result.ogImage,
      ogUrl: result.ogUrl,
    });
  } catch (error) {
    logger.error('Error fetching OGP', error, { url: urlString });
    return OpenGraphData.empty();
  }
};
