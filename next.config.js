const nextConfig = {
    // NOTE: 'standalone' output is for Docker/Node servers.
    // For Vercel deployment, remove it (Vercel handles output automatically).
    // Uncomment the line below only if deploying to a self-hosted Node/Docker environment:
    // output: 'standalone',

    images: {
        unoptimized: true,
    },
    experimental: {
        serverComponentsExternalPackages: ['mongodb'],
    },
    webpack(config, { dev }) {
        if (dev) {
            config.watchOptions = {
                poll: 2000,
                aggregateTimeout: 300,
                ignored: ['**/node_modules'],
            };
        }
        return config;
    },
    onDemandEntries: {
        maxInactiveAge: 10000,
        pagesBufferLength: 2,
    },
    async headers() {
        const frontendUrl = process.env.NEXT_PUBLIC_BASE_URL || '*';
        return [
            {
                source: '/(.*)',
                headers: [
                    { key: 'X-Frame-Options', value: 'ALLOWALL' },
                    { key: 'Content-Security-Policy', value: 'frame-ancestors *;' },
                    { key: 'Access-Control-Allow-Origin', value: process.env.CORS_ORIGINS || frontendUrl },
                    { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS' },
                    { key: 'Access-Control-Allow-Headers', value: '*' },
                ],
            },
        ];
    },
};

module.exports = nextConfig;
