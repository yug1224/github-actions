/**
 * FetchAndNotifyUseCase
 *
 * RSSフィードを取得して通知するユースケース
 */

import { IFeedRepository } from '../../domain/repositories/IFeedRepository.ts';
import { INotificationRepository } from '../../domain/repositories/INotificationRepository.ts';
import { IOpenGraphRepository } from '../../domain/repositories/IOpenGraphRepository.ts';
import { IImageRepository, type ImageData } from '../../domain/repositories/IImageRepository.ts';
import { BlueskyPostFormatter } from '../formatters/BlueskyPostFormatter.ts';
import { WebhookMessageFormatter } from '../formatters/WebhookMessageFormatter.ts';
import { Url } from '../../domain/models/Url.ts';
import { FeedItem } from '../../domain/models/FeedItem.ts';
import { OpenGraphData } from '../../domain/models/OpenGraphData.ts';
import { Timestamp } from '../../domain/models/Timestamp.ts';
import { logger } from '../../utils/logger.ts';
import { MAX_POST_COUNT } from '../../config/constants.ts';

/**
 * フィード取得と通知のユースケース
 */
export class FetchAndNotifyUseCase {
  constructor(
    private readonly feedRepository: IFeedRepository,
    private readonly notificationRepository: INotificationRepository,
    private readonly openGraphRepository: IOpenGraphRepository,
    private readonly imageRepository: IImageRepository,
    private readonly blueskyPostFormatter: BlueskyPostFormatter,
    private readonly webhookMessageFormatter: WebhookMessageFormatter,
  ) {}

  /**
   * ユースケースを実行する
   *
   * @param rssUrl - RSSフィードのURL
   */
  async execute(rssUrl: string): Promise<void> {
    logger.info('フィード取得と通知のユースケースを開始します', { rssUrl });

    const feedUrl = Url.create(rssUrl);

    // 未投稿のアイテムリストを取得・更新
    const itemsToPost = await this.getItemsToPost(feedUrl);

    if (itemsToPost.length === 0) {
      logger.info('投稿するアイテムがありません');

      // 初回実行時は現在時刻をタイムスタンプとして保存
      const lastTimestamp = await this.feedRepository.getLastFetchedTimestamp();
      if (!lastTimestamp) {
        await this.feedRepository.saveLastFetchedTimestamp(Timestamp.now());
        logger.info('初回実行のため、現在時刻をタイムスタンプとして保存しました');
      }

      return;
    }

    logger.info('投稿するアイテム数', { count: itemsToPost.length });

    // 各アイテムを処理
    let processedCount = 0;
    for (const item of itemsToPost) {
      // 最大投稿数に達したら終了
      if (processedCount >= MAX_POST_COUNT) {
        logger.info('最大投稿数に達しました', { count: processedCount });
        break;
      }

      await this.processItem(item);
      processedCount++;

      // 処理済みアイテムを削除して保存
      const remainingItems = itemsToPost.slice(processedCount);
      await this.feedRepository.saveUnpostedItems(remainingItems);

      // タイムスタンプを更新
      await this.feedRepository.saveLastFetchedTimestamp(
        item.getPublishedAt(),
      );
    }

    logger.info('フィード取得と通知のユースケースが完了しました', {
      processedCount,
    });
  }

  /**
   * 投稿するアイテムのリストを取得する
   *
   * @param feedUrl - RSSフィードのURL
   * @returns 投稿するアイテムのリスト
   */
  private async getItemsToPost(feedUrl: Url): Promise<FeedItem[]> {
    // 前回の未投稿アイテムを取得
    const previousUnpostedItems = await this.feedRepository.getUnpostedItems();

    // 最終取得タイムスタンプを取得
    const lastTimestamp = await this.feedRepository.getLastFetchedTimestamp();

    if (!lastTimestamp) {
      logger.warn('最終取得タイムスタンプが見つかりません。前回の未投稿アイテムのみ処理します。');
      // 空でもアイテムリストを保存（初回実行時にファイルを作成）
      await this.feedRepository.saveUnpostedItems(previousUnpostedItems);
      return previousUnpostedItems;
    }

    logger.info('最終取得タイムスタンプ', {
      timestamp: lastTimestamp.toISOString(),
    });

    // 最新のフィードアイテムを取得
    const latestItems = await this.feedRepository.fetchLatestItems(feedUrl);

    // 最終取得タイムスタンプ以降の新しいアイテムをフィルタ
    const newItems = latestItems.filter((item) => item.isPublishedAfter(lastTimestamp));

    logger.info('新しいアイテム数', { count: newItems.length });

    // 前回の未投稿アイテムと今回の新しいアイテムをマージ
    // 重複を避けるため、IDでフィルタリング
    const allItems = [...previousUnpostedItems];
    for (const newItem of newItems) {
      const exists = allItems.some((item) => item.equals(newItem));
      if (!exists) {
        allItems.push(newItem);
      }
    }

    // アイテムリストを保存
    await this.feedRepository.saveUnpostedItems(allItems);

    return allItems;
  }

  /**
   * 1つのアイテムを処理する
   *
   * @param item - 処理するフィードアイテム
   */
  private async processItem(item: FeedItem): Promise<void> {
    logger.info('アイテムを処理しています', {
      id: item.getId(),
      title: item.getTitle(),
      url: item.getUrl().toString(),
    });

    try {
      // OGPデータを取得
      const ogpData = await this.openGraphRepository.fetch(item.getUrl());

      // 画像を取得（存在する場合）
      const imageData = ogpData.hasImage()
        ? await this.imageRepository.fetchAndResize(
          ogpData.getImageUrl()!,
          item.getPublishedAt().toMillis(),
        )
        : null;

      // Blueskyに投稿
      await this.postToBluesky(item, ogpData, imageData);

      // Webhookに通知
      await this.notifyViaWebhook(item, ogpData);

      logger.info('アイテムの処理が完了しました', { id: item.getId() });
    } catch (error) {
      logger.error('アイテムの処理中にエラーが発生しました', error, {
        id: item.getId(),
      });
      throw error;
    }
  }

  /**
   * Blueskyに投稿する
   */
  private async postToBluesky(
    item: FeedItem,
    ogpData: OpenGraphData,
    imageData: ImageData | null,
  ): Promise<void> {
    const richText = await this.blueskyPostFormatter.createRichText(
      item,
      ogpData,
    );

    const title = ogpData.getTitle() || item.getTitle();
    const description = this.blueskyPostFormatter.getDescription(
      ogpData,
      item,
    );

    await this.notificationRepository.postToBluesky({
      richText,
      title,
      url: item.getUrl().toString(),
      description,
      image: imageData ?? undefined,
    });
  }

  /**
   * Webhookに通知する
   */
  private async notifyViaWebhook(item: FeedItem, ogpData: OpenGraphData): Promise<void> {
    const message = this.webhookMessageFormatter.formatMessage(item, ogpData);
    await this.notificationRepository.notifyViaWebhook(message);
  }
}
