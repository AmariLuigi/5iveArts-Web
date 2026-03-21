import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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

    // ── Route Protection ──

    const { pathname } = request.nextUrl;
    const adminEmail = process.env.ADMIN_EMAIL || "luigi.de.la.vega@googlemail.com";

    // 1. Protect Admin Routes
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
        // Exempt login page
        if (pathname === "/admin/login") {
            return supabaseResponse;
        }

        if (!user || user.email !== adminEmail) {
            console.warn(`[proxy] Unauthenticated or unauthorized admin access attempt at ${pathname}`);
            const url = request.nextUrl.clone();
            url.pathname = "/admin/login";
            return NextResponse.redirect(url);
        }
    }

    // 2. Protect Account Routes
    if (pathname.startsWith("/account")) {
        if (!user) {
            const url = request.nextUrl.clone();
            url.pathname = "/login";
            url.searchParams.set("returnTo", pathname);
            return NextResponse.redirect(url);
        }
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
