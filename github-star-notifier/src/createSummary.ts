import { GoogleGenerativeAI } from 'npm:@google/generative-ai';
import { GEMINI_CONFIG, RETRY_CONFIG } from './config/constants.ts';
import { retry } from './utils/retry.ts';

const systemInstruction = `
# Role
あなたは、与えられた技術文書（APIドキュメント、チュートリアル、論文など）を深く理解し、その核心を捉えて簡潔に説明するエキスパートです。

# Task
- 重要点の抽出: 提供された技術文書を分析し、最も重要だと考えられる技術的なポイントやコンセプトを1つ特定してください。
- 要約文の生成: 特定した重要点について、以下の要件を満たす日本語の要約文を作成してください。
  - 内容: その技術や情報がどのようなもので、どんな場面で役立つ可能性があるかを具体的に記述する。
  - 文字数: 全体で100文字以内。
  - 文体:
    - 硬すぎず、砕けすぎない、自然な口語表現を用いる。
    - 文頭は「Reactは〜」のように、対象の名前を含める。
    - 文末は断定的な表現を避け、「〜らしい」「〜かな」「〜かも」「〜っぽい」「〜そう」「〜と思う」のような、伝聞や推測、個人的な見解を示す柔らかい表現を使用する。（例：「〇〇の高速化に役立つらしい」「△△な状況で有効かもしれない」）
    - 「ですます」調は使用しない。
  - その他: 前置き（「要約すると〜」など）や結びの言葉は含めない。

# Example Output
- facebook/react のドキュメントが与えられた場合: Reactは状態変化で必要な部分だけを効率的に更新する宣言的UIを、コンポーネントの組み合わせで作れるらしい。大規模UI構築に便利そう。
- vitejs/vite のドキュメントが与えられた場合: ViteはネイティブESモジュールで高速な開発サーバーを提供するビルドツールらしい。HMRが速く開発体験の向上に役立つかも。
- oxc-project/oxc のドキュメントが与えられた場合: OxcはRust製のJS/TSツール群で、パーサーやリンターを提供し既存ツールより大幅な高速化を目指すっぽい。
`;

export default async (
  textContent: string,
  apiKey: string,
  modelName: string,
  url?: string,
): Promise<string> => {
  if (!textContent || textContent.trim() === '') {
    console.warn('Input textContent is empty for summary. Returning empty string.');
    return '';
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  return await retry(
    async () => {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
      });

      const generationConfig = {
        temperature: GEMINI_CONFIG.TEMPERATURE,
        topP: GEMINI_CONFIG.TOP_P,
        topK: GEMINI_CONFIG.TOP_K,
        maxOutputTokens: GEMINI_CONFIG.MAX_OUTPUT_TOKENS,
        responseMimeType: GEMINI_CONFIG.RESPONSE_MIME_TYPE,
      };

      // URLのみをプロンプトとして使用
      const prompt = url || textContent;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });

      const responseText = result.response.text().trim();
      console.log('Success createSummary');
      console.log(responseText);
      return responseText;
    },
    {
      maxRetries: RETRY_CONFIG.SUMMARY_MAX_RETRIES,
      onRetry: (error, attempt) => {
        console.log(`Retry createSummary (attempt ${attempt}):`, error);
      },
    },
  );
};
