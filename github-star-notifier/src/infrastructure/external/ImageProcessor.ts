import { ImageMagick, type IMagickImage, initialize, MagickFormat } from 'imagemagick';
import type { ProcessedImageResult } from '../../types/index.ts';
import { IMAGE_CONFIG, RETRY_CONFIG } from '../../config/constants.ts';
import { retry } from '../../utils/retry.ts';
import { logger } from '../../utils/logger.ts';

export default async (url: string, timestamp: number): Promise<ProcessedImageResult> => {
  try {
    // 画像取得処理をリトライ機能付きで実行
    const response = await retry(
      async () => {
        const res = await fetch(url);
        const contentType = res.headers.get('content-type') || '';

        // 画像が取得できなかった場合はエラーをスロー
        if (!res.ok || !contentType?.includes('image')) {
          // レスポンスボディを消費してリソースリークを防ぐ
          await res.body?.cancel();
          throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);
        }
        return res;
      },
      {
        maxRetries: RETRY_CONFIG.IMAGE_FETCH_MAX_RETRIES,
        onRetry: (error, attempt) => {
          logger.warn('Retrying image fetch', { attempt, error: String(error), url });
        },
      },
    );

    const buffer = await response.arrayBuffer();

    const resizeRetry = async ({
      buffer,
      retryCount = 0,
    }: {
      buffer: ArrayBuffer;
      retryCount?: number;
    }): Promise<ProcessedImageResult> => {
      await initialize();

      const mimeType = IMAGE_CONFIG.MIME_TYPE;
      const tempFilePath = `${timestamp}.avif`;

      try {
        const resizedImage = await ImageMagick.read(new Uint8Array(buffer), (img: IMagickImage) => {
          img.resize(IMAGE_CONFIG.MAX_WIDTH, IMAGE_CONFIG.MAX_HEIGHT);
          img.quality = 100 - (retryCount * 2);

          // img.write()のコールバックで直接データを取得
          let imageData: Uint8Array | null = null;
          img.write(MagickFormat.Avif, (data: Uint8Array) => {
            // データのコピーを作成（コールバック外で使用するため）
            imageData = new Uint8Array(data);
          });

          // デバッグ用にファイルにも保存
          if (imageData) {
            Deno.writeFileSync(tempFilePath, imageData);
          }

          return imageData!;
        });

        logger.debug('Resized image', {
          byteLength: resizedImage.byteLength,
          quality: 100 - (retryCount * 2),
        });
        if (resizedImage && resizedImage.byteLength > IMAGE_CONFIG.MAX_BYTE_LENGTH) {
          // リトライ処理
          logger.debug('Image too large, retrying with lower quality', {
            retryCount: retryCount + 1,
          });
          return await resizeRetry({ buffer, retryCount: retryCount + 1 });
        }
        return { mimeType, resizedImage };
      } finally {
        // 一時ファイルを確実に削除
        try {
          await Deno.remove(tempFilePath);
        } catch {
          // ファイルが存在しない場合は無視
        }
      }
    };
    const { mimeType, resizedImage } = await resizeRetry({ buffer });

    logger.info('Successfully resized image', { url });
    return {
      mimeType,
      resizedImage,
    };
  } catch (e) {
    logger.error('Failed to resize image', e, { url });
    return {};
  }
};
