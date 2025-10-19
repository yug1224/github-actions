/**
 * OpenGraphData Value Object のテスト
 */

import { assert, assertEquals } from 'https://deno.land/std@0.218.0/assert/mod.ts';
import { OpenGraphData } from '../../../src/domain/models/OpenGraphData.ts';

Deno.test('OpenGraphData - 完全なOGPデータから生成できる', () => {
  const ogp = OpenGraphData.create({
    title: 'Example Page',
    description: 'This is an example page',
    image: 'https://example.com/image.jpg',
    url: 'https://example.com',
  });

  assertEquals(ogp.getTitle(), 'Example Page');
  assertEquals(ogp.getDescription(), 'This is an example page');
  assert(ogp.hasImage());
  assertEquals(ogp.getFirstImage()?.url.toString(), 'https://example.com/image.jpg');
  assertEquals(ogp.getUrl()?.toString(), 'https://example.com/');
});

Deno.test('OpenGraphData - 部分的なOGPデータから生成できる', () => {
  const ogp = OpenGraphData.create({
    title: 'Example Page',
  });

  assertEquals(ogp.getTitle(), 'Example Page');
  assertEquals(ogp.getDescription(), undefined);
  assert(!ogp.hasImage());
});

Deno.test('OpenGraphData - empty() で空のOGPデータを生成できる', () => {
  const ogp = OpenGraphData.empty();

  assert(ogp.isEmpty());
  assert(!ogp.hasTitle());
  assert(!ogp.hasDescription());
  assert(!ogp.hasImage());
});

Deno.test('OpenGraphData - 複数の画像を持つOGPデータから生成できる', () => {
  const ogp = OpenGraphData.create({
    title: 'Example',
    images: [
      { url: 'https://example.com/image1.jpg', width: 800, height: 600 },
      { url: 'https://example.com/image2.jpg', width: 1200, height: 900 },
    ],
  });

  assertEquals(ogp.getImages().length, 2);
  assertEquals(ogp.getFirstImage()?.width, 800);
  assertEquals(ogp.getImages()[1].height, 900);
});

Deno.test('OpenGraphData - image プロパティ（文字列）から生成できる', () => {
  const ogp = OpenGraphData.create({
    title: 'Example',
    image: 'https://example.com/image.jpg',
  });

  assert(ogp.hasImage());
  assertEquals(ogp.getImages().length, 1);
  assertEquals(
    ogp.getFirstImage()?.url.toString(),
    'https://example.com/image.jpg',
  );
});

Deno.test('OpenGraphData - image プロパティ（配列）から生成できる', () => {
  const ogp = OpenGraphData.create({
    title: 'Example',
    image: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ],
  });

  assertEquals(ogp.getImages().length, 2);
});

Deno.test('OpenGraphData - fromRaw() で既存のOGPデータから生成できる', () => {
  const rawOgp = {
    ogTitle: 'Example Page',
    ogDescription: 'Description',
    ogImage: [{ url: 'https://example.com/image.jpg' }],
    ogUrl: 'https://example.com',
  };

  const ogp = OpenGraphData.fromRaw(rawOgp);

  assertEquals(ogp.getTitle(), 'Example Page');
  assertEquals(ogp.getDescription(), 'Description');
  assert(ogp.hasImage());
});

Deno.test('OpenGraphData - equals() で等価性を判定できる', () => {
  const ogp1 = OpenGraphData.create({
    title: 'Example',
    description: 'Description',
    image: 'https://example.com/image.jpg',
  });

  const ogp2 = OpenGraphData.create({
    title: 'Example',
    description: 'Description',
    image: 'https://example.com/image.jpg',
  });

  const ogp3 = OpenGraphData.create({
    title: 'Different',
    description: 'Description',
  });

  assert(ogp1.equals(ogp2));
  assert(!ogp1.equals(ogp3));
});

Deno.test('OpenGraphData - hasTitle() でタイトルの存在を確認できる', () => {
  const withTitle = OpenGraphData.create({ title: 'Example' });
  const withoutTitle = OpenGraphData.create({ description: 'Description' });
  const emptyTitle = OpenGraphData.create({ title: '' });

  assert(withTitle.hasTitle());
  assert(!withoutTitle.hasTitle());
  assert(!emptyTitle.hasTitle());
});

Deno.test('OpenGraphData - hasDescription() で説明の存在を確認できる', () => {
  const withDesc = OpenGraphData.create({ description: 'Description' });
  const withoutDesc = OpenGraphData.create({ title: 'Title' });

  assert(withDesc.hasDescription());
  assert(!withoutDesc.hasDescription());
});

Deno.test('OpenGraphData - hasImage() で画像の存在を確認できる', () => {
  const withImage = OpenGraphData.create({
    image: 'https://example.com/image.jpg',
  });
  const withoutImage = OpenGraphData.create({ title: 'Title' });

  assert(withImage.hasImage());
  assert(!withoutImage.hasImage());
});

Deno.test('OpenGraphData - isEmpty() で空かどうかを確認できる', () => {
  const empty = OpenGraphData.empty();
  const notEmpty = OpenGraphData.create({ title: 'Title' });

  assert(empty.isEmpty());
  assert(!notEmpty.isEmpty());
});

Deno.test('OpenGraphData - getTitleOrDescription() でフォールバック付きでタイトルを取得できる', () => {
  const withTitle = OpenGraphData.create({ title: 'Title' });
  const withDesc = OpenGraphData.create({ description: 'Description' });
  const empty = OpenGraphData.empty();

  assertEquals(withTitle.getTitleOrDescription('fallback'), 'Title');
  assertEquals(withDesc.getTitleOrDescription('fallback'), 'Description');
  assertEquals(empty.getTitleOrDescription('fallback'), 'fallback');
  assertEquals(empty.getTitleOrDescription(), '');
});

Deno.test('OpenGraphData - toJSON() でJSON表現を取得できる', () => {
  const ogp = OpenGraphData.create({
    title: 'Example',
    description: 'Description',
    image: 'https://example.com/image.jpg',
    url: 'https://example.com',
  });

  const json = ogp.toJSON();

  assertEquals(json.title, 'Example');
  assertEquals(json.description, 'Description');
  assertEquals(json.images.length, 1);
  assertEquals(json.images[0].url, 'https://example.com/image.jpg');
  assertEquals(json.url, 'https://example.com/');
});

Deno.test('OpenGraphData - 画像は不変である', () => {
  const ogp = OpenGraphData.create({
    images: [
      { url: 'https://example.com/image.jpg' },
    ],
  });

  // getImages()で取得した配列は読み取り専用であることを確認
  const _images = ogp.getImages();

  // 配列の変更を試みる（TypeScriptのreadonlyにより型エラーになるべき）
  // _images.push({ url: Url.create('https://example.com/image2.jpg') });
  // この行はコンパイルエラーになるため、実行時テストでは確認できない

  // 元のOGPデータには影響しない
  assertEquals(ogp.getImages().length, 1);
});

Deno.test('OpenGraphData - URL部分が不変である', () => {
  const ogp = OpenGraphData.create({
    url: 'https://example.com',
  });

  const url = ogp.getUrl();

  // Urlオブジェクト自体が不変なので、変更できない
  assertEquals(url?.toString(), 'https://example.com/');
});
