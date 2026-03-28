import { NextResponse } from "next/server";

export const runtime = "edge";

const NVIDIA_INVOKE_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

export async function POST(req: Request) {
  try {
    const { 
      text, 
      languages = ["en", "it", "de", "fr", "es", "ja", "ru", "tr", "pt", "nl", "pl", "ar"]
    } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required for translation" }, { status: 400 });
    }

    const rawKey = process.env.NVIDIA_API_KEY;
    const apiKey = rawKey?.trim().replace(/[\u200B-\u200D\uFEFF]/g, '');

    if (!apiKey) {
        return NextResponse.json({ error: "NVIDIA_API_KEY not configured" }, { status: 500 });
    }

    const systemPrompt = `You are a professional multilingual curator for 5iveArts.
Translate the provided text into the following languages: ${languages.join(", ")}.
Maintain the professional, high-end tone of a museum-grade collector.

SCHEMA:
{
  ${languages.map((l: string) => `"${l}": "..."`).join(",\n  ")}
}

RULES:
- Respond ONLY with raw JSON.
- DO NOT use markdown code blocks.
- Preserve technical terms or measurements.`;

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
          { role: "user", content: `Translate this: "${text}"` }
        ],
        temperature: 0.1,
        max_tokens: 4096,
      })
    });

    if (!response.ok) {
        const error = await response.json();
        return NextResponse.json({ error: error.message || "Batch Translation Failed" }, { status: response.status });
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content || "";
    
    // Extraction
    const firstCurly = content.indexOf('{');
    const lastCurly = content.lastIndexOf('}');
    
    if (firstCurly === -1) throw new Error("Invalid AI Response Structure");
    
    const jsonStr = content.substring(firstCurly, lastCurly + 1);
    const translations = JSON.parse(jsonStr);

    return NextResponse.json(translations);

  } catch (error: any) {
    console.error("[AI Batch Translate] Fatal Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
