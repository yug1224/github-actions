/**
 * リトライユーティリティのテスト
 */
import { assertEquals, assertRejects } from 'jsr:@std/assert';
import { retry, retryWithBackoff } from '../../src/utils/retry.ts';

Deno.test('retry() は成功した場合、結果を返す', async () => {
  let callCount = 0;
  const fn = () =>
    Promise.resolve((() => {
      callCount++;
      return 'success';
    })());

  const result = await retry(fn, { maxRetries: 3 });

  assertEquals(result, 'success');
  assertEquals(callCount, 1);
});

Deno.test('retry() は失敗した場合、リトライする', async () => {
  let callCount = 0;
  const fn = () => {
    callCount++;
    if (callCount < 3) {
      return Promise.reject(new Error('失敗'));
    }
    return Promise.resolve('success');
  };

  const result = await retry(fn, { maxRetries: 5 });

  assertEquals(result, 'success');
  assertEquals(callCount, 3);
});

Deno.test('retry() は最大リトライ回数を超えたらエラーをスローする', async () => {
  let callCount = 0;
  const fn = () => {
    callCount++;
    return Promise.reject(new Error('常に失敗'));
  };

  await assertRejects(
    async () => await retry(fn, { maxRetries: 3 }),
    Error,
    '常に失敗',
  );

  assertEquals(callCount, 4); // 初回 + 3回リトライ
});

Deno.test('retryWithBackoff() は成功した場合、結果を返す', async () => {
  let callCount = 0;
  const fn = () => {
    callCount++;
    return Promise.resolve('success');
  };

  const result = await retryWithBackoff(fn, { maxRetries: 3 }, 10);

  assertEquals(result, 'success');
  assertEquals(callCount, 1);
});

Deno.test('retryWithBackoff() は失敗した場合、指数バックオフでリトライする', async () => {
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

  assertEquals(result, 'success');
  assertEquals(callCount, 3);

  // バックオフによる遅延が発生していることを確認
  // 1回目の失敗後: 10ms、2回目の失敗後: 20ms = 最低30ms
  const elapsedTime = Date.now() - startTime;
  assertEquals(elapsedTime >= 30, true);
});

Deno.test('retryWithBackoff() は最大リトライ回数を超えたらエラーをスローする', async () => {
  let callCount = 0;
  const fn = () => {
    callCount++;
    return Promise.reject(new Error('常に失敗'));
  };

  await assertRejects(
    async () => await retryWithBackoff(fn, { maxRetries: 3 }, 10),
    Error,
    '常に失敗',
  );

  assertEquals(callCount, 4); // 初回 + 3回リトライ
});
