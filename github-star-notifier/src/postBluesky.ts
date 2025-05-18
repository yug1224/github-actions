import { abortable } from 'jsr:@std/async';
import AtprotoAPI, { AtpAgent, RichText } from 'npm:@atproto/api';

interface uploadRetry {
  $type?: 'blob';
  ref?: { $link: string };
  mimeType?: string;
  size?: number;
}
export default async ({
  agent,
  rt,
  title,
  link,
  description,
  mimeType,
  image,
}: {
  agent: AtpAgent;
  rt: RichText;
  title: string;
  link: string;
  description: string;
  mimeType?: string;
  image?: Uint8Array;
}) => {
  const thumb = await (async () => {
    if (!(image instanceof Uint8Array && typeof mimeType === 'string')) return;
    console.log(
      JSON.stringify(
        { imageByteLength: image.byteLength, encoding: mimeType },
        null,
        2,
      ),
    );
    const uploadRetry = async (retryCount = 0): Promise<uploadRetry | undefined> => {
      try {
        const c = new AbortController();
        // 10秒でタイムアウト
        setTimeout(() => {
          console.log('timeout');
          return c.abort();
        }, 1000 * 10 * (retryCount + 1));

        // 画像をアップロード
        const uploadedImage = await abortable(
          agent.uploadBlob(image, {
            encoding: mimeType,
          }),
          c.signal,
        );
        console.log('Success uploadImage');

        // 投稿オブジェクトに画像を追加
        return {
          $type: 'blob',
          ref: {
            $link: uploadedImage.data.blob.ref.toString(),
          },
          mimeType: uploadedImage.data.blob.mimeType,
          size: uploadedImage.data.blob.size,
        };
      } catch (e) {
        console.log(JSON.stringify(e, null, 2));
        // 3回リトライしてもダメならundefinedを返す
        if (retryCount >= 3) {
          console.log('Failed uploadImage');
          return;
        }

        // リトライ処理
        console.log(`Retry uploadImage`);
        return await uploadRetry(retryCount + 1);
      }
    };
    return await uploadRetry();
  })();

  const postObj:
    & Partial<AtprotoAPI.AppBskyFeedPost.Record>
    & Omit<AtprotoAPI.AppBskyFeedPost.Record, 'createdAt'> = {
      $type: 'app.bsky.feed.post',
      text: rt.text,
      facets: rt.facets,
      embed: {
        $type: 'app.bsky.embed.external',
        external: {
          uri: link,
          title,
          description: '', // 一時的にdescriptionは空にする
          thumb,
        },
      },
      langs: ['ja'],
    };

  console.log(JSON.stringify(postObj, null, 2));
  await agent.post(postObj);
  console.log('Success postBluesky');
};
