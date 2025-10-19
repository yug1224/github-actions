import { abortable } from 'jsr:@std/async';
import AtprotoAPI from 'npm:@atproto/api';
import type { PublishToBlueskyParams, UploadBlobResult } from '../../types/index.ts';
import { RETRY_CONFIG } from '../../config/constants.ts';
import { retry } from '../../utils/retry.ts';
import { logger } from '../../utils/logger.ts';

export default async ({
  agent,
  richText,
  title,
  link,
  mimeType,
  image,
}: PublishToBlueskyParams): Promise<void> => {
  const thumb = await (async (): Promise<UploadBlobResult | undefined> => {
    if (!(image instanceof Uint8Array && typeof mimeType === 'string')) return;
    logger.debug('Uploading image', {
      imageByteLength: image.byteLength,
      encoding: mimeType,
    });

    try {
      return await retry(
        async () => {
          const c = new AbortController();
          // タイムアウト設定
          const timeoutId = setTimeout(() => {
            logger.warn('Image upload timeout', {
              timeout: RETRY_CONFIG.IMAGE_UPLOAD_TIMEOUT_MS,
            });
            c.abort();
          }, RETRY_CONFIG.IMAGE_UPLOAD_TIMEOUT_MS);

          try {
            // 画像をアップロード
            const uploadedImage = await abortable(
              agent.uploadBlob(image, {
                encoding: mimeType,
              }),
              c.signal,
            );
            logger.info('Successfully uploaded image', {
              size: uploadedImage.data.blob.size,
            });

            // 投稿オブジェクトに画像を追加
            return {
              $type: 'blob' as const,
              ref: {
                $link: uploadedImage.data.blob.ref.toString(),
              },
              mimeType: uploadedImage.data.blob.mimeType,
              size: uploadedImage.data.blob.size,
            };
          } finally {
            clearTimeout(timeoutId);
          }
        },
        {
          maxRetries: RETRY_CONFIG.IMAGE_UPLOAD_MAX_RETRIES,
          onRetry: (error, attempt) => {
            logger.warn('Retrying image upload', { attempt, error: String(error) });
          },
        },
      );
    } catch (error) {
      logger.error('Failed to upload image after retries', error);
      return undefined;
    }
  })();

  const postObj:
    & Partial<AtprotoAPI.AppBskyFeedPost.Record>
    & Omit<AtprotoAPI.AppBskyFeedPost.Record, 'createdAt'> = {
      $type: 'app.bsky.feed.post',
      text: richText.text,
      facets: richText.facets,
      embed: thumb
        ? {
          $type: 'app.bsky.embed.external',
          external: {
            uri: link,
            title,
            description: '',
            thumb: thumb as unknown as AtprotoAPI.AppBskyEmbedExternal.External['thumb'],
          },
        }
        : {
          $type: 'app.bsky.embed.external',
          external: {
            uri: link,
            title,
            description: '',
          },
        },
      langs: ['ja'],
    };

  logger.debug('Posting to Bluesky', { link, title });
  await agent.post(postObj);
  logger.info('Successfully posted to Bluesky', { link });
};
