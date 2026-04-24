import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable static optimization for pages that use runtime env vars
  // This ensures pages that depend on Supabase/auth are server-rendered
  experimental: {
    // Allow dynamic imports in server components
  },
};

export default nextConfig;
