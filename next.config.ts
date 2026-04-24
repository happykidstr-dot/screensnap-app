import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // These packages use browser APIs and must not be bundled for the server
  serverExternalPackages: ['peerjs', '@mediapipe/tasks-vision', '@ffmpeg/ffmpeg', '@ffmpeg/util', 'jszip', 'idb', 'modern-gif'],

  // Use webpack (not Turbopack) for compatibility with special path characters
  // turbopack: {},  // disabled - causes issues with apostrophe in path

  webpack(config, { isServer }) {
    if (isServer) {
      // Prevent browser-only packages from breaking the SSR bundle
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...config.resolve?.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;

