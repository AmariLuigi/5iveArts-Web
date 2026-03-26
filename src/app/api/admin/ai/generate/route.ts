import { NextResponse } from "next/server";

export const runtime = "edge";

const NVIDIA_INVOKE_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

const BRAND_STATIC_PARTS = {
  material: "High-Resolution Industrial Resin (0.025mm layer height)",
  painting: "Artisan hand-painted with professional acrylics and airbrush techniques, finished with a museum-quality UV-resistant varnish.",
  disclaimer: "Note: Model images are digital renders. The final physical product is hand-painted by our artisans to match the render as closely as artistically possible, with unique artisan variations."
};

export async function POST(req: Request) {
  const t_start = Date.now();
  console.log("[AI Forge] --- SHIELD INITIATED ---");
  
  try {
    const body = await req.json();
    const t_parsed = Date.now();
    
    const { 
      prompt, 
      image, 
      existingFranchises = [], 
      existingSubcategories = [], 
      model = "moonshotai/kimi-k2.5" 
    } = body;

    console.log(`[AI Forge] Latency: JSON Parsed (+${t_parsed - t_start}ms)`);
    console.log(`[AI Forge] Telemetry: ImageSize=${image?.length || 0}`);
    
    const rawKey = process.env.NVIDIA_API_KEY;
    const apiKey = rawKey?.trim().replace(/[\u200B-\u200D\uFEFF]/g, '');

    if (!apiKey) {
      return NextResponse.json({ error: "NVIDIA_API_KEY not configured" }, { status: 500 });
    }

    // Vault Data Serialization for Prompt Injection
    const vaultContext = `
VAULT_FRANCHISES: ${existingFranchises.join(", ")}
VAULT_SUB_CATEGORIES: ${existingSubcategories.join(", ")}
    `.trim();

    // Construct the system prompt to force JSON and brand alignment
    const systemPrompt = `You are a curator for "5iveArts" (resin statues).
Goal: Map character to hierarchy { Franchise, Character, Series, Artist }.

RULES:
- Respond ONLY with valid JSON.
- For categorical_tags, use Category:Subcategory mapping.
- NO generic tags (Material, Color, etc).
- Use Vault strings if available:
${vaultContext}

JSON SCHEMA: { 
  "title": "...", 
  "description": "...", 
  "categorical_tags": { 
    "Franchise": "...", 
    "Character": "...", 
    "Series": "...", 
    "Artist": "..."
  }
}`;

    const messages = [
      { role: "system", content: systemPrompt }
    ];

    if (image) {
      messages.push({
        role: "user",
        // @ts-ignore - NVIDIA/OpenAI vision format
        content: [
          { type: "text", text: prompt || "Analyze this figure." },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}` } }
        ]
      });
    } else {
      messages.push({ role: "user", content: prompt });
    }

    // CALL PROVIDER
    const t_before_fetch = Date.now();
    console.log(`[AI Forge] Calling NVIDIA NIM: ${model}...`);

    const response = await fetch(NVIDIA_INVOKE_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        max_tokens: 1500,
        temperature: 0.7,
        top_p: 0.9,
        stream: false,
        chat_template_kwargs: { thinking: false },
      })
    });

    const t_after_fetch = Date.now();
    console.log(`[AI Forge] NVIDIA Response received in ${t_after_fetch - t_before_fetch}ms`);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`[AI Forge] NVIDIA ERROR: ${response.status}`, errorData);
        return NextResponse.json({ error: `AI Provider Error: ${response.status}`, details: errorData }, { status: response.status });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // EXTRACTION
    const firstCurly = content.indexOf('{');
    const lastCurly = content.lastIndexOf('}');
    
    if (firstCurly === -1 || lastCurly === -1) {
      console.error("[AI Forge] No JSON found in response:", content);
      return NextResponse.json({ error: "No JSON found" }, { status: 500 });
    }

    const jsonStr = content.substring(firstCurly, lastCurly + 1);
    
    try {
      const result = JSON.parse(jsonStr);
      const t_end = Date.now();
      console.log(`[AI Forge] --- SHIELD SUCCESS (${t_end - t_start}ms) ---`);
      return NextResponse.json(result);
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON format" }, { status: 500 });
    }

  } catch (error: any) {
    const t_error = Date.now();
    console.error(`[AI Forge] --- SHIELD FATAL ERROR (+${t_error - t_start}ms) ---`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
