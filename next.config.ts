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
      { source: "/stablecoin-directory", destination: "/stablecoins", permanent: true },
      // Apple Pay merchant domain is registered for /pay — keep iStonk links there.
      { source: "/istonks/pay", destination: "/pay", permanent: false },
      { source: "/istonks/pay/success", destination: "/pay/success", permanent: false },
    ];
  },
};

export default nextConfig;
