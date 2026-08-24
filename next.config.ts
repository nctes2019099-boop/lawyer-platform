import type { NextConfig } from "next";

// When BUILD_MODE=static (used for the Capacitor mobile bundle via
// scripts/build-mobile.mjs), export a fully static site to `out/`. The mobile
// app talks to a remote API configured via NEXT_PUBLIC_API_URL. The default
// build produces a standalone Node server (web/self-host).
const isStaticExport = process.env.BUILD_MODE === "static";

const nextConfig: NextConfig = {
  output: isStaticExport ? "export" : "standalone",
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: false },
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  // Allow the Arena preview proxy to load dev resources (chunks/HMR) without
  // triggering Next 16's cross-origin protection. Accepts the specific host
  // and any *.e2b.app preview subdomain.
  allowedDevOrigins: [
    "3000-itwlxlr0ku76ww8ocjbi6.e2b.app",
    "*.e2b.app",
  ],
};

export default nextConfig;
