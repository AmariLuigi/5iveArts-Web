import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Protect all /admin routes except /admin/login
    if (request.nextUrl.pathname.startsWith("/admin") && !request.nextUrl.pathname.startsWith("/admin/login")) {
        if (!user) {
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }

        // Check if user is the admin (matches env var)
        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail && user.email !== adminEmail) {
            // Sign out and redirect if not the admin
            await supabase.auth.signOut();
            return NextResponse.redirect(new URL("/admin/login?error=unauthorized", request.url));
        }
    }

    return response;
}

export const config = {
    matcher: ["/admin/:path*", "/api/admin/:path*"],
};
