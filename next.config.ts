import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/keynotes', destination: '/book-keynote', permanent: true },
      { source: '/consultation', destination: '/schedule-consultation', permanent: true },
    ];
  },
};

export default nextConfig;
