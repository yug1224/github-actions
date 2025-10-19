/**
 * Blueskyクライアント
 *
 * Bluesky APIへの投稿機能を提供
 */

import { abortable } from 'jsr:@std/async';
import { AtpAgent, type BlobRef, RichText } from 'npm:@atproto/api';
import type AtprotoAPI from 'npm:@atproto/api';
import { logger } from '../../utils/logger.ts';
import { retry } from '../../utils/retry.ts';
import { BLUESKY_LANGUAGE, RETRY_CONFIG } from '../../config/constants.ts';

/**
 * Bluesky投稿データ
 */
export interface BlueskyPostParams {
  richText: RichText;
  title: string;
  url: string;
  description: string;
  image?: {
    data: Uint8Array;
    mimeType: string;
  };
}

/**
 * Blueskyクライアント
 */
export class BlueskyClient {
  constructor(private readonly agent: AtpAgent) {}

  /**
   * 画像をアップロードする（リトライ付き）
   *
   * @param imageData - 画像データ
   * @param mimeType - MIMEタイプ
   * @returns アップロードされた画像のBlobRef
   * @throws {UploadError} アップロードエラーの場合
   */
  private async uploadImage(
    imageData: Uint8Array,
    mimeType: string,
  ): Promise<BlobRef> {
    return await retry(
      async () => {
        const controller = new AbortController();
        const timeoutMs = RETRY_CONFIG.IMAGE_UPLOAD_BASE_TIMEOUT_MS;

        const timer = setTimeout(() => {
          logger.warn('画像アップロードがタイムアウトしました', { timeoutMs });
          controller.abort();
        }, timeoutMs);

        try {
          const uploadedImage = await abortable(
            this.agent.uploadBlob(imageData, { encoding: mimeType }),
            controller.signal,
          );

          logger.info('画像のアップロードに成功しました', {
            byteLength: imageData.byteLength,
            mimeType,
          });

          clearTimeout(timer);
          return uploadedImage.data.blob;
        } catch (error) {
          clearTimeout(timer);
          throw error;
        }
      },
      {
        maxRetries: RETRY_CONFIG.IMAGE_UPLOAD_MAX_RETRIES,
        onRetry: (error, attempt) => {
          logger.warn('画像アップロードをリトライします', { attempt, error });
        },
      },
    );
  }

  /**
   * Blueskyに投稿する
   *
   * @param params - 投稿パラメータ
   */
  async post(params: BlueskyPostParams): Promise<void> {
    logger.info('Blueskyに投稿しています', {
      text: params.richText.text,
      url: params.url,
      hasImage: !!params.image,
    });

    // 画像をアップロード（存在する場合）
    const thumb: BlobRef | undefined = params.image
      ? await this.uploadImage(params.image.data, params.image.mimeType)
      : undefined;

    // 投稿オブジェクトを作成
    const postObj:
      & Partial<AtprotoAPI.AppBskyFeedPost.Record>
      & Omit<AtprotoAPI.AppBskyFeedPost.Record, 'createdAt'> = {
        $type: 'app.bsky.feed.post',
        text: params.richText.text,
        facets: params.richText.facets,
        embed: {
          $type: 'app.bsky.embed.external',
          external: {
            uri: params.url,
            title: params.title,
            description: '', // 一時的にdescriptionは空にする
            thumb,
          },
        },
        langs: [BLUESKY_LANGUAGE],
      };

    logger.debug('投稿オブジェクト', { postObj });

    await this.agent.post(postObj);

    logger.info('Blueskyへの投稿に成功しました');
  }
}
