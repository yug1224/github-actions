/**
 * IOpenGraphRepository
 *
 * Open Graph Protocol データの取得を抽象化するリポジトリインターフェース
 */

import { OpenGraphData } from '../models/OpenGraphData.ts';
import { Url } from '../models/Url.ts';

/**
 * Open Graphリポジトリインターフェース
 */
export interface IOpenGraphRepository {
  /**
   * URLからOGPデータを取得する
   *
   * @param url - 取得対象のURL
   * @returns OGPデータ（取得失敗時は空のデータ）
   */
  fetch(url: Url): Promise<OpenGraphData>;
}
