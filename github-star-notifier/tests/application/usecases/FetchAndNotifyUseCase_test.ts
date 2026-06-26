/**
 * FetchAndNotifyUseCase のテスト
 */

import { assert, assertEquals } from 'https://deno.land/std@0.218.0/assert/mod.ts';
import { FetchAndNotifyUseCase } from '../../../src/application/usecases/FetchAndNotifyUseCase.ts';
import type {
  IContentRepository,
  IFeedRepository,
  INotificationRepository,
  ISummaryService,
} from '../../../src/domain/repositories/index.ts';
import { OpenGraphData, Summary, Url } from '../../../src/domain/models/index.ts';
import type { FeedEntry } from '@mikaelporttila/rss';
import type { AtpAgent } from '@atproto/api';

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
    return Promise.resolve(OpenGraphData.create({
      title: 'Test OGP Title',
      description: 'Test OGP Description',
      image: 'https://example.com/image.jpg',
    }));
  }
}

/**
 * モックSummaryService
 */
class MockSummaryService implements ISummaryService {
  public generateCalled = false;

  generateSummary(
    _textContent: string,
    _url?: Url,
  ): Promise<Summary | null> {
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

  sendWebhookNotification(
    _message: string,
    _webhookUrl?: string,
  ): Promise<void> {
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

Deno.test('FetchAndNotifyUseCase - フィード取得と通知が正常に完了する', async () => {
  const feedRepo = new MockFeedRepository();
  const contentRepo = new MockContentRepository();
  const summaryService = new MockSummaryService();
  const notificationRepo = new MockNotificationRepository();

  const useCase = new FetchAndNotifyUseCase(
    feedRepo,
    contentRepo,
    summaryService,
    notificationRepo,
  );

  const mockAgent = createMockAgent();
  await useCase.execute('https://example.com/feed', mockAgent, undefined);

  // 各リポジトリのメソッドが呼ばれたことを確認
  assert(feedRepo.fetchLatestItemsCalled, 'fetchLatestItems が呼ばれるべき');
  assert(feedRepo.saveTimestampCalled, 'saveLastFetchedTimestamp が呼ばれるべき');
  assert(contentRepo.extractCalled, 'extractArticleContent が呼ばれるべき');
  assert(contentRepo.fetchOgpCalled, 'fetchOpenGraphData が呼ばれるべき');
  assert(summaryService.generateCalled, 'generateSummary が呼ばれるべき');
  assertEquals(notificationRepo.blueskyCallCount, 1, 'Bluesky投稿は1回呼ばれるべき');
  assertEquals(notificationRepo.webhookCallCount, 1, 'Webhook通知は1回呼ばれるべき');
});

Deno.test('FetchAndNotifyUseCase - フィードが空の場合は何もしない', async () => {
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

  const useCase = new FetchAndNotifyUseCase(
    feedRepo,
    contentRepo,
    summaryService,
    notificationRepo,
  );

  const mockAgent = createMockAgent();
  await useCase.execute('https://example.com/feed', mockAgent, undefined);

  // 何も処理されないことを確認
  assert(!contentRepo.extractCalled, 'extractArticleContent は呼ばれないべき');
  assert(!summaryService.generateCalled, 'generateSummary は呼ばれないべき');
  assertEquals(notificationRepo.blueskyCallCount, 0, 'Bluesky投稿は呼ばれないべき');
});

Deno.test('FetchAndNotifyUseCase - 処理時間予算に達した場合は打ち切られる', async () => {
  class MultipleFeedRepository implements IFeedRepository {
    fetchLatestItems(_feedUrl: string): Promise<FeedEntry[]> {
      return Promise.resolve(Array.from({ length: 5 }, (_, i) => ({
        id: `test-id-${i}`,
        title: { value: `Article ${i}` },
        links: [{ href: `https://example.com/article-${i}` }],
        published: new Date('2025-01-01'),
      })) as FeedEntry[]);
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

  const useCase = new FetchAndNotifyUseCase(
    feedRepo,
    contentRepo,
    summaryService,
    notificationRepo,
  );

  const mockAgent = createMockAgent();
  // 予算0msで即座に打ち切り
  await useCase.execute('https://example.com/feed', mockAgent, undefined, 0);

  assertEquals(notificationRepo.blueskyCallCount, 0, '予算切れのためBluesky投稿は呼ばれないべき');
  assertEquals(notificationRepo.webhookCallCount, 0, '予算切れのためWebhook通知は呼ばれないべき');
});

Deno.test('FetchAndNotifyUseCase - 古い順に処理される', async () => {
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

  const useCase = new FetchAndNotifyUseCase(
    feedRepo,
    contentRepo,
    summaryService,
    notificationRepo,
  );

  const mockAgent = createMockAgent();
  await useCase.execute('https://example.com/feed', mockAgent, undefined);

  assertEquals(notificationRepo.processedLinks, [
    'https://example.com/article-oldest',
    'https://example.com/article-middle',
    'https://example.com/article-newest',
  ]);
});
