/**
 * FetchAndNotifyUseCase のテスト
 */

import { assertEquals } from '@std/assert';
import type { RichText } from '@atproto/api';
import { FetchAndNotifyUseCase } from '../../../src/application/usecases/FetchAndNotifyUseCase.ts';
import { BlueskyPostFormatter } from '../../../src/application/formatters/BlueskyPostFormatter.ts';
import { FeedItem } from '../../../src/domain/models/FeedItem.ts';
import { Timestamp } from '../../../src/domain/models/Timestamp.ts';
import { Url } from '../../../src/domain/models/Url.ts';
import type { IFeedRepository } from '../../../src/domain/repositories/IFeedRepository.ts';
import type { INotificationRepository } from '../../../src/domain/repositories/INotificationRepository.ts';
import type { IOpenGraphRepository } from '../../../src/domain/repositories/IOpenGraphRepository.ts';
import type {
  IImageRepository,
  ImageData,
} from '../../../src/domain/repositories/IImageRepository.ts';
import { OpenGraphData } from '../../../src/domain/models/OpenGraphData.ts';
import type { AtpAgent } from '@atproto/api';

class MockFeedRepository implements IFeedRepository {
  constructor(private readonly unpostedItems: FeedItem[]) {}

  fetchLatestItems(_feedUrl: Url): Promise<FeedItem[]> {
    return Promise.resolve([]);
  }

  getLastFetchedTimestamp(): Promise<Timestamp | null> {
    return Promise.resolve(Timestamp.fromMillis(1));
  }

  saveLastFetchedTimestamp(_timestamp: Timestamp): Promise<void> {
    return Promise.resolve();
  }

  getUnpostedItems(): Promise<FeedItem[]> {
    return Promise.resolve(this.unpostedItems);
  }

  saveUnpostedItems(_items: FeedItem[]): Promise<void> {
    return Promise.resolve();
  }
}

class MockNotificationRepository implements INotificationRepository {
  public postCount = 0;

  postToBluesky(_postData: {
    richText: RichText;
    title: string;
    url: string;
    description: string;
  }): Promise<void> {
    this.postCount++;
    return Promise.resolve();
  }
}

class MockOpenGraphRepository implements IOpenGraphRepository {
  fetch(_url: Url): Promise<OpenGraphData> {
    return Promise.resolve(OpenGraphData.create({
      title: 'Test Title',
      description: 'Test Description',
    }));
  }
}

class MockImageRepository implements IImageRepository {
  fetchAndResize(_imageUrl: Url, _timestamp: number): Promise<ImageData | null> {
    return Promise.resolve({ data: new Uint8Array(), mimeType: 'image/avif' });
  }
}

function createMockAgent(): AtpAgent {
  return {
    com: {
      atproto: {
        repo: {
          uploadBlob: () => Promise.resolve({ success: true }),
          createRecord: () => Promise.resolve({ success: true }),
        },
      },
    },
  } as AtpAgent;
}

function createTestFeedItem(id: string): FeedItem {
  return FeedItem.create({
    id,
    title: `Title ${id}`,
    url: `https://example.com/${id}`,
    publishedAt: new Date('2025-01-01'),
    description: 'description',
  });
}

Deno.test('FetchAndNotifyUseCase - 処理時間予算に達した場合は打ち切られる', async () => {
  const feedRepository = new MockFeedRepository([
    createTestFeedItem('item-1'),
    createTestFeedItem('item-2'),
  ]);
  const notificationRepository = new MockNotificationRepository();
  const formatter = new BlueskyPostFormatter(createMockAgent());

  const useCase = new FetchAndNotifyUseCase(
    feedRepository,
    notificationRepository,
    new MockOpenGraphRepository(),
    new MockImageRepository(),
    formatter,
  );

  await useCase.execute('https://example.com/feed', 0);

  assertEquals(notificationRepository.postCount, 0);
});
