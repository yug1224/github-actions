/**
 * formatWebhookMessageのテスト
 */

import { assertEquals } from 'jsr:@std/assert';
import formatWebhookMessage from '../src/application/formatters/WebhookMessageFormatter.ts';

Deno.test('formatWebhookMessage - サマリーあり', () => {
  const result = formatWebhookMessage({
    item: {
      title: { value: 'Test Title' },
      summary: 'Test summary text',
      links: [{ href: 'https://example.com' }],
      id: 'test-id',
      published: new Date('2025-01-01'),
    },
  });

  assertEquals(
    result.content,
    'Test summary text\n\nTest Title\nhttps://example.com',
  );
});

Deno.test('formatWebhookMessage - サマリーなし', () => {
  const result = formatWebhookMessage({
    item: {
      title: { value: 'Test Title' },
      summary: '',
      links: [{ href: 'https://example.com' }],
      id: 'test-id',
      published: new Date('2025-01-01'),
    },
  });

  assertEquals(result.content, 'Test Title\nhttps://example.com');
});

Deno.test('formatWebhookMessage - 空白をトリム', () => {
  const result = formatWebhookMessage({
    item: {
      title: { value: '  Title with spaces  ' },
      summary: '',
      links: [{ href: 'https://example.com' }],
      id: 'test-id',
      published: new Date('2025-01-01'),
    },
  });

  assertEquals(result.content, 'Title with spaces\nhttps://example.com');
});

Deno.test('formatWebhookMessage - 複数行サマリー', () => {
  const result = formatWebhookMessage({
    item: {
      title: { value: 'Test Title' },
      summary: 'Line 1\nLine 2',
      links: [{ href: 'https://example.com' }],
      id: 'test-id',
      published: new Date('2025-01-01'),
    },
  });

  assertEquals(
    result.content,
    'Line 1\nLine 2\n\nTest Title\nhttps://example.com',
  );
});

Deno.test('formatWebhookMessage - 長いサマリー', () => {
  const longSummary = 'A'.repeat(200);
  const result = formatWebhookMessage({
    item: {
      title: { value: 'Test Title' },
      summary: longSummary,
      links: [{ href: 'https://example.com' }],
      id: 'test-id',
      published: new Date('2025-01-01'),
    },
  });

  assertEquals(
    result.content,
    `${longSummary}\n\nTest Title\nhttps://example.com`,
  );
});

Deno.test('formatWebhookMessage - 特殊文字を含むタイトル', () => {
  const result = formatWebhookMessage({
    item: {
      title: { value: 'Test & <Title> "with" \'quotes\'' },
      summary: '',
      links: [{ href: 'https://example.com' }],
      id: 'test-id',
      published: new Date('2025-01-01'),
    },
  });

  assertEquals(
    result.content,
    'Test & <Title> "with" \'quotes\'\nhttps://example.com',
  );
});
