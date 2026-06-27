import sharp from 'sharp';

export default async (url: string, _timestamp: number) => {
  try {
    const fetchRetry = async (url: string, retryCount = 0): Promise<Response | undefined> => {
      const response = await fetch(url);
      const contentType = response.headers.get('content-type') || '';

      // 画像が取得できなかった場合
      if (!response.ok || !contentType?.includes('image')) {
        if (retryCount >= 5) return;

        // リトライ処理
        console.log(`Retry getImage`);
        return await fetchRetry(url, retryCount + 1);
      }
      return response;
    };
    const response = await fetchRetry(url);
    if (!response) {
      console.log('Failed getImage');
      return {};
    }
    const buffer = await response.arrayBuffer();

    const resizeRetry = async ({
      buffer,
      retryCount = 0,
    }: {
      buffer: ArrayBuffer;
      retryCount?: number;
    }): Promise<{ mimeType?: string; resizedImage?: Uint8Array }> => {
      const maxWidth = 2000;
      const maxHeight = 2000;
      const maxByteLength = 976.56 * 1000;
      const mimeType = 'image/avif';
      const quality = 100 - retryCount * 2;

      const resizedBuffer = await sharp(Buffer.from(buffer))
        .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true })
        .avif({ quality })
        .toBuffer();

      const resizedImage = new Uint8Array(resizedBuffer);

      console.log('resizedImage.byteLength', resizedImage.byteLength);
      if (resizedImage.byteLength > maxByteLength) {
        // リトライ処理
        console.log('Retry resizedImage');
        return await resizeRetry({ buffer, retryCount: retryCount + 1 });
      }
      return { mimeType, resizedImage };
    };
    const { mimeType, resizedImage } = await resizeRetry({ buffer });

    console.log('Success resizeImage');
    return {
      mimeType,
      resizedImage,
    };
  } catch (e) {
    console.error(e);

    // 画像のリサイズに失敗した場合は空オブジェクトを返す
    console.log('Failed resizeImage');
    return {};
  }
};
