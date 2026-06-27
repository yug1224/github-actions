/**
 * エラークラスのテスト
 */
import { expect, test } from 'vitest';
import {
  AppError,
  AuthError,
  FileNotFoundError,
  ImageProcessError,
  NetworkError,
  UploadError,
} from '../../src/utils/errors.ts';

test('AppError は基本的なエラー情報を持つ', () => {
  const error = new AppError('テストエラー', 'UNKNOWN_ERROR', { key: 'value' });

  expect(error.message).toBe('テストエラー');
  expect(error.code).toBe('UNKNOWN_ERROR');
  expect(error.context).toEqual({ key: 'value' });
  expect(error.name).toBe('AppError');
});

test('AppError はcauseを持つことができる', () => {
  const cause = new Error('元のエラー');
  const error = new AppError('ラップされたエラー', 'UNKNOWN_ERROR', {}, cause);

  expect(error.cause).toBe(cause);
});

test('AppError.toJSON() はエラー情報をJSONとして返す', () => {
  const error = new AppError('テストエラー', 'UNKNOWN_ERROR', { key: 'value' });
  const json = error.toJSON();

  expect(json.name).toBe('AppError');
  expect(json.message).toBe('テストエラー');
  expect(json.code).toBe('UNKNOWN_ERROR');
  expect(json.context).toEqual({ key: 'value' });
});

test('FileNotFoundError はファイルパスを持つ', () => {
  const error = new FileNotFoundError('/path/to/file.txt');

  expect(error.message).toContain('/path/to/file.txt');
  expect(error.code).toBe('FILE_NOT_FOUND');
  expect(error.context?.filePath).toBe('/path/to/file.txt');
  expect(error.name).toBe('FileNotFoundError');
  expect(error).toBeInstanceOf(AppError);
});

test('NetworkError はURL情報を持つ', () => {
  const error = new NetworkError('https://example.com', 404);

  expect(error.message).toContain('https://example.com');
  expect(error.code).toBe('NETWORK_ERROR');
  expect(error.context?.url).toBe('https://example.com');
  expect(error.context?.statusCode).toBe(404);
  expect(error.name).toBe('NetworkError');
  expect(error).toBeInstanceOf(AppError);
});

test('NetworkError はステータスコードなしでも作成できる', () => {
  const error = new NetworkError('https://example.com');

  expect(error.context?.statusCode).toBeUndefined();
});

test('ImageProcessError はメッセージとコンテキストを持つ', () => {
  const error = new ImageProcessError('画像処理失敗', { size: 1000 });

  expect(error.message).toBe('画像処理失敗');
  expect(error.code).toBe('IMAGE_PROCESS_ERROR');
  expect(error.context?.size).toBe(1000);
  expect(error.name).toBe('ImageProcessError');
  expect(error).toBeInstanceOf(AppError);
});

test('UploadError はメッセージとコンテキストを持つ', () => {
  const error = new UploadError('アップロード失敗', { fileName: 'test.jpg' });

  expect(error.message).toBe('アップロード失敗');
  expect(error.code).toBe('UPLOAD_ERROR');
  expect(error.context?.fileName).toBe('test.jpg');
  expect(error.name).toBe('UploadError');
  expect(error).toBeInstanceOf(AppError);
});

test('AuthError はサービス名を持つ', () => {
  const error = new AuthError('Bluesky');

  expect(error.message).toContain('Bluesky');
  expect(error.code).toBe('AUTH_ERROR');
  expect(error.context?.service).toBe('Bluesky');
  expect(error.name).toBe('AuthError');
  expect(error).toBeInstanceOf(AppError);
});
