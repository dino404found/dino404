import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    ] }];
  },
  // The existing shared bootstrap imports the SQL migration as source text.
  webpack(config) {
    config.module.rules.push({ test: /\.sql$/, resourceQuery: /raw/, type: "asset/source" });
    return config;
  },
};

export default nextConfig;
