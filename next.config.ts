import { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

const nextConfig = (phase: string): NextConfig => ({
  output:
    phase === PHASE_PRODUCTION_BUILD
      ? process.env.ELECTRON_BUILD
        ? "standalone"
        : "export"
      : undefined,
  outputFileTracingExcludes: {
    "*": [
      "data/**",
      "dist-electron/**",
      ".electron-standalone/**",
      ".git/**",
      "cdk/**",
      "cdk.out/**",
      "scripts/**",
      "assets/**",
      "docker/**",
      "public/**",
    ],
  },
  trailingSlash: false,
  reactStrictMode: true,
  reactCompiler: true,
  images: {
    unoptimized: true,
  },
  headers:
    phase === PHASE_PRODUCTION_BUILD
      ? undefined
      : async () => [
          {
            source: "/engines/:blob*",
            headers: [
              {
                key: "Cache-Control",
                value: "public, max-age=31536000, immutable",
              },
              {
                key: "Age",
                value: "181921",
              },
            ],
          },
        ],
});

export default nextConfig;
