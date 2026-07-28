/**
 * FeedRepository のタイムスタンプ欠落ガードテスト
 */

import { test, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const fetchFeedItemsMock = vi.hoisted(() => vi.fn());

vi.mock('../../../src/infrastructure/external/RssFeedClient.ts', () => ({
  default: fetchFeedItemsMock,
}));

import {
  FeedRepository,
  isMissingLastFetchedTimestamp,
} from '../../../src/infrastructure/repositories/FeedRepository.ts';

beforeEach(() => {
  fetchFeedItemsMock.mockReset();
});

afterEach(() => {
  fetchFeedItemsMock.mockReset();
});

test('isMissingLastFetchedTimestamp - 0 のとき true', () => {
  expect(isMissingLastFetchedTimestamp(0)).toBe(true);
});

test('isMissingLastFetchedTimestamp - 有効なタイムスタンプのとき false', () => {
  expect(isMissingLastFetchedTimestamp(1704067200000)).toBe(false);
});

test('FeedRepository.fetchLatestItems - タイムスタンプ欠落時は空配列を返し現在時刻を保存する', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'feed-repo-'));
  const timestampFile = join(dir, 'data', '.timestamp');
  await mkdir(join(dir, 'data'), { recursive: true });

  const previousCwd = process.cwd();
  process.chdir(dir);

  try {
    const repo = new FeedRepository();
    const before = Date.now();
    const items = await repo.fetchLatestItems('https://example.com/feed');
    const after = Date.now();

    expect(items).toEqual([]);
    expect(fetchFeedItemsMock).not.toHaveBeenCalled();

    const saved = Number(await readFile(timestampFile, 'utf-8'));
    expect(saved).toBeGreaterThanOrEqual(before);
    expect(saved).toBeLessThanOrEqual(after);
  } finally {
    process.chdir(previousCwd);
    await rm(dir, { recursive: true, force: true });
  }
});

test('FeedRepository.fetchLatestItems - タイムスタンプがあるとき RssFeedClient に渡す', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'feed-repo-'));
  const timestampFile = join(dir, 'data', '.timestamp');
  await mkdir(join(dir, 'data'), { recursive: true });
  await writeFile(timestampFile, '1704067200000', 'utf-8');

  const previousCwd = process.cwd();
  process.chdir(dir);
  fetchFeedItemsMock.mockResolvedValueOnce([]);

  try {
    const repo = new FeedRepository();
    await repo.fetchLatestItems('https://example.com/feed');

    expect(fetchFeedItemsMock).toHaveBeenCalledWith('https://example.com/feed', 1704067200000);
  } finally {
    process.chdir(previousCwd);
    await rm(dir, { recursive: true, force: true });
    fetchFeedItemsMock.mockReset();
  }
});
