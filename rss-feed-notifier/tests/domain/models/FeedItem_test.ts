/**
 * FeedItem Entity のテスト
 */
import { assertEquals } from 'jsr:@std/assert';
import { FeedItem } from '../../../src/domain/models/FeedItem.ts';

Deno.test('FeedItem.create() はフィードアイテムを生成する', () => {
  const publishedAt = new Date('2024-01-01T00:00:00Z');

  const item = FeedItem.create({
    id: 'item-123',
    title: 'テスト記事',
    url: 'https://example.com/article',
    publishedAt,
    description: '記事の説明文',
  });

  assertEquals(item.getId(), 'item-123');
  assertEquals(item.getTitle(), 'テスト記事');
  assertEquals(item.getUrl().toString(), 'https://example.com/article');
  assertEquals(item.getPublishedAt().toDate().getTime(), publishedAt.getTime());
  assertEquals(item.getDescription(), '記事の説明文');
});

Deno.test('FeedItem.equals() は同じIDの場合trueを返す', () => {
  const publishedAt = new Date('2024-01-01T00:00:00Z');

  const item1 = FeedItem.create({
    id: 'item-123',
    title: 'タイトル1',
    url: 'https://example.com/article',
    publishedAt,
    description: '',
  });

  const item2 = FeedItem.create({
    id: 'item-123',
    title: 'タイトル2',
    url: 'https://example.com/article',
    publishedAt,
    description: '',
  });

  assertEquals(item1.equals(item2), true);
});

Deno.test('FeedItem.equals() は異なるIDの場合falseを返す', () => {
  const publishedAt = new Date('2024-01-01T00:00:00Z');

  const item1 = FeedItem.create({
    id: 'item-123',
    title: 'タイトル',
    url: 'https://example.com/article',
    publishedAt,
    description: '',
  });

  const item2 = FeedItem.create({
    id: 'item-456',
    title: 'タイトル',
    url: 'https://example.com/article',
    publishedAt,
    description: '',
  });

  assertEquals(item1.equals(item2), false);
});
