/**
 * Open Graph Protocol (OGP) データを取得するモジュール
 */

import ogs from 'npm:open-graph-scraper';
import type { OgpResult } from './types/index.ts';
import { USER_AGENT } from './config/constants.ts';

/**
 * 指定されたURLからOGPデータを取得する
 *
 * @param url - OGPデータを取得するURL
 * @returns OGP結果オブジェクト。取得に失敗した場合は空オブジェクト
 */
export default async (url: string): Promise<OgpResult> => {
  const response = await fetch(url, {
    headers: { 'user-agent': USER_AGENT.OGP_FETCH },
  });

  // OGP取得のリクエストに失敗した場合は空オブジェクトを返す
  if (!response.ok) {
    console.log('Failed getOgp');
    return {};
  }

  const html = await response.text();
  const { result } = await ogs({ html });
  console.log(JSON.stringify(result, null, 2));
  console.log('Success getOgp');
  return result as OgpResult;
};
