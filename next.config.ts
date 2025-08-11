import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  experimental: {
    // Suppress hydration warnings for browser extensions
    optimizePackageImports: ['@/components']
  },
  // Additional configuration to handle hydration
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error']
    } : false
  }
};

export default nextConfig;
