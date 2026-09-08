import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/dg5qvbxjp/**",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/istonks/fund", destination: "/account?deposit=1", permanent: true },
      { source: "/stablecoin-directory", destination: "/stablecoins", permanent: true },
    ];
  },
};

export default nextConfig;
