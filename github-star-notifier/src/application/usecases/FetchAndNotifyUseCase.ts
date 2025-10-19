/**
 * Fetch And Notify Use Case
 *
 * フィードを取得し、SNSに投稿するユースケース。
 */

import type { AtpAgent } from 'npm:@atproto/api';
import type { FeedEntry } from 'jsr:@mikaelporttila/rss';
import type {
  IContentRepository,
  IFeedRepository,
  INotificationRepository,
  ISummaryService,
} from '../../domain/repositories/index.ts';
import { Url } from '../../domain/models/index.ts';
import type { FeedItem } from '../../types/index.ts';
import formatBlueskyPost from '../formatters/BlueskyPostFormatter.ts';
import formatWebhookMessage from '../formatters/WebhookMessageFormatter.ts';
import processImage from '../../infrastructure/external/ImageProcessor.ts';
import { logger } from '../../utils/logger.ts';

/**
 * フィード取得と通知のユースケース
 */
export class FetchAndNotifyUseCase {
  constructor(
    private readonly feedRepo: IFeedRepository,
    private readonly contentRepo: IContentRepository,
    private readonly summaryService: ISummaryService,
    private readonly notificationRepo: INotificationRepository,
  ) {}

  /**
   * フィードを取得して通知を実行する
   *
   * @param feedUrl - フィードのURL
   * @param agent - Blueskyエージェント
   * @param webhookUrl - Webhook URL
   * @param maxPostCount - 最大投稿数
   */
  async execute(
    feedUrl: string,
    agent: AtpAgent,
    webhookUrl: string | undefined,
    maxPostCount: number,
  ): Promise<void> {
    // フィードから記事リストを取得
    const itemList = await this.feedRepo.fetchLatestItems(feedUrl);
    logger.info('Found items', { count: itemList.length });

    if (itemList.length === 0) {
      logger.info('No feed items found');
      return;
    }

    // 取得した記事リストをループ処理
    let postCount = 0;
    for (const item of itemList) {
      // 投稿回数をカウントし、上限以上投稿したら終了
      postCount++;
      if (postCount > maxPostCount) {
        logger.info('Post count limit reached', { limit: maxPostCount });
        break;
      }

      await this.processItem(item, agent, webhookUrl);
    }

    logger.info('Processed items', { count: postCount });
  }

  /**
   * 個別のフィードアイテムを処理
   */
  private async processItem(
    item: FeedEntry,
    agent: AtpAgent,
    webhookUrl: string | undefined,
  ): Promise<void> {
    // URLの取得とバリデーション
    const linkUrl = this.getAbsoluteUrl(item);
    if (!linkUrl) {
      logger.warn('Invalid link, skipping item', { item });
      return;
    }

    const link = linkUrl.toString();

    // タイムスタンプ更新
    const timestamp = item.published ? new Date(item.published).getTime() : new Date().getTime();
    await this.feedRepo.saveLastFetchedTimestamp(timestamp);

    // OGP取得と記事本文抽出を並列実行
    const [openGraphData, summaryObj] = await Promise.all([
      this.contentRepo.fetchOpenGraphData(linkUrl),
      this.createArticleSummary(linkUrl),
    ]);

    // FeedItemの作成
    const feedItem: FeedItem = {
      ...item,
      summary: summaryObj?.toString() || '',
      links: [{ href: link }],
    };

    // Bluesky用とWebhook用のテキストを並列作成
    const { richText } = await formatBlueskyPost({ agent, item: feedItem });
    const { content: webhookMessage } = formatWebhookMessage({ item: feedItem });

    // 画像の処理
    const { mimeType, resizedImage } = await (async () => {
      const firstImage = openGraphData.getFirstImage();
      if (!firstImage) {
        logger.debug('OGP image not found');
        return {};
      }
      return await processImage(firstImage.url.toString(), timestamp);
    })();

    // Bluesky投稿とWebhook投稿を並列実行
    await Promise.all([
      this.notificationRepo.publishToBluesky({
        agent,
        richText,
        title: openGraphData.getTitle() || '',
        link,
        mimeType,
        image: resizedImage,
      }),
      this.notificationRepo.sendWebhookNotification(webhookMessage, webhookUrl),
    ]);

    logger.info('Successfully processed item', { link });
  }

  /**
   * フィードアイテムの絶対URLを取得
   */
  private getAbsoluteUrl(item: FeedEntry): Url | null {
    const href = item.links[0]?.href;
    if (!href) return null;

    try {
      return Url.fromRelative(href, 'https://github.com');
    } catch {
      logger.warn('Invalid URL in feed item', { href });
      return null;
    }
  }

  /**
   * 記事のサマリーを生成
   */
  private async createArticleSummary(linkUrl: Url) {
    const articleText = await this.contentRepo.extractArticleContent(linkUrl);
    if (!articleText || articleText.trim() === '') {
      return null;
    }
    return await this.summaryService.generateSummary(articleText, linkUrl);
  }
}
