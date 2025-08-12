import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export',
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
  },
  // Add rewrites for CORS proxy (development only)
  async rewrites() {
    return process.env.NODE_ENV === 'development' ? [
      {
        source: '/api/openf1/:path*',
        destination: 'https://api.openf1.org/v1/:path*',
      },
      {
        source: '/api/jolpica/:path*', 
        destination: 'https://api.jolpi.ca/ergast/f1/:path*',
      },
    ] : [];
  },
  // ESLint configuration
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // TypeScript configuration
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
