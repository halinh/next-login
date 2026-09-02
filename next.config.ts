import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // request-oauth2 is linked from ../request_oauth2 (a file: dependency that
  // resolves outside this project dir). Pin the Turbopack workspace root to the
  // parent so `next dev` / `next build` resolve the symlinked package.
  turbopack: { root: path.join(__dirname, "..") },
};

export default nextConfig;
