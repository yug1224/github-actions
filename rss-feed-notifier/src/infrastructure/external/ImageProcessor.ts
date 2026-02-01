/**
 * 画像プロセッサー
 *
 * 画像の取得、リサイズ、最適化機能を提供
 */

import {
  ImageMagick,
  IMagickImage,
  initialize,
  MagickFormat,
} from 'https://deno.land/x/imagemagick_deno@0.0.31/mod.ts';
import { logger } from '../../utils/logger.ts';
import { retry } from '../../utils/retry.ts';
import { ImageProcessError, NetworkError } from '../../utils/errors.ts';
import { FILE_PATHS, IMAGE_CONFIG, RETRY_CONFIG } from '../../config/constants.ts';

/**
 * 画像プロセッサー
 */
export class ImageProcessor {
  /**
   * 画像を取得する（リトライ付き）
   *
   * @param imageUrl - 画像URL
   * @returns 画像バイナリデータ
   * @throws {NetworkError} ネットワークエラーの場合
   */
  async fetchImage(imageUrl: string): Promise<ArrayBuffer> {
    return await retry(
      async () => {
        const response = await fetch(imageUrl);
        const contentType = response.headers.get('content-type') || '';

        if (!response.ok || !contentType.includes('image')) {
          throw new NetworkError(imageUrl, response.status);
        }

        logger.info('画像の取得に成功しました', { imageUrl });
        return await response.arrayBuffer();
      },
      {
        maxRetries: RETRY_CONFIG.IMAGE_FETCH_MAX_RETRIES,
        onRetry: (error, attempt) => {
          logger.warn('画像取得をリトライします', { imageUrl, attempt, error });
        },
      },
    );
  }

  /**
   * 画像をリサイズする
   *
   * @param imageBuffer - 画像バイナリデータ
   * @param timestamp - タイムスタンプ（ファイル名に使用）
   * @returns リサイズされた画像データとMIMEタイプ
   * @throws {ImageProcessError} 画像処理エラーの場合
   */
  async resizeImage(
    imageBuffer: ArrayBuffer,
    timestamp: number,
  ): Promise<{ data: Uint8Array; mimeType: string }> {
    await initialize();

    const result = await this.resizeWithQualityAdjustment(
      imageBuffer,
      timestamp,
      0,
    );

    if (!result) {
      throw new ImageProcessError('画像のリサイズに失敗しました', { timestamp });
    }

    return result;
  }

  /**
   * 品質を調整しながら画像をリサイズする（再帰的）
   *
   * @param imageBuffer - 画像バイナリデータ
   * @param timestamp - タイムスタンプ
   * @param retryCount - リトライ回数
   * @returns リサイズされた画像データとMIMEタイプ
   */
  private async resizeWithQualityAdjustment(
    imageBuffer: ArrayBuffer,
    timestamp: number,
    retryCount: number,
  ): Promise<{ data: Uint8Array; mimeType: string } | null> {
    const quality = 100 - (retryCount * 2);

    logger.info('画像をリサイズしています', {
      timestamp,
      quality,
      retryCount,
    });

    const resizedImage = await ImageMagick.read(
      new Uint8Array(imageBuffer),
      (img: IMagickImage) => {
        img.resize(IMAGE_CONFIG.MAX_WIDTH, IMAGE_CONFIG.MAX_HEIGHT);
        img.quality = quality;

        // img.write()のコールバックで直接データを取得
        let imageData: Uint8Array | null = null;
        img.write(
          MagickFormat.Avif,
          (data: Uint8Array) => {
            // データのコピーを作成（コールバック外で使用するため）
            imageData = new Uint8Array(data);
          },
        );

        // デバッグ用にファイルにも保存
        const outputPath = `${FILE_PATHS.TEMP_DIR}${timestamp}.${IMAGE_CONFIG.FORMAT}`;
        if (imageData) {
          Deno.writeFileSync(outputPath, imageData);
        }

        return imageData!;
      },
    );

    logger.info('画像のリサイズが完了しました', {
      byteLength: resizedImage.byteLength,
      maxByteLength: IMAGE_CONFIG.MAX_BYTE_LENGTH,
    });

    // サイズチェック
    if (resizedImage.byteLength > IMAGE_CONFIG.MAX_BYTE_LENGTH) {
      logger.warn('画像サイズが制限を超えています。品質を下げて再試行します', {
        byteLength: resizedImage.byteLength,
        retryCount,
      });

      return await this.resizeWithQualityAdjustment(
        imageBuffer,
        timestamp,
        retryCount + 1,
      );
    }

    return {
      data: resizedImage,
      mimeType: IMAGE_CONFIG.MIME_TYPE,
    };
  }
}
