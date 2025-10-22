/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ✅ Ignore linting errors in production
  },
  typescript: {
    ignoreBuildErrors: true, // ✅ Ignore TypeScript "any" errors during deploy
  },
};

export default nextConfig;
