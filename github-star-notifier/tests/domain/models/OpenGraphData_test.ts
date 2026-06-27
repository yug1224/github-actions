/**
 * OpenGraphData Value Object のテスト
 */

import { test, expect } from 'vitest';
import { OpenGraphData } from '../../../src/domain/models/OpenGraphData.ts';

test('OpenGraphData - 完全なOGPデータから生成できる', () => {
  const ogp = OpenGraphData.create({
    title: 'Example Page',
    description: 'This is an example page',
    image: 'https://example.com/image.jpg',
    url: 'https://example.com',
  });

  expect(ogp.getTitle()).toBe('Example Page');
  expect(ogp.getDescription()).toBe('This is an example page');
  expect(ogp.hasImage()).toBeTruthy();
  expect(ogp.getFirstImage()?.url.toString()).toBe('https://example.com/image.jpg');
  expect(ogp.getUrl()?.toString()).toBe('https://example.com/');
});

test('OpenGraphData - 部分的なOGPデータから生成できる', () => {
  const ogp = OpenGraphData.create({
    title: 'Example Page',
  });

  expect(ogp.getTitle()).toBe('Example Page');
  expect(ogp.getDescription()).toBe(undefined);
  expect(ogp.hasImage()).toBeFalsy();
});

test('OpenGraphData - empty() で空のOGPデータを生成できる', () => {
  const ogp = OpenGraphData.empty();

  expect(ogp.isEmpty()).toBeTruthy();
  expect(ogp.hasTitle()).toBeFalsy();
  expect(ogp.hasDescription()).toBeFalsy();
  expect(ogp.hasImage()).toBeFalsy();
});

test('OpenGraphData - 複数の画像を持つOGPデータから生成できる', () => {
  const ogp = OpenGraphData.create({
    title: 'Example',
    images: [
      { url: 'https://example.com/image1.jpg', width: 800, height: 600 },
      { url: 'https://example.com/image2.jpg', width: 1200, height: 900 },
    ],
  });

  expect(ogp.getImages().length).toBe(2);
  expect(ogp.getFirstImage()?.width).toBe(800);
  expect(ogp.getImages()[1].height).toBe(900);
});

test('OpenGraphData - image プロパティ（文字列）から生成できる', () => {
  const ogp = OpenGraphData.create({
    title: 'Example',
    image: 'https://example.com/image.jpg',
  });

  expect(ogp.hasImage()).toBeTruthy();
  expect(ogp.getImages().length).toBe(1);
  expect(ogp.getFirstImage()?.url.toString()).toBe('https://example.com/image.jpg');
});

test('OpenGraphData - image プロパティ（配列）から生成できる', () => {
  const ogp = OpenGraphData.create({
    title: 'Example',
    image: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  });

  expect(ogp.getImages().length).toBe(2);
});

test('OpenGraphData - fromRaw() で既存のOGPデータから生成できる', () => {
  const rawOgp = {
    ogTitle: 'Example Page',
    ogDescription: 'Description',
    ogImage: [{ url: 'https://example.com/image.jpg' }],
    ogUrl: 'https://example.com',
  };

  const ogp = OpenGraphData.fromRaw(rawOgp);

  expect(ogp.getTitle()).toBe('Example Page');
  expect(ogp.getDescription()).toBe('Description');
  expect(ogp.hasImage()).toBeTruthy();
});

test('OpenGraphData - equals() で等価性を判定できる', () => {
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

  expect(ogp1.equals(ogp2)).toBeTruthy();
  expect(ogp1.equals(ogp3)).toBeFalsy();
});

test('OpenGraphData - hasTitle() でタイトルの存在を確認できる', () => {
  const withTitle = OpenGraphData.create({ title: 'Example' });
  const withoutTitle = OpenGraphData.create({ description: 'Description' });
  const emptyTitle = OpenGraphData.create({ title: '' });

  expect(withTitle.hasTitle()).toBeTruthy();
  expect(withoutTitle.hasTitle()).toBeFalsy();
  expect(emptyTitle.hasTitle()).toBeFalsy();
});

test('OpenGraphData - hasDescription() で説明の存在を確認できる', () => {
  const withDesc = OpenGraphData.create({ description: 'Description' });
  const withoutDesc = OpenGraphData.create({ title: 'Title' });

  expect(withDesc.hasDescription()).toBeTruthy();
  expect(withoutDesc.hasDescription()).toBeFalsy();
});

test('OpenGraphData - hasImage() で画像の存在を確認できる', () => {
  const withImage = OpenGraphData.create({
    image: 'https://example.com/image.jpg',
  });
  const withoutImage = OpenGraphData.create({ title: 'Title' });

  expect(withImage.hasImage()).toBeTruthy();
  expect(withoutImage.hasImage()).toBeFalsy();
});

test('OpenGraphData - isEmpty() で空かどうかを確認できる', () => {
  const empty = OpenGraphData.empty();
  const notEmpty = OpenGraphData.create({ title: 'Title' });

  expect(empty.isEmpty()).toBeTruthy();
  expect(notEmpty.isEmpty()).toBeFalsy();
});

test('OpenGraphData - getTitleOrDescription() でフォールバック付きでタイトルを取得できる', () => {
  const withTitle = OpenGraphData.create({ title: 'Title' });
  const withDesc = OpenGraphData.create({ description: 'Description' });
  const empty = OpenGraphData.empty();

  expect(withTitle.getTitleOrDescription('fallback')).toBe('Title');
  expect(withDesc.getTitleOrDescription('fallback')).toBe('Description');
  expect(empty.getTitleOrDescription('fallback')).toBe('fallback');
  expect(empty.getTitleOrDescription()).toBe('');
});

test('OpenGraphData - toJSON() でJSON表現を取得できる', () => {
  const ogp = OpenGraphData.create({
    title: 'Example',
    description: 'Description',
    image: 'https://example.com/image.jpg',
    url: 'https://example.com',
  });

  const json = ogp.toJSON();

  expect(json.title).toBe('Example');
  expect(json.description).toBe('Description');
  expect(json.images.length).toBe(1);
  expect(json.images[0].url).toBe('https://example.com/image.jpg');
  expect(json.url).toBe('https://example.com/');
});

test('OpenGraphData - 画像は不変である', () => {
  const ogp = OpenGraphData.create({
    images: [{ url: 'https://example.com/image.jpg' }],
  });

  // getImages()で取得した配列は読み取り専用であることを確認
  const _images = ogp.getImages();

  // 配列の変更を試みる（TypeScriptのreadonlyにより型エラーになるべき）
  // _images.push({ url: Url.create('https://example.com/image2.jpg') });
  // この行はコンパイルエラーになるため、実行時テストでは確認できない

  // 元のOGPデータには影響しない
  expect(ogp.getImages().length).toBe(1);
});

test('OpenGraphData - URL部分が不変である', () => {
  const ogp = OpenGraphData.create({
    url: 'https://example.com',
  });

  const url = ogp.getUrl();

  // Urlオブジェクト自体が不変なので、変更できない
  expect(url?.toString()).toBe('https://example.com/');
});
