/**
 * WebhookMessageFormatter のテスト
 */
import { assertEquals } from 'jsr:@std/assert';
import { WebhookMessageFormatter } from '../../../src/application/formatters/WebhookMessageFormatter.ts';
import { OpenGraphData } from '../../../src/domain/models/OpenGraphData.ts';
import { FeedItem } from '../../../src/domain/models/FeedItem.ts';

Deno.test('WebhookMessageFormatter.formatMessage() は基本的なメッセージを生成する', () => {
  const formatter = new WebhookMessageFormatter();

  const feedItem = FeedItem.create({
    id: 'test-1',
    title: 'テスト記事',
    url: 'https://example.com/article',
    publishedAt: new Date(),
    description: '',
  });

  const ogp = OpenGraphData.create({
    title: 'テスト記事',
    description: '記事の説明',
  });

  const message = formatter.formatMessage(feedItem, ogp);

  assertEquals(message.includes('テスト記事'), true);
  assertEquals(message.includes('https://example.com/article'), true);
});

Deno.test('WebhookMessageFormatter.formatMessage() は改行を含むメッセージを生成する', () => {
  const formatter = new WebhookMessageFormatter();

  const feedItem = FeedItem.create({
    id: 'test-1',
    title: 'テスト記事',
    url: 'https://example.com/article',
    publishedAt: new Date(),
    description: '',
  });

  const ogp = OpenGraphData.create({
    title: 'テスト記事',
    description: '記事の説明',
  });

  const message = formatter.formatMessage(feedItem, ogp);

  assertEquals(message.includes('\n'), true);
});
