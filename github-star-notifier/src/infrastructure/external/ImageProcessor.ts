import {
  ImageMagick,
  type IMagickImage,
  initialize,
  MagickFormat,
} from 'https://deno.land/x/imagemagick_deno@0.0.31/mod.ts';
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
        const resizedImage = await ImageMagick.read(new Uint8Array(buffer), async (img: IMagickImage) => {
          img.resize(IMAGE_CONFIG.MAX_WIDTH, IMAGE_CONFIG.MAX_HEIGHT);
          img.quality = 100 - (retryCount * 2);

          await img.write(MagickFormat.Avif, async (data: Uint8Array) => {
            await Deno.writeFile(tempFilePath, data);
            return;
          });
          const resized = await Deno.readFile(tempFilePath);
          return resized;
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
