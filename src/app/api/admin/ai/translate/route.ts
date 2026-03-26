import { NextResponse } from "next/server";

export const runtime = "edge";

const NVIDIA_INVOKE_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

export async function POST(req: Request) {
  try {
    const { text, context = "Collector review for high-end resin figures collection" } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required for translation" }, { status: 400 });
    }

    const rawKey = process.env.NVIDIA_API_KEY;
    const apiKey = rawKey?.trim().replace(/[\u200B-\u200D\uFEFF]/g, '');

    if (!apiKey) {
        return NextResponse.json({ error: "NVIDIA_API_KEY not configured" }, { status: 500 });
    }

    const systemPrompt = `You are a professional multilingual curator for 5iveArts.
Translate the provided text into English, Italian, German, French, and Spanish.
Maintain the professional, enthusiastic tone of a high-end collector.

SCHEMA: { "en": "...", "it": "...", "de": "...", "fr": "...", "es": "..." }

RULES:
- Respond ONLY with raw JSON.
- DO NOT use markdown code blocks.
- Preserve technical terms like '0.025mm', 'resin', 'artisan'.
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
        max_tokens: 1024,
      })
    });

    if (!response.ok) {
        const error = await response.json();
        return NextResponse.json({ error: error.message || "Translation Failed" }, { status: response.status });
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content || "";
    
    // Extraction
    const firstCurly = content.indexOf('{');
    const lastCurly = content.lastIndexOf('}');
    
    if (firstCurly === -1) throw new Error("Invalid AI Response");
    
    const jsonStr = content.substring(firstCurly, lastCurly + 1);
    const translations = JSON.parse(jsonStr);

    return NextResponse.json(translations);

  } catch (error: any) {
    console.error("[AI Translate] Fatal Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
