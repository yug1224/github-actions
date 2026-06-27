/**
 * FetchAndNotifyUseCase のテスト
 */

import { test, expect, vi } from 'vitest';
import { FetchAndNotifyUseCase } from '../../../src/application/usecases/FetchAndNotifyUseCase.ts';
import type {
  IContentRepository,
  IFeedRepository,
  INotificationRepository,
  ISummaryService,
} from '../../../src/domain/repositories/index.ts';
import { OpenGraphData, Summary, Url } from '../../../src/domain/models/index.ts';
import type { FeedEntry } from '../../../src/types/feedEntry.ts';
import type { AtpAgent } from '@atproto/api';

vi.mock('../../../src/infrastructure/external/ImageProcessor.ts', () => ({
  default: vi.fn(async () => ({
    mimeType: 'image/avif',
    resizedImage: new Uint8Array([0]),
  })),
}));

/**
 * モックFeedRepository
 */
class MockFeedRepository implements IFeedRepository {
  public fetchLatestItemsCalled = false;
  public saveTimestampCalled = false;
  public savedTimestamp?: number;

  fetchLatestItems(_feedUrl: string): Promise<FeedEntry[]> {
    this.fetchLatestItemsCalled = true;
    return Promise.resolve([
      {
        id: 'test-id-1',
        title: { value: 'Test Article' },
        links: [{ href: 'https://example.com/article' }],
        published: new Date('2025-01-01'),
      } as FeedEntry,
    ]);
  }

  getLastFetchedTimestamp(): Promise<number> {
    return Promise.resolve(0);
  }

  saveLastFetchedTimestamp(timestamp: number): Promise<void> {
    this.saveTimestampCalled = true;
    this.savedTimestamp = timestamp;
    return Promise.resolve();
  }
}

/**
 * モックContentRepository
 */
class MockContentRepository implements IContentRepository {
  public extractCalled = false;
  public fetchOgpCalled = false;

  extractArticleContent(_url: Url): Promise<string> {
    this.extractCalled = true;
    return Promise.resolve('Test article content');
  }

  fetchOpenGraphData(_url: Url): Promise<OpenGraphData> {
    this.fetchOgpCalled = true;
    return Promise.resolve(
      OpenGraphData.create({
        title: 'Test OGP Title',
        description: 'Test OGP Description',
        image: 'https://example.com/image.jpg',
      }),
    );
  }
}

/**
 * モックSummaryService
 */
class MockSummaryService implements ISummaryService {
  public generateCalled = false;

  generateSummary(_textContent: string, _url?: Url): Promise<Summary | null> {
    this.generateCalled = true;
    return Promise.resolve(Summary.create('これはテスト要約です'));
  }
}

/**
 * モックNotificationRepository
 */
class MockNotificationRepository implements INotificationRepository {
  public blueskyCallCount = 0;
  public webhookCallCount = 0;
  public processedLinks: string[] = [];

  publishToBluesky(params: {
    agent: unknown;
    richText: unknown;
    title: string;
    link: string;
    mimeType?: string;
    image?: Uint8Array;
  }): Promise<void> {
    this.blueskyCallCount++;
    this.processedLinks.push(params.link);
    return Promise.resolve();
  }

  sendWebhookNotification(_message: string, _webhookUrl?: string): Promise<void> {
    this.webhookCallCount++;
    return Promise.resolve();
  }
}

/**
 * モックAtpAgent
 */
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

test('FetchAndNotifyUseCase - フィード取得と通知が正常に完了する', async () => {
  const feedRepo = new MockFeedRepository();
  const contentRepo = new MockContentRepository();
  const summaryService = new MockSummaryService();
  const notificationRepo = new MockNotificationRepository();

  const useCase = new FetchAndNotifyUseCase(feedRepo, contentRepo, summaryService, notificationRepo);

  const mockAgent = createMockAgent();
  await useCase.execute('https://example.com/feed', mockAgent, undefined);

  // 各リポジトリのメソッドが呼ばれたことを確認
  expect(feedRepo.fetchLatestItemsCalled).toBeTruthy();
  expect(feedRepo.saveTimestampCalled).toBeTruthy();
  expect(contentRepo.extractCalled).toBeTruthy();
  expect(contentRepo.fetchOgpCalled).toBeTruthy();
  expect(summaryService.generateCalled).toBeTruthy();
  expect(notificationRepo.blueskyCallCount).toBe(1);
  expect(notificationRepo.webhookCallCount).toBe(1);
});

