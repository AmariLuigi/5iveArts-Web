import { NextResponse } from "next/server";

const NVIDIA_INVOKE_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

const BRAND_STATIC_PARTS = {
  material: "High-Resolution Industrial Resin (0.025mm layer height)",
  painting: "Artisan hand-painted with professional acrylics and airbrush techniques, finished with a museum-quality UV-resistant varnish.",
  disclaimer: "Note: Model images are digital renders. The final physical product is hand-painted by our artisans to match the render as closely as artistically possible, with unique artisan variations."
};

export async function POST(req: Request) {
  try {
    const { prompt, image, model = "qwen/qwen3.5-397b-a17b" } = await req.json();
    const rawKey = process.env.NVIDIA_API_KEY;
    const apiKey = rawKey?.trim().replace(/[\u200B-\u200D\uFEFF]/g, '');

    if (!apiKey) {
      return NextResponse.json({ error: "NVIDIA_API_KEY not configured" }, { status: 500 });
    }

    // Construct the system prompt to force JSON and brand alignment
    const systemPrompt = `You are an elite product copywriter for "5iveArts", specializing in museum-grade 3D resin collectibles. 
Your goal is to transform a visual/textual concept into a luxury product listing.

STRICT TITLE RULES:
- Use only the character/subject name.
- NEVER include shop names like "5iveArts".
- NEVER include technical scales (e.g., 1/6, 1/4) or "Premium".
- Example: "The Ironclad Vagabond" (Correct) vs "5iveArts Premium 1/6 Vagabond" (Incorrect).

STRICT DESCRIPTION RULES:
- Focus on artisanal storytelling and the poetic details of the sculpt.
- NEVER mention scales or specific sizes.
- Use a sophisticated, exclusive tone that speaks to serious collectors.
- MUST include these exact technical specs:
   - "${BRAND_STATIC_PARTS.material}"
   - "${BRAND_STATIC_PARTS.painting}"
- MUST end with the disclaimer: "${BRAND_STATIC_PARTS.disclaimer}"

Output MUST be valid JSON: { "title": "...", "description": "...", "tags": ["tag1", "tag2", ...] }`;

    const messages = [
      { role: "system", content: systemPrompt }
    ];

    if (image) {
      // If image is provided, ensure it's a vision-capable prompt structure
      // Note: Some models require specific vision message formats
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

    let retries = 0;
    const maxRetries = 2;
    let lastError = null;

    while (retries <= maxRetries) {
      try {
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
            max_tokens: 4096,
            temperature: 0.7,
            top_p: 1,
            // NVIDIA specific: ensure the response is treated as JSON if model supports it
            // or just rely on the system prompt
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`NVIDIA API Error: ${response.status} ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // Clean content if model wrapped it in markdown code blocks
        const jsonStr = content.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
        
        try {
          const result = JSON.parse(jsonStr);
          if (!result.title || !result.description) throw new Error("Missing required JSON fields");
          return NextResponse.json(result);
        } catch (e) {
          console.error("[AI Generate] JSON Parse Fail on attempt", retries, content);
          throw new Error("Invalid JSON format in model response");
        }

      } catch (err: any) {
        lastError = err;
        retries++;
        if (retries <= maxRetries) {
          await new Promise(r => setTimeout(r, 1000 * retries)); // Linear backoff
          continue;
        }
      }
    }

    return NextResponse.json({ error: lastError?.message || "Failed to generate content" }, { status: 500 });

  } catch (error: any) {
    console.error("[AI Generate] Fatal Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
