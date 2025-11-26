/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use static export for production builds (electron:build)
  // In development, we need the dev server to work normally
  ...(process.env.NODE_ENV === 'production' && { output: "export" }),
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
