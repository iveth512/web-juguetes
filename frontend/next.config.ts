import type { NextConfig } from "next";

const apiOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL || "").origin;
  } catch {
    return "";
  }
})();

// Bold checkout (https://checkout.bold.co) and Google sign-in are the only
// third parties that run code on the site.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://checkout.bold.co https://*.bold.co https://accounts.google.com",
  "style-src 'self' 'unsafe-inline' https://accounts.google.com",
  `img-src 'self' data: blob: https: ${apiOrigin}`,
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigin} https://*.bold.co https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com`,
  "frame-src https://*.bold.co https://accounts.google.com",
  "form-action 'self' https://*.bold.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self \"https://checkout.bold.co\")" },
  // Report-Only until a full sandbox purchase with Bold has been verified in
  // the browser console; then rename the key to Content-Security-Policy.
  { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    if (process.env.NODE_ENV !== "production") return [];
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    // Local Docker: the Next.js server cannot reach "localhost:8000" from
    // inside its container, so images are loaded by the browser directly.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "backend",
        port: "8000",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "juguetesparafrikis.com",
        pathname: "/media/**",
      },
    ],
  },
};

export default nextConfig;
