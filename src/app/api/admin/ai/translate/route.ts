import { NextResponse } from "next/server";

export const runtime = "edge";

const NVIDIA_INVOKE_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

export async function POST(req: Request) {
  try {
    const { 
      text, 
      gender = "neutral",
      context = "Collector review for high-end resin figures collection",
      targetLanguages
    } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required for translation" }, { status: 400 });
    }

    const rawKey = process.env.NVIDIA_API_KEY;
    const apiKey = rawKey?.trim().replace(/[\u200B-\u200D\uFEFF]/g, '');

    if (!apiKey) {
      return NextResponse.json({ error: "NVIDIA_API_KEY not configured" }, { status: 500 });
    }

    const languages = [
      ["en", "it", "de", "fr", "es", "ru"], 
      ["tr", "pt", "nl", "ja", "ar", "pl"]
    ];

    const translateBatch = async (batch: string[]) => {
      const systemPrompt = `You are a professional multilingual curator for 5iveArts.
Translate the provided text into the following languages: ${batch.join(", ")}.
Maintain the professional, enthusiastic tone of a high-end collector.

GENDER: The reviewer is ${gender}. Use appropriate gendered inflections in languages that require it.

SCHEMA: { ${batch.map(l => `"${l}": "..."`).join(", ")} }

RULES:
- Respond ONLY with raw JSON.
- DO NOT use markdown code blocks.
- Preserve technical terms like '0.025mm', 'resin', 'artisan', '5iveArts'.
- CONTEXT: ${context}`;

      const response = await fetch(NVIDIA_INVOKE_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemma-3-27b-it",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Translate this review: "${text}"` }
          ],
          temperature: 0.1,
          max_tokens: 1536,
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Batch Translation Failed");
      }

      const result = await response.json();
      const content = result.choices[0]?.message?.content || "";
      const firstCurly = content.indexOf('{');
      const lastCurly = content.lastIndexOf('}');
      if (firstCurly === -1) throw new Error("Invalid Batch AI Response");
      return JSON.parse(content.substring(firstCurly, lastCurly + 1));
    };

    // If the client requests specific languages, process that batch only.
    // Otherwise, do the full parallel 12-language set.
    if (targetLanguages) {
      const result = await translateBatch(targetLanguages);
      return NextResponse.json(result);
    }

    const fullBatches = [
      ["en", "it", "de", "fr", "es", "ru"], 
      ["tr", "pt", "nl", "ja", "ar", "pl"]
    ];

    const [batch1, batch2] = await Promise.all([
      translateBatch(fullBatches[0]),
      translateBatch(fullBatches[1])
    ]);

    const translations = { ...batch1, ...batch2 };
    return NextResponse.json(translations);

  } catch (error: any) {
    console.error("[AI Translate] Fatal Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
