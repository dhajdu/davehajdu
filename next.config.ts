import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: '/personal-os', destination: '/personal-os/index.html' }];
  },
  async redirects() {
    return [
      { source: '/keynotes', destination: '/book-keynote', permanent: true },
      { source: '/workshops', destination: '/book-keynote', permanent: false },
      { source: '/consultation', destination: '/schedule-consultation', permanent: true },
    ];
  },
};

export default nextConfig;
