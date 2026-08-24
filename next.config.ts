import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: false },
  // The app talks to a database and must not be statically optimized at build
  // time (it also keeps Prisma from being instantiated during the build).
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
};

export default nextConfig;
