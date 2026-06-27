/**
 * エラークラスのテスト
 */

import { test, expect } from 'vitest';
import { AppError, AuthError, FileNotFoundError, NetworkError, UploadError } from '../../src/utils/errors.ts';

test('AppError - 基本的な生成', () => {
  const error = new AppError('Test error', 'UNKNOWN_ERROR');
  expect(error.message).toBe('Test error');
  expect(error.code).toBe('UNKNOWN_ERROR');
  expect(error.name).toBe('AppError');
});

test('AppError - コンテキスト情報を含む', () => {
  const context = { userId: '123', action: 'test' };
  const error = new AppError('Test error', 'VALIDATION_ERROR', context);
  expect(error.context).toBe(context);
  expect(error.context?.userId).toBe('123');
  expect(error.context?.action).toBe('test');
});

test('AppError - 原因となるエラーを含む', () => {
  const cause = new Error('Original error');
  const error = new AppError('Wrapped error', 'UNKNOWN_ERROR', undefined, cause);
  expect(error.cause).toBe(cause);
});

test('AppError - JSON化', () => {
  const error = new AppError('Test error', 'UNKNOWN_ERROR', { test: 'value' });
  const json = error.toJSON();
  expect(json.name).toBe('AppError');
  expect(json.message).toBe('Test error');
  expect(json.code).toBe('UNKNOWN_ERROR');
  expect((json.context as Record<string, unknown>)?.test).toBe('value');
});

test('NetworkError - 基本的な生成', () => {
  const error = new NetworkError('https://example.com', 404);
  expect(error).toBeInstanceOf(NetworkError);
  expect(error).toBeInstanceOf(AppError);
  expect(error.message).toBe('Network request failed: https://example.com');
  expect(error.code).toBe('NETWORK_ERROR');
  expect(error.name).toBe('NetworkError');
  expect(error.context?.url).toBe('https://example.com');
  expect(error.context?.statusCode).toBe(404);
});

test('NetworkError - ステータスコードなし', () => {
  const error = new NetworkError('https://example.com');
  expect(error.context?.url).toBe('https://example.com');
  expect(error.context?.statusCode).toBe(undefined);
});

test('AuthError - サービス名を含む', () => {
  const error = new AuthError('Bluesky');
  expect(error).toBeInstanceOf(AuthError);
  expect(error).toBeInstanceOf(AppError);
  expect(error.message).toBe('Authentication failed for Bluesky');
  expect(error.code).toBe('AUTH_ERROR');
  expect(error.name).toBe('AuthError');
  expect(error.context?.service).toBe('Bluesky');
});

test('AuthError - 原因となるエラーを含む', () => {
  const cause = new Error('Invalid credentials');
  const error = new AuthError('GitHub', cause);
  expect(error.cause).toBe(cause);
  expect(error.context?.service).toBe('GitHub');
});

test('FileNotFoundError - ファイルパスを含む', () => {
  const error = new FileNotFoundError('/path/to/file.txt');
  expect(error).toBeInstanceOf(FileNotFoundError);
  expect(error).toBeInstanceOf(AppError);
  expect(error.message).toBe('File not found: /path/to/file.txt');
  expect(error.code).toBe('FILE_NOT_FOUND');
  expect(error.name).toBe('FileNotFoundError');
  expect(error.context?.filePath).toBe('/path/to/file.txt');
});

test('UploadError - カスタムメッセージとコンテキスト', () => {
  const error = new UploadError('Failed to upload image', {
    size: 1024,
    format: 'png',
  });
  expect(error).toBeInstanceOf(UploadError);
  expect(error).toBeInstanceOf(AppError);
  expect(error.message).toBe('Failed to upload image');
  expect(error.code).toBe('UPLOAD_ERROR');
  expect(error.name).toBe('UploadError');
  expect(error.context?.size).toBe(1024);
  expect(error.context?.format).toBe('png');
});

test('エラーのJSON化 - 原因を含む', () => {
  const cause = new Error('Original error');
  const error = new NetworkError('https://example.com', 500, cause);
  const json = error.toJSON();
  expect(json.cause).toBe('Original error');
});

test('エラーのJSON化 - スタックトレースを含む', () => {
  const error = new AppError('Test error', 'UNKNOWN_ERROR');
  const json = error.toJSON();
  expect(typeof json.stack).toBe('string');
});
