import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  fallbacks: {
    document: "/_offline",
  },
  workboxOptions: {
    skipWaiting: true,
    runtimeCaching: [
      {
        // Cache static assets (JS, CSS, fonts, images)
        urlPattern: /^https?:\/\/.*\.(js|css|woff2?|ttf|eot|ico|png|jpg|jpeg|gif|svg|webp)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "static-assets",
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
      {
        // Cache Google Fonts
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts",
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          },
        },
      },
      {
        // Cache article API responses (stale-while-revalidate)
        urlPattern: /\/api\/v1\/articles(?:\?.*)?$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "article-api",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60, // 1 hour
          },
        },
      },
      {
        // Cache individual article pages
        urlPattern: /\/api\/v1\/articles\/[a-z0-9-]+$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "article-detail-api",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60, // 1 hour
          },
        },
      },
      {
        // Cache page navigations (HTML)
        urlPattern: /^https?:\/\/.*\/(?:tools|about|articles|contact|newsletter).*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "pages",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60, // 1 day
          },
          networkTimeoutSeconds: 5,
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  output: "standalone",

  async redirects() {
    return [
      {
        source: "/blog",
        destination: "/articles",
        permanent: true,
      },
      {
        source: "/blog/:slug",
        destination: "/articles",
        permanent: false,
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://backend:5000"}/api/:path*`,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
