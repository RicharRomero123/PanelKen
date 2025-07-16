import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // añadir url de confianza res.cloudinary.com
  images: {
    remotePatterns: [
      {
        hostname: "res.cloudinary.com",
      },
    ],
  },
  /* config options here */
};

export default nextConfig;
