import { NextResponse } from "next/server";

export const runtime = "edge";

const NVIDIA_INVOKE_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

export async function POST(req: Request) {
  try {
    const { 
      imageUrl, 
      finishType = "PAINTED" 
    } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "Reference Image URL is required" }, { status: 400 });
    }

    const rawKey = process.env.NVIDIA_API_KEY;
    const apiKey = rawKey?.trim().replace(/[\u200B-\u200D\uFEFF]/g, '');

    if (!apiKey) {
        return NextResponse.json({ error: "NVIDIA_API_KEY not configured" }, { status: 500 });
    }

    const systemPrompt = `SYSTEM INSTRUCTIONS: 3D PRINTING & PAINTING COMPLEXITY ANALYST
ROLE: You are a professional cost estimator for a high-end 3D printing and miniature painting studio in Italy. Your goal is to analyze an image of a character/statue and determine its manufacturing complexity.

INPUTS: Reference Image + Finish Type ("RAW" or "PAINTED").

EVALUATION RUBRIC (1-5 SCALE):
1. Geometry Complexity (G)
- 1 (Very Low): Solid shapes, thick limbs, few to no overhangs.
- 3 (Medium): Standard humanoid, basic weapons, some thin parts.
- 5 (Extreme): Many fragile parts, complex capes, floating islands, extreme textures.

2. Painting Complexity (P)
- 1 (Very Low): 1-3 flat colors, no shading, no fine details.
- 3 (Medium): 4-7 colors, basic wash/shading, distinct textures.
- 5 (Extreme): High-end artistic techniques (OSL, NMM, realistic skin, micro-details).

CALCULATION LOGIC:
Final Multiplier = 1.0 + ((AvgNote - 1) / 4) * 0.3
If Finish is "PAINTED": AvgNote = (Geometry_Note + Painting_Note) / 2
If Finish is "RAW": AvgNote = Geometry_Note (Ignore painting).

OUTPUT FORMAT: Return ONLY JSON.
{
  "analysis": {
    "geometry_score": number,
    "painting_score": number,
    "detected_features": ["..."],
    "justification": "string (in Portuguese or Italian)"
  },
  "complexity_factor": number (float 1.00-1.30)
}`;

    // Note: Using nvidia/llama-3.2-11b-vision-instruct or similar if available.
    // We'll use the chat/completions endpoint with image data.
    const response = await fetch(NVIDIA_INVOKE_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemma-3-27b-it", // Matching the working generate/route.ts model
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: systemPrompt + `\n\nFINISH TYPE: ${finishType}` },
              { type: "image_url", image_url: { url: imageUrl } }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 1024,
      })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("[AI Complexity] NVIDIA Error:", errorText);
        return NextResponse.json({ error: `NVIDIA API Error: ${response.status}`, details: errorText }, { status: response.status });
    }

    const responseText = await response.text();
    let content = "";

    try {
        const result = JSON.parse(responseText);
        content = result.choices[0]?.message?.content || "";
    } catch (e: any) {
        // Fallback: If the response itself is text (rare but happens with some providers)
        console.error("[AI Complexity] Response is not valid JSON:", responseText);
        // Sometimes NVIDIA returns the body as a stream even if not asked, or includes headers in the body
        // We'll try to find the content block manually if needed, but for now just error with details
        return NextResponse.json({ 
            error: "Invalid AI Provider Response (Not JSON)", 
            details: responseText,
            parse_error: e.message 
        }, { status: 500 });
    }
    
    // Extraction (robust JSON parsing)
    try {
        const firstCurly = content.indexOf('{');
        const lastCurly = content.lastIndexOf('}');
        
        if (firstCurly === -1 || lastCurly === -1) {
            console.error("[AI Complexity] Raw content with no JSON:", content);
            throw new Error(`Invalid AI Response Structure: ${content.slice(0, 100)}...`);
        }
        
        const jsonStr = content.substring(firstCurly, lastCurly + 1);
        const analysisResult = JSON.parse(jsonStr);

        return NextResponse.json(analysisResult);
    } catch (parseErr: any) {
        console.error("[AI Complexity] Parse error. Raw content:", content);
        return NextResponse.json({ 
            error: "Failed to parse AI response content", 
            details: content,
            parse_error: parseErr.message 
        }, { status: 500 });
    }

  } catch (error: any) {
    console.error("[AI Complexity] Fatal Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
