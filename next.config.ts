import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: process.env.NODE_ENV === "development",
  },
};

export default nextConfig;
