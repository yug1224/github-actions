import sharp from 'sharp';
import type { ProcessedImageResult } from '../../types/index.ts';
import { IMAGE_CONFIG, RETRY_CONFIG } from '../../config/constants.ts';
import { retry } from '../../utils/retry.ts';
import { logger } from '../../utils/logger.ts';

export default async (url: string, _timestamp: number): Promise<ProcessedImageResult> => {
  try {
    const response = await retry(
      async () => {
        const res = await fetch(url);
        const contentType = res.headers.get('content-type') || '';

        if (!res.ok || !contentType?.includes('image')) {
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
      const mimeType = IMAGE_CONFIG.MIME_TYPE;
      const quality = 100 - retryCount * 2;

      const resizedBuffer = await sharp(Buffer.from(buffer))
        .resize(IMAGE_CONFIG.MAX_WIDTH, IMAGE_CONFIG.MAX_HEIGHT, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .avif({ quality })
        .toBuffer();

      const resizedImage = new Uint8Array(resizedBuffer);

      logger.debug('Resized image', {
        byteLength: resizedImage.byteLength,
        quality,
      });

      if (resizedImage.byteLength > IMAGE_CONFIG.MAX_BYTE_LENGTH) {
        logger.debug('Image too large, retrying with lower quality', {
          retryCount: retryCount + 1,
        });
        return await resizeRetry({ buffer, retryCount: retryCount + 1 });
      }

      return { mimeType, resizedImage };
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
