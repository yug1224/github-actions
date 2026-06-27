/**
 * リトライユーティリティのテスト
 */
import { expect, test } from 'vitest';
import { retry, retryWithBackoff } from '../../src/utils/retry.ts';

test('retry() は成功した場合、結果を返す', async () => {
  let callCount = 0;
  const fn = () =>
    Promise.resolve(
      (() => {
        callCount++;
        return 'success';
      })(),
    );

  const result = await retry(fn, { maxRetries: 3 });

  expect(result).toBe('success');
  expect(callCount).toBe(1);
});

test('retry() は失敗した場合、リトライする', async () => {
  let callCount = 0;
  const fn = () => {
    callCount++;
    if (callCount < 3) {
      return Promise.reject(new Error('失敗'));
    }
    return Promise.resolve('success');
  };

  const result = await retry(fn, { maxRetries: 5 });

  expect(result).toBe('success');
  expect(callCount).toBe(3);
});

test('retry() は最大リトライ回数を超えたらエラーをスローする', async () => {
  let callCount = 0;
  const fn = () => {
    callCount++;
    return Promise.reject(new Error('常に失敗'));
  };

  await expect(retry(fn, { maxRetries: 3 })).rejects.toThrow('常に失敗');

  expect(callCount).toBe(4); // 初回 + 3回リトライ
});

test('retryWithBackoff() は成功した場合、結果を返す', async () => {
  let callCount = 0;
  const fn = () => {
    callCount++;
    return Promise.resolve('success');
  };

  const result = await retryWithBackoff(fn, { maxRetries: 3 }, 10);

  expect(result).toBe('success');
  expect(callCount).toBe(1);
});

test('retryWithBackoff() は失敗した場合、指数バックオフでリトライする', async () => {
  let callCount = 0;
  const startTime = Date.now();

  const fn = () => {
    callCount++;
    if (callCount < 3) {
      return Promise.reject(new Error('失敗'));
    }
    return Promise.resolve('success');
  };

  const result = await retryWithBackoff(fn, { maxRetries: 5 }, 10);

  expect(result).toBe('success');
  expect(callCount).toBe(3);

  // バックオフによる遅延が発生していることを確認
  // 1回目の失敗後: 10ms、2回目の失敗後: 20ms = 最低30ms
  const elapsedTime = Date.now() - startTime;
  expect(elapsedTime >= 30).toBe(true);
});

test('retryWithBackoff() は最大リトライ回数を超えたらエラーをスローする', async () => {
  let callCount = 0;
  const fn = () => {
    callCount++;
    return Promise.reject(new Error('常に失敗'));
  };

  await expect(retryWithBackoff(fn, { maxRetries: 3 }, 10)).rejects.toThrow('常に失敗');

  expect(callCount).toBe(4); // 初回 + 3回リトライ
});
