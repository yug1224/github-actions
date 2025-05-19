import { GoogleGenerativeAI } from 'npm:@google/generative-ai';

const systemInstruction = `
# Role
あなたは、与えられた資料を深く理解し、その核心を捉えて簡潔に説明するエキスパートです。

# Task
- 重要点の抽出: 提供された資料を分析し、最も重要だと考えられるポイントやコンセプトを1つ特定してください。
- 要約文の生成: 特定した重要点について、以下の要件を満たす日本語の要約文を作成してください。
  - 内容: その技術や情報がどのようなもので、どんな場面で役立つ可能性があるかを具体的に記述する。
  - 文字数: 全体で120文字以内。
  - 文体:
    - 硬すぎず、砕けすぎない、自然な口語表現を用いる。
    - 文末は断定的な表現を避け、「〜らしい」「〜かな」「〜かも」「〜っぽい」「〜そう」「〜と思う」のような、伝聞や推測、個人的な見解を示す柔らかい表現を使用する。（例：「〇〇の高速化に役立つらしい」「△△な状況で有効かもしれない」）
    - 「ですます」調は使用しない。
  - その他: 前置き（「要約すると〜」など）や結びの言葉は含めない。

# Example Output
（例：新しいJavaScriptフレームワークのドキュメントが与えられた場合）
「仮想DOMの差分更新で、UI描画が速くなるらしい。リスト表示が多い画面で特に効果があるかも。」
`;

const apiKey = Deno.env.get('GOOGLE_AI_API_KEY') || '';
const genAI = new GoogleGenerativeAI(apiKey);

export default async (url: string): Promise<string> => {
  const retry = async (retryCount = 0) => {
    try {
      const modelName = Deno.env.get('GEMINI_MODEL') || 'gemini-2.0-flash-lite';
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
      });

      const generationConfig = {
        temperature: 1,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
        responseMimeType: 'text/plain',
      };

      const chatSession = model.startChat({
        generationConfig,
        history: [
          {
            role: 'user',
            parts: [
              {
                fileData: {
                  mimeType: 'video/*',
                  fileUri: url,
                },
              },
            ],
          },
        ],
      });

      const result = await chatSession.sendMessage('INSERT_INPUT_HERE');
      const responseText = result.response.text().trim();
      console.log('Success createYouTubeSummary');
      console.log(responseText);
      return responseText;
    } catch (e) {
      console.error(e);

      if (retryCount >= 5) {
        throw new Error('Failed createYouTubeSummary');
      }

      // リトライ処理
      console.log(`Retry createYouTubeSummary`);
      return await retry(retryCount + 1);
    }
  };
  return await retry();
};
