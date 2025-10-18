/**
 * createXPropsのテスト
 */

import { assertEquals } from 'jsr:@std/assert';
import createXProps from '../src/createXProps.ts';

Deno.test('createXProps - サマリーあり', () => {
  const result = createXProps({
    item: {
      title: { value: 'Test Title' },
      summary: 'Test summary text',
      links: [{ href: 'https://example.com' }],
      id: 'test-id',
      published: new Date('2025-01-01'),
    },
  });

  assertEquals(
    result.xText,
    'Test summary text\n\nTest Title\nhttps://example.com',
  );
});

Deno.test('createXProps - サマリーなし', () => {
  const result = createXProps({
    item: {
      title: { value: 'Test Title' },
      summary: '',
      links: [{ href: 'https://example.com' }],
      id: 'test-id',
      published: new Date('2025-01-01'),
    },
  });

  assertEquals(result.xText, 'Test Title\nhttps://example.com');
});

Deno.test('createXProps - 空白をトリム', () => {
  const result = createXProps({
    item: {
      title: { value: '  Title with spaces  ' },
      summary: '',
      links: [{ href: 'https://example.com' }],
      id: 'test-id',
      published: new Date('2025-01-01'),
    },
  });

  assertEquals(result.xText, 'Title with spaces\nhttps://example.com');
});
