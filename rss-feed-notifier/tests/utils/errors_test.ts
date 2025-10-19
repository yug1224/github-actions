/**
 * エラークラスのテスト
 */
import { assertEquals, assertInstanceOf } from 'jsr:@std/assert';
import {
  AppError,
  AuthError,
  FileNotFoundError,
  ImageProcessError,
  NetworkError,
  UploadError,
} from '../../src/utils/errors.ts';

Deno.test('AppError は基本的なエラー情報を持つ', () => {
  const error = new AppError(
    'テストエラー',
    'UNKNOWN_ERROR',
    { key: 'value' },
  );

  assertEquals(error.message, 'テストエラー');
  assertEquals(error.code, 'UNKNOWN_ERROR');
  assertEquals(error.context, { key: 'value' });
  assertEquals(error.name, 'AppError');
});

Deno.test('AppError はcauseを持つことができる', () => {
  const cause = new Error('元のエラー');
  const error = new AppError('ラップされたエラー', 'UNKNOWN_ERROR', {}, cause);

  assertEquals(error.cause, cause);
});

Deno.test('AppError.toJSON() はエラー情報をJSONとして返す', () => {
  const error = new AppError('テストエラー', 'UNKNOWN_ERROR', { key: 'value' });
  const json = error.toJSON();

  assertEquals(json.name, 'AppError');
  assertEquals(json.message, 'テストエラー');
  assertEquals(json.code, 'UNKNOWN_ERROR');
  assertEquals(json.context, { key: 'value' });
});

Deno.test('FileNotFoundError はファイルパスを持つ', () => {
  const error = new FileNotFoundError('/path/to/file.txt');

  assertEquals(error.message.includes('/path/to/file.txt'), true);
  assertEquals(error.code, 'FILE_NOT_FOUND');
  assertEquals(error.context?.filePath, '/path/to/file.txt');
  assertEquals(error.name, 'FileNotFoundError');
  assertInstanceOf(error, AppError);
});

Deno.test('NetworkError はURL情報を持つ', () => {
  const error = new NetworkError('https://example.com', 404);

  assertEquals(error.message.includes('https://example.com'), true);
  assertEquals(error.code, 'NETWORK_ERROR');
  assertEquals(error.context?.url, 'https://example.com');
  assertEquals(error.context?.statusCode, 404);
  assertEquals(error.name, 'NetworkError');
  assertInstanceOf(error, AppError);
});

Deno.test('NetworkError はステータスコードなしでも作成できる', () => {
  const error = new NetworkError('https://example.com');

  assertEquals(error.context?.statusCode, undefined);
});

Deno.test('ImageProcessError はメッセージとコンテキストを持つ', () => {
  const error = new ImageProcessError('画像処理失敗', { size: 1000 });

  assertEquals(error.message, '画像処理失敗');
  assertEquals(error.code, 'IMAGE_PROCESS_ERROR');
  assertEquals(error.context?.size, 1000);
  assertEquals(error.name, 'ImageProcessError');
  assertInstanceOf(error, AppError);
});

Deno.test('UploadError はメッセージとコンテキストを持つ', () => {
  const error = new UploadError('アップロード失敗', { fileName: 'test.jpg' });

  assertEquals(error.message, 'アップロード失敗');
  assertEquals(error.code, 'UPLOAD_ERROR');
  assertEquals(error.context?.fileName, 'test.jpg');
  assertEquals(error.name, 'UploadError');
  assertInstanceOf(error, AppError);
});

Deno.test('AuthError はサービス名を持つ', () => {
  const error = new AuthError('Bluesky');

  assertEquals(error.message.includes('Bluesky'), true);
  assertEquals(error.code, 'AUTH_ERROR');
  assertEquals(error.context?.service, 'Bluesky');
  assertEquals(error.name, 'AuthError');
  assertInstanceOf(error, AppError);
});
