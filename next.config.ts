import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content-Security-Policy (CSP)
 * - Stripe JS is loaded from js.stripe.com
 * - Fonts come from fonts.gstatic.com / fonts.googleapis.com (Geist via Next.js)
 * - No inline scripts (use nonces in production if needed)
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const CSP = [
  "default-src 'self'",
  // Scripts: allow self + Stripe + unsafe-inline (needed for Next.js hydration)
  `script-src 'self' 'unsafe-inline' https://js.stripe.com${isDev ? " 'unsafe-eval'" : ""}`,
  // Styles: allow self + Google Fonts
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Fonts
  "font-src 'self' https://fonts.gstatic.com",
  // Frames: only Stripe's payment iframes
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  // Images: self + data URIs + Supabase (if needed)
  `img-src 'self' data: blob: ${supabaseUrl}`,
  // Media: allow cinematic videos from Supabase
  `media-src 'self' blob: ${supabaseUrl} https://*.supabase.co`,
  // Connections: self + Stripe + Packlink + Supabase
  `connect-src 'self' https://api.stripe.com https://api.packlink.com ${supabaseUrl}`,
  // Block everything else
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
]
  .join("; ");

const securityHeaders = [
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Block clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  // XSS filter (legacy browsers)
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // HSTS — force HTTPS for 1 year (skip on dev)
  ...(isDev
    ? []
    : [
      {
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains; preload",
      },
    ]),
  // Referrer policy — don't leak full URL to third parties
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Permissions policy — disable unused browser features
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self)",
  },
  // Content Security Policy
  { key: "Content-Security-Policy", value: CSP },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        // Apply security headers to every route
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
