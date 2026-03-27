import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const INVOKE_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

interface TranslateRequest {
    text: string;
    targetLang: string;
    sourceLang?: string;
}

const LANGUAGE_PROMPTS: Record<string, string> = {
    en: "Translate to English. Only provide the translation, no explanations.",
    it: "Translate to Italian. Only provide the translation, no explanations.",
    de: "Translate to German. Only provide the translation, no explanations.",
    fr: "Translate to French. Only provide the translation, no explanations.",
    es: "Translate to Spanish. Only provide the translation, no explanations.",
    ru: "Translate to Russian. Only provide the translation, no explanations.",
    tr: "Translate to Turkish. Only provide the translation, no explanations.",
    pt: "Translate to Portuguese. Only provide the translation, no explanations.",
    nl: "Translate to Dutch. Only provide the translation, no explanations.",
    ja: "Translate to Japanese. Only provide the translation, no explanations.",
    ar: "Translate to Arabic. Only provide the translation, no explanations.",
    pl: "Translate to Polish. Only provide the translation, no explanations.",
};

export async function POST(request: NextRequest) {
    try {
        const body: TranslateRequest = await request.json();
        const { text, targetLang, sourceLang = "auto" } = body;
        const rawKey = process.env.NVIDIA_API_KEY;
        const apiKey = rawKey?.trim().replace(/[\u200B-\u200D\uFEFF]/g, '');
        // Switching to Mistral Medium 3 as requested for translation sync.
        const model = "mistralai/mistral-medium-3-instruct";

        if (!text || !targetLang) {
            return NextResponse.json(
                { error: "Text and target language are required" },
                { status: 400 }
            );
        }

        if (!apiKey) {
            return NextResponse.json(
                { error: "NVIDIA_API_KEY not configured on server" },
                { status: 500 }
            );
        }

        const langInstruction = LANGUAGE_PROMPTS[targetLang] || `Translate to ${targetLang}. Only provide the translation, no explanations.`;

        const payload = {
            model: model,
            messages: [
                {
                    role: "user",
                    content: `You are a professional translator. ${langInstruction}\n\nText to translate:\n"${text}"`,
                },
            ],
            max_tokens: 4096,
            temperature: 0.1, 
            top_p: 1,
            stream: false,
            // Moonshot AI: disabling thinking for rapid translations to prevent Vercel 10s timeouts
            chat_template_kwargs: { thinking: false },
        };

        const response = await axios.post(INVOKE_URL, payload, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            timeout: 9000, // 9 second timeout to be safe within Vercel's 10s hobby window
        });

        const translatedText = response.data.choices?.[0]?.message?.content?.trim();

        if (!translatedText) {
            return NextResponse.json(
                { error: "Translation failed - no content received" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            translatedText,
            sourceLang,
            targetLang,
        });
    } catch (error: any) {
        console.error("[Translate API] Error:", error.message);

        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            return NextResponse.json(
                { error: "Translation timed out (Vercel hobby limit)" },
                { status: 504 }
            );
        }

        if (error.response) {
            return NextResponse.json(
                { error: `Translation API error: ${error.response.status}` },
                { status: error.response.status }
            );
        }

        return NextResponse.json(
            { error: "Translation service unavailable or throttled" },
            { status: 500 }
        );
    }
}
