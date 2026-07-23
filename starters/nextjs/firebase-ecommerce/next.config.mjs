/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ hostname: 'firebasestorage.googleapis.com' }, { hostname: 'rstr.in' }]
  }
}

export default nextConfig
