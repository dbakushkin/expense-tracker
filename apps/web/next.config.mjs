/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@expence-tracker/shared-types"],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
