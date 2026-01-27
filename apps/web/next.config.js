/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['@bullish-clash/shared'],
    output: 'standalone',
};

module.exports = nextConfig;
