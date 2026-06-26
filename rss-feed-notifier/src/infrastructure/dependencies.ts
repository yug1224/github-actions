/**
 * 依存性の構築
 *
 * アプリケーションの依存性を一元管理し、DIコンテナとして機能する
 */
import type { AtpAgent } from '@atproto/api';
import { RssFeedClient } from './external/RssFeedClient.ts';
import { OgpFetcher } from './external/OgpFetcher.ts';
import { ImageProcessor } from './external/ImageProcessor.ts';
import { BlueskyClient } from './external/BlueskyClient.ts';
import {
  FeedRepository,
  ImageRepository,
  NotificationRepository,
  OpenGraphRepository,
} from './repositories/index.ts';
import { BlueskyPostFormatter } from '../application/formatters/BlueskyPostFormatter.ts';

/**
 * アプリケーションの依存性
 */
export interface Dependencies {
  feedRepository: FeedRepository;
  notificationRepository: NotificationRepository;
  openGraphRepository: OpenGraphRepository;
  imageRepository: ImageRepository;
  blueskyPostFormatter: BlueskyPostFormatter;
}

/**
 * 依存性を構築する
 *
 * @param agent - BlueskyのAtpAgent
 * @returns 構築された依存性
 */
export function createDependencies(agent: AtpAgent): Dependencies {
  // External Clients
  const rssFeedClient = new RssFeedClient();
  const ogpFetcher = new OgpFetcher();
  const imageProcessor = new ImageProcessor();
  const blueskyClient = new BlueskyClient(agent);

  // Repositories
  const feedRepository = new FeedRepository(rssFeedClient);
  const openGraphRepository = new OpenGraphRepository(ogpFetcher);
  const imageRepository = new ImageRepository(imageProcessor);
  const notificationRepository = new NotificationRepository(blueskyClient);

  // Formatters
  const blueskyPostFormatter = new BlueskyPostFormatter(agent);

  return {
    feedRepository,
    notificationRepository,
    openGraphRepository,
    imageRepository,
    blueskyPostFormatter,
  };
}
