/**
 * 依存性の構築
 *
 * アプリケーションの依存性を一元管理し、DIコンテナとして機能する
 */
import type { AtpAgent } from 'npm:@atproto/api';
import type { EnvConfig } from '../config/env.ts';
import { RssFeedClient } from './external/RssFeedClient.ts';
import { OgpFetcher } from './external/OgpFetcher.ts';
import { ImageProcessor } from './external/ImageProcessor.ts';
import { BlueskyClient } from './external/BlueskyClient.ts';
import { WebhookClient } from './external/WebhookClient.ts';
import {
  FeedRepository,
  ImageRepository,
  NotificationRepository,
  OpenGraphRepository,
} from './repositories/index.ts';
import { BlueskyPostFormatter } from '../application/formatters/BlueskyPostFormatter.ts';
import { WebhookMessageFormatter } from '../application/formatters/WebhookMessageFormatter.ts';

/**
 * アプリケーションの依存性
 */
export interface Dependencies {
  feedRepository: FeedRepository;
  notificationRepository: NotificationRepository;
  openGraphRepository: OpenGraphRepository;
  imageRepository: ImageRepository;
  blueskyPostFormatter: BlueskyPostFormatter;
  webhookMessageFormatter: WebhookMessageFormatter;
}

/**
 * 依存性を構築する
 *
 * @param agent - BlueskyのAtpAgent
 * @param env - 環境変数設定
 * @returns 構築された依存性
 */
export function createDependencies(
  agent: AtpAgent,
  env: Pick<EnvConfig, 'WEBHOOK_URL'>,
): Dependencies {
  // External Clients
  const rssFeedClient = new RssFeedClient();
  const ogpFetcher = new OgpFetcher();
  const imageProcessor = new ImageProcessor();
  const blueskyClient = new BlueskyClient(agent);
  const webhookClient = env.WEBHOOK_URL ? new WebhookClient(env.WEBHOOK_URL) : undefined;

  // Repositories
  const feedRepository = new FeedRepository(rssFeedClient);
  const openGraphRepository = new OpenGraphRepository(ogpFetcher);
  const imageRepository = new ImageRepository(imageProcessor);
  const notificationRepository = new NotificationRepository(
    blueskyClient,
    webhookClient,
  );

  // Formatters
  const blueskyPostFormatter = new BlueskyPostFormatter(agent);
  const webhookMessageFormatter = new WebhookMessageFormatter();

  return {
    feedRepository,
    notificationRepository,
    openGraphRepository,
    imageRepository,
    blueskyPostFormatter,
    webhookMessageFormatter,
  };
}
