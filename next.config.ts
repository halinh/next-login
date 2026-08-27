import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // request-oauth2 is installed as `file:../request_oauth2`, which npm links as a
  // symlink whose real path sits outside this project directory. Turbopack refuses
  // to resolve modules outside its detected root (this folder, because of
  // package-lock.json), so point the root at the parent that contains both
  // next-login and request_oauth2.
  turbopack: {
    root: path.join(__dirname, ".."),
  },
};

export default nextConfig;
