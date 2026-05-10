import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Keeps Vercel file tracing inside this app when other lockfiles exist on the machine.
  outputFileTracingRoot: path.join(__dirname),
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
  // RSS / CDN artwork: resize via next/image (never ship full 1400px grids to the client).
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.spreaker.com", pathname: "/**" },
      { protocol: "https", hostname: "d3wo5wojvuv7l.cloudfront.net", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
