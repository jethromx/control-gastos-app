import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for Docker/Vercel optimized deployments
  // output: 'standalone', // Uncomment if deploying to Docker

  // Disable x-powered-by header
  poweredByHeader: false,

  // Image optimization — allow Supabase storage as image source
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Recommended: ensure env vars are validated at build time
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },
};

export default nextConfig;
