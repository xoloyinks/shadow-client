/** @type {import('next').NextConfig} */
const withCSS = require('@zeit/next-css');
module.exports = withCSS();
const nextConfig = {
    experimental: {
        serverComponentsExternalPackages: ['axios','mongoose'],
    },
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
        config.externals.push({
            'utf-8-validate': 'commonjs utf-8-validate',
            'bufferutil': 'commonjs bufferutil',
            'supports-color': 'commonjs supports-color',
        })
        return config
    },
    reactStrictMode: false,
    images: {
        domains: ['localhost', 'https://shadow-server-b7v0.onrender.com/images']
    }
}
module.exports = nextConfig