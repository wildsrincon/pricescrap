/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["mongoose"],
  },
  images: {
    remotePatterns: [
      {
        hostname: "m.media-amazon.com",
      },
    ],
  },
};

export default nextConfig;
