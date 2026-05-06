/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: "50mb" },
  },
  transpilePackages: ["@vp/shared", "@vp/db", "@vp/ai", "@vp/worker"],
};
export default nextConfig;
