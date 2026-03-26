import { NextResponse } from "next/server";

export const runtime = "edge";

const NVIDIA_INVOKE_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

const BRAND_STATIC_PARTS = {
  material: "High-Resolution Industrial Resin (0.025mm layer height)",
  painting: "Artisan hand-painted with professional acrylics and airbrush techniques, finished with a museum-quality UV-resistant varnish.",
  disclaimer: "Note: Model images are digital renders. The final physical product is hand-painted by our artisans to match the render as closely as artistically possible, with unique artisan variations."
};

export async function POST(req: Request) {
  try {
    const { 
      prompt, 
      image, 
      existingFranchises = [], 
      existingSubcategories = [], 
      existingTags = [], 
      model = "moonshotai/kimi-k2.5" 
    } = await req.json();
    
    const rawKey = process.env.NVIDIA_API_KEY;
    const apiKey = rawKey?.trim().replace(/[\u200B-\u200D\uFEFF]/g, '');

    if (!apiKey) {
      return NextResponse.json({ error: "NVIDIA_API_KEY not configured" }, { status: 500 });
    }

    // Vault Data Serialization for Prompt Injection
    const vaultContext = `
VAULT_FRANCHISES: ${existingFranchises.join(", ")}
VAULT_SUB_CATEGORIES: ${existingSubcategories.join(", ")}
VAULT_TAGS: ${existingTags.join(", ")}
    `.trim();

    // Construct the system prompt to force JSON and brand alignment
    const systemPrompt = `You are an elite pop-culture curator for "5iveArts", specializing in museum-grade resin statues.
Your goal is to identify a character and map them to a strict hierarchical taxonomy.

TAXONOMY RULES:
- EVERY identifier must be a Category:Subcategory pair.
- **FORBIDDEN**: Never suggest generic attributes like "Material", "Vibe", "Style", "Color", "Quality", "Technical", "Description".
- **ELITE IDENTIFIERS ONLY**: Focus on specific lore, franchise, and character tags:
    - **Franchise**: The broad universe (e.g., "DC Comics", "Marvel").
    - **Character**: The specific name (e.g., "Zatanna", "Iron Man").
    - **Series**: The specific release line or comic volume (e.g., "Justice League Dark", "Infinity Saga").
    - **Artist**: If well-known (e.g., "Artgerm", "Todd McFarlane").
    - **Era**: (e.g., "Golden Age", "Renaissance").

CORE CHARACTER IDENTIFICATION:
- In Vision Mode (image provided), identify the character and their primary hierarchy immediately.
- If the identified Franchise or Subcategory matches an item in the provided VAULT lists exactly, YOU MUST USE THE VAULT STRING.

VAULT DATA CONTEXT:
${vaultContext}

Output MUST be valid JSON: { 
  "title": "...", 
  "description": "...", 
  "categorical_tags": { 
    "Franchise": "...", 
    "Character": "...", 
    "Series": "...", 
    "Artist": "..."
  }
}
BE CONCISE. Use high-speed identification. Maximize lore precision.`;

    const messages = [
      { role: "system", content: systemPrompt }
    ];

    if (image) {
      messages.push({
        role: "user",
        // @ts-ignore - NVIDIA/OpenAI vision format
        content: [
          { type: "text", text: prompt || "Analyze this figure and generate title/description." },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}` } }
        ]
      });
    } else {
      messages.push({ role: "user", content: prompt });
    }

    // FAST EXECUTION PROTOCOL: Single attempt on Hobby to avoid 10s timeout
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
        max_tokens: 2000,
        temperature: 0.7,
        top_p: 0.9,
        stream: false,
        chat_template_kwargs: { thinking: false },
      })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json({ error: `AI Provider Error: ${response.status}`, details: errorData }, { status: response.status });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // EXTRACTION ENGINE: Find the first '{' and last '}' to handle any conversational noise
    const firstCurly = content.indexOf('{');
    const lastCurly = content.lastIndexOf('}');
    
    if (firstCurly === -1 || lastCurly === -1) {
      return NextResponse.json({ error: "Model response did not contain a valid JSON structure." }, { status: 500 });
    }

    const jsonStr = content.substring(firstCurly, lastCurly + 1);
    
    try {
      const result = JSON.parse(jsonStr);
      if (!result.title || !result.description) throw new Error("JSON missing required fields");
      return NextResponse.json(result);
    } catch (e) {
      console.error("[AI Generate] Parsing failed:", jsonStr);
      return NextResponse.json({ error: "Invalid JSON format in model response" }, { status: 500 });
    }

  } catch (error: any) {
    console.error("[AI Generate] Fatal Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
