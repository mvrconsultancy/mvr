import type { NextConfig } from "next";
import { resolveBackendUrl } from "./src/lib/backend-url";

const nextConfig: NextConfig = {
  // H-6 security fix: Do NOT emit source maps in production builds.
  // Source maps expose original TypeScript/JSX source to anyone who opens DevTools,
  // making reverse-engineering significantly easier.
  productionBrowserSourceMaps: false,

  // Standalone output for Docker; disabled on Vercel (Vercel manages its own output)
  ...(process.env.DOCKER_BUILD === "true" ? { output: "standalone" as const } : {}),

  // ---------------------------------------------------------------------------
  // React Compiler (Next.js 15)
  // ---------------------------------------------------------------------------
  reactCompiler: true,

  // ---------------------------------------------------------------------------
  // Image optimization — allow Cloudinary and other external domains
  // ---------------------------------------------------------------------------
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Environment variables exposed to the browser
  // ---------------------------------------------------------------------------
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    NEXT_PUBLIC_APP_NAME: "MVR Consultants",
  },

  // ---------------------------------------------------------------------------
  // Security headers
  // ---------------------------------------------------------------------------
  async headers() {
    const isDev = process.env.NODE_ENV !== "production";

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          // ── Content Security Policy (BUG-013) ─────────────────────────────
          // Allows self, Cloudinary, Unsplash, Google Fonts, backend API,
          // and open.er-api.com (currency converter).
          // unsafe-inline is required for Next.js hydration scripts + Tailwind.
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Scripts: self + Next.js inline hydration
              // 'unsafe-eval' is required in development by Turbopack (Next.js 16 default bundler)
              // for hot-reload, error overlays, and React debug features.
              // In production it is intentionally omitted (React never uses eval() in prod).
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
              // Styles: self + inline (Tailwind) + Google Fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts: self + Google Fonts CDN
              "font-src 'self' https://fonts.gstatic.com",
              // Images: self + Cloudinary + Unsplash + data URIs (for icons)
              "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://lh3.googleusercontent.com",
              // API: same-origin proxy (/api → backend). External APIs below.
              "connect-src 'self' https://open.er-api.com https://api.cloudinary.com",
              // Frames: none
              "frame-src 'none'",
              // Objects: none
              "object-src 'none'",
              // Upgrade insecure requests in production
              ...(isDev ? [] : ["upgrade-insecure-requests"]),
            ].join("; "),
          },
          // HSTS — production only (localhost has no TLS certificate)
          // max-age=31536000 = 1 year; includeSubDomains covers api.* and www.*
          ...(isDev ? [] : [{
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          }]),
        ],
      },
    ];
  },



  // ---------------------------------------------------------------------------
  // API proxy — same-origin cookies for admin auth (Vercel → Render)
  // Browser calls /api/* on the frontend domain; Next.js forwards to Rust backend.
  // Set BACKEND_URL in Vercel (server-only), e.g. https://mvr-umqq.onrender.com
  // ---------------------------------------------------------------------------
  async rewrites() {
    const backend = resolveBackendUrl();

    return [
      {
        source: "/health",
        destination: `${backend}/health`,
      },
      {
        source: "/api/:path*",
        destination: `${backend}/api/:path*`,
      },
    ];
  },

  // ---------------------------------------------------------------------------
  // Redirect www → non-www (configure domain when ready)
  // ---------------------------------------------------------------------------
  async redirects() {
    return [
      {
        source: "/sop-reviewer",
        destination: "/",
        permanent: true,
      },
      {
        source: "/tools/sop",
        destination: "/tools/gpa",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "mvrconsultants.org" }],
        destination: "https://www.mvrconsultants.org/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
