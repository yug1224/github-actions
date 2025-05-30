import ogs from 'npm:open-graph-scraper';

export default async (url: string) => {
  const response = await fetch(url, {
    headers: { 'user-agent': 'Twitterbot' },
  });

  // OGP取得のリクエストに失敗した場合は空オブジェクトを返す
  if (!response.ok) {
    console.log('Failed getOgp');
    return {};
  }

  const html = await response.text();
  const { result } = await ogs({ html });
  console.log(JSON.stringify(result, null, 2));
  console.log('Success getOgp');
  return result;
};
