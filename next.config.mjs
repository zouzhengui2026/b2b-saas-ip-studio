/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 在生产环境启用浏览器 source maps，便于定位生产环境的 minified React 错误
  productionBrowserSourceMaps: true,
}

export default nextConfig
