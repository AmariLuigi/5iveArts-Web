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
    const systemPrompt = `You are a high-end product copywriter for "5iveArts", a boutique studio for premium 3D-printed resin figures.
Generate a product TITLE and a professional, exciting DESCRIPTION based on the user's input (image or text).

STRICT REQUIREMENTS:
1. Output MUST be valid JSON in this format: { "title": "...", "description": "...", "tags": ["tag1", "tag2", ...] }
2. The description MUST include these exact static technical details:
   - "${BRAND_STATIC_PARTS.material}"
   - "${BRAND_STATIC_PARTS.painting}"
3. The description MUST end with this exact disclaimer: "${BRAND_STATIC_PARTS.disclaimer}"
4. Tone: Premium, artisan, high-end collector.
5. Language: English.`;

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
