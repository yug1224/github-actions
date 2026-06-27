/**
 * BlueskyPostFormatter のテスト
 */
import { expect, test } from 'vitest';
import { filterValidAutoDetectedFacets } from '../../../src/application/formatters/BlueskyPostFormatter.ts';

const mentionFeature = (did: string) => ({
  $type: 'app.bsky.richtext.facet#mention' as const,
  did,
});

const linkFeature = (uri: string) => ({
  $type: 'app.bsky.richtext.facet#link' as const,
  uri,
});

const tagFeature = (tag: string) => ({
  $type: 'app.bsky.richtext.facet#tag' as const,
  tag,
});

const facet = (
  byteStart: number,
  byteEnd: number,
  features: ReturnType<typeof mentionFeature | typeof linkFeature | typeof tagFeature>[],
) => ({
  index: { byteStart, byteEnd },
  features,
});

test('filterValidAutoDetectedFacets - 空 DID のメンション facet を除外する', () => {
  const facets = [facet(105, 117, [mentionFeature('')]), facet(0, 10, [tagFeature('test')])];

  const result = filterValidAutoDetectedFacets(facets);

  expect(result).toHaveLength(1);
  expect(result[0].features[0].$type).toBe('app.bsky.richtext.facet#tag');
});

test('filterValidAutoDetectedFacets - 自動検出リンク facet を除外する', () => {
  const facets = [facet(0, 28, [linkFeature('https://example.com/ent..')]), facet(0, 10, [tagFeature('test')])];

  const result = filterValidAutoDetectedFacets(facets);

  expect(result).toHaveLength(1);
  expect(result[0].features[0].$type).toBe('app.bsky.richtext.facet#tag');
});

test('filterValidAutoDetectedFacets - 有効なメンション facet は保持する', () => {
  const facets = [facet(10, 20, [mentionFeature('did:plc:validhandle')])];

  const result = filterValidAutoDetectedFacets(facets);

  expect(result).toHaveLength(1);
  expect(result[0].features[0]).toEqual(mentionFeature('did:plc:validhandle'));
});

test('filterValidAutoDetectedFacets - 空配列を渡すと空配列を返す', () => {
  expect(filterValidAutoDetectedFacets([])).toEqual([]);
});
