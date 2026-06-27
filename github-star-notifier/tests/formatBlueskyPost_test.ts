/**
 * formatBlueskyPostのテスト
 */

import { test, expect } from 'vitest';
import formatBlueskyPost from '../src/application/formatters/BlueskyPostFormatter.ts';
import type { AtpAgent } from '@atproto/api';

// モックエージェントの作成
function createMockAgent(): AtpAgent {
  return {
    // detectFacets用の最小限のモック
  } as AtpAgent;
}

test('formatBlueskyPost - サマリーあり', async () => {
  const agent = createMockAgent();
  const result = await formatBlueskyPost({
    agent,
    item: {
      title: { value: 'Test Title' },
      summary: 'Test summary text',
      links: [{ href: 'https://example.com' }],
      id: 'test-id',
      published: new Date('2025-01-01'),
    },
  });

  // richText.textの内容を検証
  expect(result.richText.text).toBe('Test summary text\n\nTest Title\nhttps://example.com');
});

test('formatBlueskyPost - サマリーなし', async () => {
  const agent = createMockAgent();
  const result = await formatBlueskyPost({
    agent,
    item: {
      title: { value: 'Test Title' },
      summary: '',
      links: [{ href: 'https://example.com' }],
      id: 'test-id',
      published: new Date('2025-01-01'),
    },
  });

  expect(result.richText.text).toBe('Test Title\nhttps://example.com');
});

test('formatBlueskyPost - タイトルの空白をトリム', async () => {
  const agent = createMockAgent();
  const result = await formatBlueskyPost({
    agent,
    item: {
      title: { value: '  Title with spaces  ' },
      summary: '',
      links: [{ href: 'https://example.com' }],
      id: 'test-id',
      published: new Date('2025-01-01'),
    },
  });

  expect(result.richText.text).toBe('Title with spaces\nhttps://example.com');
});

test('formatBlueskyPost - 複数行サマリー', async () => {
  const agent = createMockAgent();
  const result = await formatBlueskyPost({
    agent,
    item: {
      title: { value: 'Test Title' },
      summary: 'Line 1\nLine 2',
      links: [{ href: 'https://example.com' }],
      id: 'test-id',
      published: new Date('2025-01-01'),
    },
  });

  expect(result.richText.text).toBe('Line 1\nLine 2\n\nTest Title\nhttps://example.com');
});

test('formatBlueskyPost - 長いサマリー', async () => {
  const agent = createMockAgent();
  const longSummary = 'A'.repeat(200);
  const result = await formatBlueskyPost({
    agent,
    item: {
      title: { value: 'Test Title' },
      summary: longSummary,
      links: [{ href: 'https://example.com' }],
      id: 'test-id',
      published: new Date('2025-01-01'),
    },
  });

  expect(result.richText.text).toBe(`${longSummary}\n\nTest Title\nhttps://example.com`);
});
