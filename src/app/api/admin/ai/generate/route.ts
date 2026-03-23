import { NextResponse } from "next/server";

const NVIDIA_INVOKE_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

const BRAND_STATIC_PARTS = {
  material: "High-Resolution Industrial Resin (0.025mm layer height)",
  painting: "Artisan hand-painted with professional acrylics and airbrush techniques, finished with a museum-quality UV-resistant varnish.",
  disclaimer: "Note: Model images are digital renders. The final physical product is hand-painted by our artisans to match the render as closely as artistically possible, with unique artisan variations."
};

export async function POST(req: Request) {
  try {
    const { prompt, image, model = "moonshotai/kimi-k2.5" } = await req.json();
    const rawKey = process.env.NVIDIA_API_KEY;
    const apiKey = rawKey?.trim().replace(/[\u200B-\u200D\uFEFF]/g, '');

    if (!apiKey) {
      return NextResponse.json({ error: "NVIDIA_API_KEY not configured" }, { status: 500 });
    }

    // Construct the system prompt to force JSON and brand alignment
    const systemPrompt = `You are an elite pop-culture curator for "5iveArts", specializing in museum-grade resin statues of iconic characters. 
Your goal is to transform a visual/textual concept of a LEGENDARY CHARACTER into a luxury product listing.

CORE CHARACTER IDENTIFICATION:
- In Vision Mode (image provided), strictly prioritize identifying the established character (e.g., from Games, Movies, Anime, or Comics). 
- If you recognize the subject (e.g., Arthas, Darth Vader, Geralt), use their canonical title and weave their specific legend into the description.
- Identify the source domain (e.g., "From the [Game/Movie] universe") with reverence.

STRICT TITLE RULES:
- Use only the character's legendary name and a subtitle.
- NEVER include shop names like "5iveArts".
- NEVER include technical scales or "Premium".
- Example: "Kratos: The Father of Sparta" (Correct) vs "5iveArts Figure" (Incorrect).

STRICT DESCRIPTION RULES:
- Focus on the iconic weight of the character and the poetic details of the sculpt.
- NEVER mention scales.
- MUST include these exact technical specs:
   - "${BRAND_STATIC_PARTS.material}"
   - "${BRAND_STATIC_PARTS.painting}"
- MUST end with the disclaimer: "${BRAND_STATIC_PARTS.disclaimer}"

Output MUST be valid JSON: { "title": "...", "description": "...", "tags": ["tag1", "tag2", ...] }`;

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
            max_tokens: 16384,
            temperature: 1.0,
            top_p: 1.0,
            stream: false,
            // Kimi k2.5: keeping thinking false for speed/timeout issues on Vercel
            chat_template_kwargs: { thinking: false },
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`NVIDIA API Error: ${response.status} ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        // SERVER SIDE DEBUG: Log the raw payload for inspection
        console.log("[AI Forge] RAW Response Content:", content);

        // EXTRACTION ENGINE: Find the first '{' and last '}' to handle any conversational noise
        const firstCurly = content.indexOf('{');
        const lastCurly = content.lastIndexOf('}');
        
        if (firstCurly === -1 || lastCurly === -1) {
          throw new Error("Model response did not contain a valid JSON structure.");
        }

        const jsonStr = content.substring(firstCurly, lastCurly + 1);
        
        try {
          const result = JSON.parse(jsonStr);
          if (!result.title || !result.description) throw new Error("JSON missing required fields");
          return NextResponse.json(result);
        } catch (e) {
          console.error("[AI Generate] Parsing failed. Content snippet:", jsonStr.substring(0, 50));
          throw new Error("Invalid JSON format in model response");
        }

      } catch (err: any) {
        lastError = err;
        retries++;
        if (retries <= maxRetries) {
          await new Promise(r => setTimeout(r, 1000 * retries));
          continue;
        }
      }
    }

    return NextResponse.json({ error: lastError?.message || "Generation failed" }, { status: 500 });

  } catch (error: any) {
    console.error("[AI Generate] Fatal Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
