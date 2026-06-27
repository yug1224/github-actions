/**
 * FeedItem Entity のテスト
 */
import { expect, test } from 'vitest';
import { FeedItem } from '../../../src/domain/models/FeedItem.ts';

test('FeedItem.create() はフィードアイテムを生成する', () => {
  const publishedAt = new Date('2024-01-01T00:00:00Z');

  const item = FeedItem.create({
    id: 'item-123',
    title: 'テスト記事',
    url: 'https://example.com/article',
    publishedAt,
    description: '記事の説明文',
  });

  expect(item.getId()).toBe('item-123');
  expect(item.getTitle()).toBe('テスト記事');
  expect(item.getUrl().toString()).toBe('https://example.com/article');
  expect(item.getPublishedAt().toDate().getTime()).toBe(publishedAt.getTime());
  expect(item.getDescription()).toBe('記事の説明文');
});

test('FeedItem.equals() は同じIDの場合trueを返す', () => {
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

  expect(item1.equals(item2)).toBe(true);
});

test('FeedItem.equals() は異なるIDの場合falseを返す', () => {
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

  expect(item1.equals(item2)).toBe(false);
});
