/**
 * BlueskyPostFormatter のテスト
 */
import { assertEquals } from '@std/assert';
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

Deno.test('filterValidAutoDetectedFacets - 空 DID のメンション facet を除外する', () => {
  const facets = [
    facet(105, 117, [mentionFeature('')]),
    facet(0, 10, [tagFeature('test')]),
  ];

  const result = filterValidAutoDetectedFacets(facets);

  assertEquals(result.length, 1);
  assertEquals(result[0].features[0].$type, 'app.bsky.richtext.facet#tag');
});

Deno.test('filterValidAutoDetectedFacets - 自動検出リンク facet を除外する', () => {
  const facets = [
    facet(0, 28, [linkFeature('https://example.com/ent..')]),
    facet(0, 10, [tagFeature('test')]),
  ];

  const result = filterValidAutoDetectedFacets(facets);

  assertEquals(result.length, 1);
  assertEquals(result[0].features[0].$type, 'app.bsky.richtext.facet#tag');
});

Deno.test('filterValidAutoDetectedFacets - 有効なメンション facet は保持する', () => {
  const facets = [
    facet(10, 20, [mentionFeature('did:plc:validhandle')]),
  ];

  const result = filterValidAutoDetectedFacets(facets);

  assertEquals(result.length, 1);
  assertEquals(result[0].features[0], mentionFeature('did:plc:validhandle'));
});

Deno.test('filterValidAutoDetectedFacets - 空配列を渡すと空配列を返す', () => {
  assertEquals(filterValidAutoDetectedFacets([]), []);
});
