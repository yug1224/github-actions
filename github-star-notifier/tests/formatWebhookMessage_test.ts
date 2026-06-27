/**
 * formatWebhookMessageのテスト
 */

import { test, expect } from 'vitest';
import formatWebhookMessage from '../src/application/formatters/WebhookMessageFormatter.ts';

test('formatWebhookMessage - サマリーあり', () => {
  const result = formatWebhookMessage({
    item: {
      title: { value: 'Test Title' },
      summary: 'Test summary text',
      links: [{ href: 'https://example.com' }],
      id: 'test-id',
      published: new Date('2025-01-01'),
    },
  });

  expect(result.content).toBe('Test summary text\n\nTest Title\nhttps://example.com');
});

test('formatWebhookMessage - サマリーなし', () => {
  const result = formatWebhookMessage({
    item: {
      title: { value: 'Test Title' },
      summary: '',
      links: [{ href: 'https://example.com' }],
      id: 'test-id',
      published: new Date('2025-01-01'),
    },
  });

  expect(result.content).toBe('Test Title\nhttps://example.com');
});

test('formatWebhookMessage - 空白をトリム', () => {
  const result = formatWebhookMessage({
    item: {
      title: { value: '  Title with spaces  ' },
      summary: '',
      links: [{ href: 'https://example.com' }],
      id: 'test-id',
      published: new Date('2025-01-01'),
    },
  });

  expect(result.content).toBe('Title with spaces\nhttps://example.com');
});

test('formatWebhookMessage - 複数行サマリー', () => {
  const result = formatWebhookMessage({
    item: {
      title: { value: 'Test Title' },
      summary: 'Line 1\nLine 2',
      links: [{ href: 'https://example.com' }],
      id: 'test-id',
      published: new Date('2025-01-01'),
    },
  });

  expect(result.content).toBe('Line 1\nLine 2\n\nTest Title\nhttps://example.com');
});

test('formatWebhookMessage - 長いサマリー', () => {
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

  expect(result.content).toBe(`${longSummary}\n\nTest Title\nhttps://example.com`);
});

test('formatWebhookMessage - 特殊文字を含むタイトル', () => {
  const result = formatWebhookMessage({
    item: {
      title: { value: 'Test & <Title> "with" \'quotes\'' },
      summary: '',
      links: [{ href: 'https://example.com' }],
      id: 'test-id',
      published: new Date('2025-01-01'),
    },
  });

  expect(result.content).toBe('Test & <Title> "with" \'quotes\'\nhttps://example.com');
});
