/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  // Voor GitHub Pages onder een subpad (bijv. /vacatures): zet
  // NEXT_PUBLIC_BASE_PATH in de build-omgeving. Lokaal blijft dit leeg.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
};

export default nextConfig;
