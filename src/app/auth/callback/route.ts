import { createClient } from "@/lib/supabase-server";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const next = requestUrl.searchParams.get("next") ?? "/account";

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            const lang = requestUrl.searchParams.get("lang") || 'en';
            
            // Redirect to the localized 'next' path
            const redirectUrl = new URL(`/${lang}${next.startsWith('/') ? next : `/${next}`}`, request.url);
            return NextResponse.redirect(redirectUrl);
        }
    }

    // Return the user to an error page with some instructions
    return NextResponse.redirect(new URL("/login/error", request.url));
}
