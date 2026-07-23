/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ hostname: 'cdn.shopify.com' }, { hostname: 'rstr.in' }]
  }
}

export default nextConfig
