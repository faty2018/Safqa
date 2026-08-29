import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.11.105", "192.168.11.105:3000"],
  // ... reste de ta config existante
};

export default nextConfig;