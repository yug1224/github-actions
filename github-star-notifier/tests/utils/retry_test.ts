/**
 * リトライヘルパーのテスト
 */

import { test, expect } from 'vitest';
import { retry } from '../../src/utils/retry.ts';

test('retry - 成功ケース', async () => {
  let callCount = 0;
  const result = await retry(
    () => {
      callCount++;
      return Promise.resolve('success');
    },
    { maxRetries: 3 },
  );

  expect(result).toBe('success');
  expect(callCount).toBe(1);
});

test('retry - 1回失敗後に成功', async () => {
  let callCount = 0;
  const result = await retry(
    () => {
      callCount++;
      if (callCount === 1) {
        throw new Error('First attempt fails');
      }
      return Promise.resolve('success');
    },
    { maxRetries: 3 },
  );

  expect(result).toBe('success');
  expect(callCount).toBe(2);
});

test('retry - 最大リトライ回数を超える', async () => {
  let callCount = 0;
  await expect(
    retry(
      () => {
        callCount++;
        throw new Error('Always fails');
      },
      { maxRetries: 2 },
    ),
  ).rejects.toThrow('Always fails');

  expect(callCount).toBe(3); // 初回 + 2回リトライ = 3回
});

test('retry - onRetryコールバック', async () => {
  const retryAttempts: number[] = [];
  let callCount = 0;

  await retry(
    () => {
      callCount++;
      if (callCount <= 2) {
        throw new Error('Fail');
      }
      return Promise.resolve('success');
    },
    {
      maxRetries: 3,
      onRetry: (_error, attempt) => {
        retryAttempts.push(attempt);
      },
    },
  );

  expect(retryAttempts).toEqual([1, 2]);
});

test('retry - shouldRetry条件', async () => {
  let callCount = 0;

  await expect(
    retry(
      () => {
        callCount++;
        throw new Error('Special error');
      },
      {
        maxRetries: 5,
        shouldRetry: (error) => {
          return !(error instanceof Error && error.message === 'Special error');
        },
      },
    ),
  ).rejects.toThrow('Special error');

  expect(callCount).toBe(1); // リトライしないので1回のみ
});
