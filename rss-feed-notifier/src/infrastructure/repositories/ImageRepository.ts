/**
 * ImageRepository実装
 *
 * 画像の取得とリサイズを管理
 */

import { IImageRepository, ImageData } from '../../domain/repositories/IImageRepository.ts';
import { Url } from '../../domain/models/Url.ts';
import { ImageProcessor } from '../external/ImageProcessor.ts';
import { logger } from '../../utils/logger.ts';

/**
 * 画像リポジトリ実装
 */
export class ImageRepository implements IImageRepository {
  constructor(private readonly imageProcessor: ImageProcessor) {}

  /**
   * 画像を取得してリサイズする
   */
  async fetchAndResize(
    imageUrl: Url,
    timestamp: number,
  ): Promise<ImageData | null> {
    try {
      logger.info('画像を取得してリサイズします', {
        imageUrl: imageUrl.toString(),
        timestamp,
      });

      // プライベートIPアドレスの場合はスキップ
      if (imageUrl.isPrivateIp()) {
        logger.warn('プライベートIPアドレスのため画像取得をスキップします', {
          hostname: imageUrl.getHostname(),
        });
        return null;
      }

      // 画像を取得
      const imageBuffer = await this.imageProcessor.fetchImage(
        imageUrl.toString(),
      );

      // 画像をリサイズ
      const { data, mimeType } = await this.imageProcessor.resizeImage(
        imageBuffer,
        timestamp,
      );

      logger.info('画像の取得とリサイズに成功しました', {
        byteLength: data.byteLength,
        mimeType,
      });

      return { data, mimeType };
    } catch (error) {
      logger.error('画像の取得またはリサイズに失敗しました', error, {
        imageUrl: imageUrl.toString(),
      });
      return null;
    }
  }
}
