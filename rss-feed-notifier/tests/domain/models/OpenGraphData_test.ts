/**
 * OpenGraphData Value Object のテスト
 */
import { assertEquals } from 'jsr:@std/assert';
import { OpenGraphData } from '../../../src/domain/models/OpenGraphData.ts';

Deno.test('OpenGraphData.create() は有効なデータからOpenGraphDataを生成する', () => {
  const ogp = OpenGraphData.create({
    title: 'タイトル',
    description: '説明文',
    imageUrl: 'https://example.com/image.jpg',
  });

  assertEquals(ogp.getTitle(), 'タイトル');
  assertEquals(ogp.getDescription(), '説明文');
  assertEquals(ogp.hasImage(), true);
});

Deno.test('OpenGraphData.create() はタイトルがない場合も生成できる', () => {
  const ogp = OpenGraphData.create({});
  assertEquals(ogp.getTitle(), undefined);
  assertEquals(ogp.hasTitle(), false);
});

Deno.test('OpenGraphData.create() は説明がなくても生成できる', () => {
  const ogp = OpenGraphData.create({
    title: 'タイトル',
  });
  assertEquals(ogp.getDescription(), undefined);
});

Deno.test('OpenGraphData.create() は画像がなくても生成できる', () => {
  const ogp = OpenGraphData.create({
    title: 'タイトル',
    description: '説明文',
  });
  assertEquals(ogp.hasImage(), false);
});

Deno.test('OpenGraphData.hasImage() は画像がある場合trueを返す', () => {
  const ogpWithImage = OpenGraphData.create({
    title: 'タイトル',
    imageUrl: 'https://example.com/image.jpg',
  });
  const ogpWithoutImage = OpenGraphData.create({
    title: 'タイトル',
  });

  assertEquals(ogpWithImage.hasImage(), true);
  assertEquals(ogpWithoutImage.hasImage(), false);
});
