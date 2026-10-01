import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The existing shared bootstrap imports the SQL migration as source text.
  webpack(config) {
    config.module.rules.push({ test: /\.sql$/, resourceQuery: /raw/, type: "asset/source" });
    return config;
  },
};

export default nextConfig;
