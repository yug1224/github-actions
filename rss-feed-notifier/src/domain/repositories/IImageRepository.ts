/**
 * IImageRepository
 *
 * 画像の取得とリサイズを抽象化するリポジトリインターフェース
 */

import { Url } from '../models/Url.ts';

/**
 * 画像データ
 */
export interface ImageData {
  data: Uint8Array;
  mimeType: string;
}

/**
 * 画像リポジトリインターフェース
 */
export interface IImageRepository {
  /**
   * 画像を取得してリサイズする
   *
   * @param imageUrl - 画像URL
   * @param timestamp - タイムスタンプ（ファイル名に使用）
   * @returns 画像データ（取得失敗時はnull）
   */
  fetchAndResize(
    imageUrl: Url,
    timestamp: number,
  ): Promise<ImageData | null>;
}
