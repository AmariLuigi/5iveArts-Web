import { createClient } from "@/lib/supabase-server";
import { type NextRequest, NextResponse } from "next/server";
import { locales } from "@/lib/get-dictionary";

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const next = requestUrl.searchParams.get("next") ?? "/account";

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            const lang = requestUrl.searchParams.get("lang") || 'en';
            
            // Check if 'next' already contains a localized path
            const hasLocale = locales.some(l => next.startsWith(`/${l}/`) || next === `/${l}`);
            const finalPath = hasLocale ? next : `/${lang}${next.startsWith('/') ? next : `/${next}`}`;

            // Redirect to the localized 'next' path
            const redirectUrl = new URL(finalPath, request.url);
            return NextResponse.redirect(redirectUrl);
        }
    }

    // Return the user to an error page with some instructions
    return NextResponse.redirect(new URL("/login/error", request.url));
}
