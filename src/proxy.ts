import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { locales } from "@/lib/get-dictionary";
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';

function getLocale(request: NextRequest) {
    const negotiatorHeaders: Record<string, string> = {};
    request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

    const languages = new Negotiator({ headers: negotiatorHeaders }).languages();
    const defaultLocale = 'en';

    try {
        return match(languages, locales, defaultLocale);
    } catch (e) {
        return defaultLocale;
    }
}

export async function proxy(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh session if expired - required for Server Components
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    // ── Skip paths that should NOT be internationalized ──
    if (
        pathname.startsWith('/auth') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/_next') ||
        pathname.includes('.') || // static files
        pathname.startsWith('/assets')
    ) {
        // Still apply Auth logic for Admin/API
        const adminEmails = (process.env.ADMIN_EMAIL || "")
            .split(",")
            .map((e) => e.trim());

        if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
            if (pathname === "/admin/login" || pathname === "/admin/login/") {
                return supabaseResponse;
            }
            if (!user || !user.email || !adminEmails.includes(user.email)) {
                const url = request.nextUrl.clone();
                url.pathname = "/admin/login";
                return NextResponse.redirect(url);
            }
        }
        return supabaseResponse;
    }

    // ── Internationalization Logic ──
    const pathnameHasLocale = locales.some(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    if (pathnameHasLocale) return supabaseResponse;

    // Redirect if there is no locale
    const locale = getLocale(request);
    request.nextUrl.pathname = `/${locale}${pathname}`;
    
    // Redirect with the same query parameters
    const redirectUrl = request.nextUrl.clone();
    return NextResponse.redirect(redirectUrl);
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - images (public images)
         */
        "/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp|txt)$).*)",
    ],
};
