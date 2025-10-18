import { abortable } from 'jsr:@std/async';
import AtprotoAPI from 'npm:@atproto/api';
import type { PostBlueskyParams, UploadBlobResult } from './types/index.ts';
import { RETRY_CONFIG } from './config/constants.ts';
import { retry } from './utils/retry.ts';

export default async ({
  agent,
  rt,
  title,
  link,
  description,
  mimeType,
  image,
}: PostBlueskyParams): Promise<void> => {
  const thumb = await (async (): Promise<UploadBlobResult | undefined> => {
    if (!(image instanceof Uint8Array && typeof mimeType === 'string')) return;
    console.log(
      JSON.stringify(
        { imageByteLength: image.byteLength, encoding: mimeType },
        null,
        2,
      ),
    );

    try {
      return await retry(
        async () => {
          const c = new AbortController();
          // タイムアウト設定
          const timeoutId = setTimeout(() => {
            console.log('Upload timeout');
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
            console.log('Success uploadImage');

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
            console.log(`Retry uploadImage (attempt ${attempt}):`, error);
          },
        },
      );
    } catch (error) {
      console.log('Failed uploadImage after retries:', error);
      return undefined;
    }
  })();

  const postObj:
    & Partial<AtprotoAPI.AppBskyFeedPost.Record>
    & Omit<AtprotoAPI.AppBskyFeedPost.Record, 'createdAt'> = {
      $type: 'app.bsky.feed.post',
      text: rt.text,
      facets: rt.facets,
      embed: {
        $type: 'app.bsky.embed.external',
        external: {
          uri: link,
          title,
          description: '', // 一時的にdescriptionは空にする
          thumb,
        },
      },
      langs: ['ja'],
    };

  console.log(JSON.stringify(postObj, null, 2));
  await agent.post(postObj);
  console.log('Success postBluesky');
};
