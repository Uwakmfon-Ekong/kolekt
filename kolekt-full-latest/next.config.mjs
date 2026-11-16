/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // PGlite (the built-in demo database) ships WebAssembly; keep it out of the server bundle.
  serverExternalPackages: ["@electric-sql/pglite"],
  experimental: {
    // Cover images and profile photos are sent with the form (they're resized in the browser first).
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
