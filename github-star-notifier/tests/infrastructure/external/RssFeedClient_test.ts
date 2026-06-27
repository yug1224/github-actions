/**
 * RssFeedClient のマッピングテスト
 */

import { test, expect } from 'vitest';
import type { Item } from 'rss-parser';
import { mapItemToFeedEntry } from '../../../src/infrastructure/external/RssFeedClient.ts';

test('mapItemToFeedEntry - pubDate のみの場合は published を Date 化する', () => {
  const item: Item = {
    pubDate: 'Mon, 01 Jan 2024 00:00:00 GMT',
  };

  const entry = mapItemToFeedEntry(item);

  expect(entry.published).toEqual(new Date('Mon, 01 Jan 2024 00:00:00 GMT'));
});

test('mapItemToFeedEntry - isoDate のみの場合は published を Date 化する', () => {
  const item: Item = {
    isoDate: '2024-01-01T00:00:00.000Z',
  };

  const entry = mapItemToFeedEntry(item);

  expect(entry.published).toEqual(new Date('2024-01-01T00:00:00.000Z'));
});

test('mapItemToFeedEntry - pubDate と isoDate が両方ない場合は published が undefined', () => {
  const item: Item = {
    title: 'example',
  };

  const entry = mapItemToFeedEntry(item);

  expect(entry.published).toBeUndefined();
});

test('mapItemToFeedEntry - pubDate を isoDate より優先する', () => {
  const item: Item = {
    pubDate: 'Mon, 01 Jan 2024 00:00:00 GMT',
    isoDate: '2025-06-01T00:00:00.000Z',
  };

  const entry = mapItemToFeedEntry(item);

  expect(entry.published).toEqual(new Date('Mon, 01 Jan 2024 00:00:00 GMT'));
});
