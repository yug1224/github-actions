/**
 * エラークラスのテスト
 */

import { assertEquals, assertInstanceOf } from 'jsr:@std/assert';
import { AppError, AuthError, FileNotFoundError, NetworkError, UploadError } from '../../src/utils/errors.ts';

Deno.test('AppError - 基本的な生成', () => {
  const error = new AppError('Test error', 'UNKNOWN_ERROR');
  assertEquals(error.message, 'Test error');
  assertEquals(error.code, 'UNKNOWN_ERROR');
  assertEquals(error.name, 'AppError');
});

Deno.test('AppError - コンテキスト情報を含む', () => {
  const context = { userId: '123', action: 'test' };
  const error = new AppError('Test error', 'VALIDATION_ERROR', context);
  assertEquals(error.context, context);
  assertEquals(error.context?.userId, '123');
  assertEquals(error.context?.action, 'test');
});

Deno.test('AppError - 原因となるエラーを含む', () => {
  const cause = new Error('Original error');
  const error = new AppError('Wrapped error', 'UNKNOWN_ERROR', undefined, cause);
  assertEquals(error.cause, cause);
});

Deno.test('AppError - JSON化', () => {
  const error = new AppError('Test error', 'UNKNOWN_ERROR', { test: 'value' });
  const json = error.toJSON();
  assertEquals(json.name, 'AppError');
  assertEquals(json.message, 'Test error');
  assertEquals(json.code, 'UNKNOWN_ERROR');
  assertEquals((json.context as Record<string, unknown>)?.test, 'value');
});

Deno.test('NetworkError - 基本的な生成', () => {
  const error = new NetworkError('https://example.com', 404);
  assertInstanceOf(error, NetworkError);
  assertInstanceOf(error, AppError);
  assertEquals(error.message, 'Network request failed: https://example.com');
  assertEquals(error.code, 'NETWORK_ERROR');
  assertEquals(error.name, 'NetworkError');
  assertEquals(error.context?.url, 'https://example.com');
  assertEquals(error.context?.statusCode, 404);
});

Deno.test('NetworkError - ステータスコードなし', () => {
  const error = new NetworkError('https://example.com');
  assertEquals(error.context?.url, 'https://example.com');
  assertEquals(error.context?.statusCode, undefined);
});

Deno.test('AuthError - サービス名を含む', () => {
  const error = new AuthError('Bluesky');
  assertInstanceOf(error, AuthError);
  assertInstanceOf(error, AppError);
  assertEquals(error.message, 'Authentication failed for Bluesky');
  assertEquals(error.code, 'AUTH_ERROR');
  assertEquals(error.name, 'AuthError');
  assertEquals(error.context?.service, 'Bluesky');
});

Deno.test('AuthError - 原因となるエラーを含む', () => {
  const cause = new Error('Invalid credentials');
  const error = new AuthError('GitHub', cause);
  assertEquals(error.cause, cause);
  assertEquals(error.context?.service, 'GitHub');
});

Deno.test('FileNotFoundError - ファイルパスを含む', () => {
  const error = new FileNotFoundError('/path/to/file.txt');
  assertInstanceOf(error, FileNotFoundError);
  assertInstanceOf(error, AppError);
  assertEquals(error.message, 'File not found: /path/to/file.txt');
  assertEquals(error.code, 'FILE_NOT_FOUND');
  assertEquals(error.name, 'FileNotFoundError');
  assertEquals(error.context?.filePath, '/path/to/file.txt');
});

Deno.test('UploadError - カスタムメッセージとコンテキスト', () => {
  const error = new UploadError('Failed to upload image', {
    size: 1024,
    format: 'png',
  });
  assertInstanceOf(error, UploadError);
  assertInstanceOf(error, AppError);
  assertEquals(error.message, 'Failed to upload image');
  assertEquals(error.code, 'UPLOAD_ERROR');
  assertEquals(error.name, 'UploadError');
  assertEquals(error.context?.size, 1024);
  assertEquals(error.context?.format, 'png');
});

Deno.test('エラーのJSON化 - 原因を含む', () => {
  const cause = new Error('Original error');
  const error = new NetworkError('https://example.com', 500, cause);
  const json = error.toJSON();
  assertEquals(json.cause, 'Original error');
});

Deno.test('エラーのJSON化 - スタックトレースを含む', () => {
  const error = new AppError('Test error', 'UNKNOWN_ERROR');
  const json = error.toJSON();
  assertEquals(typeof json.stack, 'string');
});
