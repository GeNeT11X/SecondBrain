const nextConfig = {
    // NOTE: 'standalone' output is for Docker/Node servers.
    // For Vercel deployment, remove it (Vercel handles output automatically).
    // output: 'standalone',

    images: {
        unoptimized: true,
    },

    // Note: in Next.js 15+ this would move to top-level 'serverExternalPackages'.
    // For Next.js 14.2.3, it stays under experimental.
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
        const frontendUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.twobrain.in';
        return [
            {
                // Security headers for all routes
                source: '/(.*)',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                ],
            },
            {
                // CORS headers scoped to API routes only
                source: '/api/(.*)',
                headers: [
                    { key: 'Access-Control-Allow-Origin', value: frontendUrl },
                    { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PATCH, DELETE, OPTIONS' },
                    { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
                    { key: 'Access-Control-Allow-Credentials', value: 'true' },
                ],
            },
        ];
    },
};

module.exports = nextConfig;
