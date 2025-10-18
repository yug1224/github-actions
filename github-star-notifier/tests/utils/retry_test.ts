/**
 * リトライヘルパーのテスト
 */

import { assertEquals, assertRejects } from 'jsr:@std/assert';
import { retry } from '../../src/utils/retry.ts';

Deno.test('retry - 成功ケース', async () => {
  let callCount = 0;
  const result = await retry(
    async () => {
      callCount++;
      return 'success';
    },
    { maxRetries: 3 },
  );

  assertEquals(result, 'success');
  assertEquals(callCount, 1);
});

Deno.test('retry - 1回失敗後に成功', async () => {
  let callCount = 0;
  const result = await retry(
    async () => {
      callCount++;
      if (callCount === 1) {
        throw new Error('First attempt fails');
      }
      return 'success';
    },
    { maxRetries: 3 },
  );

  assertEquals(result, 'success');
  assertEquals(callCount, 2);
});

Deno.test('retry - 最大リトライ回数を超える', async () => {
  let callCount = 0;
  await assertRejects(
    async () => {
      await retry(
        async () => {
          callCount++;
          throw new Error('Always fails');
        },
        { maxRetries: 2 },
      );
    },
    Error,
    'Always fails',
  );

  assertEquals(callCount, 3); // 初回 + 2回リトライ = 3回
});

Deno.test('retry - onRetryコールバック', async () => {
  const retryAttempts: number[] = [];
  let callCount = 0;

  await retry(
    async () => {
      callCount++;
      if (callCount <= 2) {
        throw new Error('Fail');
      }
      return 'success';
    },
    {
      maxRetries: 3,
      onRetry: (_error, attempt) => {
        retryAttempts.push(attempt);
      },
    },
  );

  assertEquals(retryAttempts, [1, 2]);
});

Deno.test('retry - shouldRetry条件', async () => {
  let callCount = 0;

  await assertRejects(
    async () => {
      await retry(
        async () => {
          callCount++;
          throw new Error('Special error');
        },
        {
          maxRetries: 5,
          shouldRetry: (error) => {
            // 特定のエラーの場合はリトライしない
            return !(error instanceof Error && error.message === 'Special error');
          },
        },
      );
    },
    Error,
    'Special error',
  );

  assertEquals(callCount, 1); // リトライしないので1回のみ
});
