import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  reactStrictMode: false,

  // Keep whitelists clean for development stability
  allowedDevOrigins: [
    "localhost:3000",
    "127.0.0.1:3000",
    "172.25.32.1:3000"
  ],

  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "127.0.0.1:3000", "172.25.32.1:3000"]
    }
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "purecatamphetamine.github.io" },
      { protocol: "https", hostname: "raw.githubusercontent.com" },
      { protocol: "https", hostname: "api.dicebear.com" }
    ],
  },

  async headers() {
    if (isDev) return [];

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const CSP = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://js.stripe.com https://accounts.google.com/gsi/client",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com https://accounts.google.com",
      `img-src 'self' data: blob: ${supabaseUrl} https://lh3.googleusercontent.com https://purecatamphetamine.github.io https://api.dicebear.com`,
      `media-src 'self' ${supabaseUrl}`,
      `connect-src 'self' https://api.stripe.com https://api.packlink.com https://restcountries.com https://accounts.google.com ${supabaseUrl}`,
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }
        ],
      },
    ];
  },
};

export default nextConfig;
