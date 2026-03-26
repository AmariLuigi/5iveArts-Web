import { NextResponse } from "next/server";

export const runtime = "edge";

const NVIDIA_INVOKE_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

export async function POST(req: Request) {
  const t_start = Date.now();
  console.log("[AI Forge] --- STREAMING NEXUS INITIATED ---");
  
  try {
    const body = await req.json();
    const { 
      prompt, 
      image, 
      existingFranchises = [], 
      existingSubcategories = [], 
      model = "google/gemma-3-27b-it" 
    } = body;

    const rawKey = process.env.NVIDIA_API_KEY;
    const apiKey = rawKey?.trim().replace(/[\u200B-\u200D\uFEFF]/g, '');

    if (!apiKey) {
      return NextResponse.json({ error: "NVIDIA_API_KEY not configured" }, { status: 500 });
    }

    const vaultContext = `
VAULT_FRANCHISES: ${existingFranchises.join(", ")}
VAULT_SUB_CATEGORIES: ${existingSubcategories.join(", ")}
    `.trim();

    const systemPrompt = `You are a 5iveArts curator. Identify the character and return JSON.
SCHEMA: { "title": "...", "description": "...", "categorical_tags": { "Franchise": "...", "Character": "...", "Series": "...", "Artist": "..." } }

RULES:
- Return ONLY valid JSON.
- No generic tags. Include Vault Lore if relevant:
${vaultContext}`;

    const messages = [
      { role: "system", content: systemPrompt }
    ];

    if (image) {
      messages.push({
        role: "user",
        // @ts-ignore - Vision format
        content: [
          { type: "text", text: prompt || "Analyze character." },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}` } }
        ]
      });
    } else {
      messages.push({ role: "user", content: prompt });
    }

    const response = await fetch(NVIDIA_INVOKE_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "text/event-stream"
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        max_tokens: 1024, // Enough room for detail, but still fast
        temperature: 0.20,
        top_p: 0.70,
        stream: true, 
      })
    });

    if (!response.ok) {
        return NextResponse.json({ error: "AI Provider Offline" }, { status: response.status });
    }

    // Pass the stream through to the client
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked",
      },
    });

  } catch (error: any) {
    console.error("[AI Forge] Fatal Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
