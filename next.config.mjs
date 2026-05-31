/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Spotify album art is served from i.scdn.co (CDN). Allow it for next/image.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.scdn.co",
      },
    ],
  },
};

export default nextConfig;