test('FetchAndNotifyUseCase - フィードが空の場合は何もしない', async () => {
  class EmptyFeedRepository implements IFeedRepository {
    fetchLatestItems(_feedUrl: string): Promise<FeedEntry[]> {
      return Promise.resolve([]);
    }
    getLastFetchedTimestamp(): Promise<number> {
      return Promise.resolve(0);
    }
    saveLastFetchedTimestamp(_timestamp: number): Promise<void> {
      return Promise.resolve();
    }
  }

  const feedRepo = new EmptyFeedRepository();
  const contentRepo = new MockContentRepository();
  const summaryService = new MockSummaryService();
  const notificationRepo = new MockNotificationRepository();

  const useCase = new FetchAndNotifyUseCase(feedRepo, contentRepo, summaryService, notificationRepo);

  const mockAgent = createMockAgent();
  await useCase.execute('https://example.com/feed', mockAgent, undefined);

  // 何も処理されないことを確認
  expect(contentRepo.extractCalled, 'extractArticleContent は呼ばれないべき').toBeFalsy();
  expect(summaryService.generateCalled, 'generateSummary は呼ばれないべき').toBeFalsy();
  expect(notificationRepo.blueskyCallCount).toBe(0);
});

test('FetchAndNotifyUseCase - 処理時間予算に達した場合は打ち切られる', async () => {
  class MultipleFeedRepository implements IFeedRepository {
    fetchLatestItems(_feedUrl: string): Promise<FeedEntry[]> {
      return Promise.resolve(
        Array.from({ length: 5 }, (_, i) => ({
          id: `test-id-${i}`,
          title: { value: `Article ${i}` },
          links: [{ href: `https://example.com/article-${i}` }],
          published: new Date('2025-01-01'),
        })) as FeedEntry[],
      );
    }
    getLastFetchedTimestamp(): Promise<number> {
      return Promise.resolve(0);
    }
    saveLastFetchedTimestamp(_timestamp: number): Promise<void> {
      return Promise.resolve();
    }
  }

  const feedRepo = new MultipleFeedRepository();
  const contentRepo = new MockContentRepository();
  const summaryService = new MockSummaryService();
  const notificationRepo = new MockNotificationRepository();

  const useCase = new FetchAndNotifyUseCase(feedRepo, contentRepo, summaryService, notificationRepo);

  const mockAgent = createMockAgent();
  // 予算0msで即座に打ち切り
  await useCase.execute('https://example.com/feed', mockAgent, undefined, 0);

  expect(notificationRepo.blueskyCallCount).toBe(0);
  expect(notificationRepo.webhookCallCount).toBe(0);
});

test('FetchAndNotifyUseCase - 古い順に処理される', async () => {
  class OrderedFeedRepository implements IFeedRepository {
    fetchLatestItems(_feedUrl: string): Promise<FeedEntry[]> {
      // RssFeedClient と同様、新しい順で返す
      return Promise.resolve([
        {
          id: 'newest',
          title: { value: 'Newest' },
          links: [{ href: 'https://example.com/article-newest' }],
          published: new Date('2025-01-03'),
        },
        {
          id: 'middle',
          title: { value: 'Middle' },
          links: [{ href: 'https://example.com/article-middle' }],
          published: new Date('2025-01-02'),
        },
        {
          id: 'oldest',
          title: { value: 'Oldest' },
          links: [{ href: 'https://example.com/article-oldest' }],
          published: new Date('2025-01-01'),
        },
      ] as FeedEntry[]);
    }
    getLastFetchedTimestamp(): Promise<number> {
      return Promise.resolve(0);
    }
    saveLastFetchedTimestamp(_timestamp: number): Promise<void> {
      return Promise.resolve();
    }
  }

  const feedRepo = new OrderedFeedRepository();
  const contentRepo = new MockContentRepository();
  const summaryService = new MockSummaryService();
  const notificationRepo = new MockNotificationRepository();

  const useCase = new FetchAndNotifyUseCase(feedRepo, contentRepo, summaryService, notificationRepo);

  const mockAgent = createMockAgent();
  await useCase.execute('https://example.com/feed', mockAgent, undefined);

  expect(notificationRepo.processedLinks).toEqual([
    'https://example.com/article-oldest',
    'https://example.com/article-middle',
    'https://example.com/article-newest',
  ]);
});
