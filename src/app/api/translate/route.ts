import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const INVOKE_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const MODEL = "qwen/qwen3.5-122b-a10b";
const API_KEY = process.env.NVIDIA_API_KEY;

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
};

export async function POST(request: NextRequest) {
    try {
        const body: TranslateRequest = await request.json();
        const { text, targetLang, sourceLang = "auto" } = body;

        if (!text || !targetLang) {
            return NextResponse.json(
                { error: "Text and target language are required" },
                { status: 400 }
            );
        }

        if (!API_KEY) {
            return NextResponse.json(
                { error: "NVIDIA_API_KEY not configured" },
                { status: 500 }
            );
        }

        const langInstruction = LANGUAGE_PROMPTS[targetLang] || `Translate to ${targetLang}. Only provide the translation, no explanations.`;

        const payload = {
            model: MODEL,
            messages: [
                {
                    role: "user",
                    content: `You are a professional translator. ${langInstruction}\n\nText to translate:\n"${text}"`,
                },
            ],
            max_tokens: 4096,
            temperature: 0.6,
            top_p: 0.95,
            stream: false,
            chat_template_kwargs: { enable_thinking: false },
        };

        const response = await axios.post(INVOKE_URL, payload, {
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
            },
            timeout: 60000,
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

        if (error.response) {
            return NextResponse.json(
                { error: `Translation API error: ${error.response.status}` },
                { status: error.response.status }
            );
        }

        return NextResponse.json(
            { error: "Translation service unavailable" },
            { status: 500 }
        );
    }
}
