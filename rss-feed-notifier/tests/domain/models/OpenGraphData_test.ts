/**
 * OpenGraphData Value Object のテスト
 */
import { expect, test } from 'vitest';
import { OpenGraphData } from '../../../src/domain/models/OpenGraphData.ts';

test('OpenGraphData.create() は有効なデータからOpenGraphDataを生成する', () => {
  const ogp = OpenGraphData.create({
    title: 'タイトル',
    description: '説明文',
    imageUrl: 'https://example.com/image.jpg',
  });

  expect(ogp.getTitle()).toBe('タイトル');
  expect(ogp.getDescription()).toBe('説明文');
  expect(ogp.hasImage()).toBe(true);
});

test('OpenGraphData.create() はタイトルがない場合も生成できる', () => {
  const ogp = OpenGraphData.create({});
  expect(ogp.getTitle()).toBeUndefined();
  expect(ogp.hasTitle()).toBe(false);
});

test('OpenGraphData.create() は説明がなくても生成できる', () => {
  const ogp = OpenGraphData.create({
    title: 'タイトル',
  });
  expect(ogp.getDescription()).toBeUndefined();
});

test('OpenGraphData.create() は画像がなくても生成できる', () => {
  const ogp = OpenGraphData.create({
    title: 'タイトル',
    description: '説明文',
  });
  expect(ogp.hasImage()).toBe(false);
});

test('OpenGraphData.hasImage() は画像がある場合trueを返す', () => {
  const ogpWithImage = OpenGraphData.create({
    title: 'タイトル',
    imageUrl: 'https://example.com/image.jpg',
  });
  const ogpWithoutImage = OpenGraphData.create({
    title: 'タイトル',
  });

  expect(ogpWithImage.hasImage()).toBe(true);
  expect(ogpWithoutImage.hasImage()).toBe(false);
});
