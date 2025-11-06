
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: '**.graphassets.com',
			},
			{
				protocol: 'https',
				hostname: '**.supabase.co',
				pathname: '/storage/v1/object/public/**',
			},
			{
				protocol: 'https',
				hostname: '**.r2.dev',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: '**.cloudflarestorage.com',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: '**.googleusercontent.com',
			},
		],
	},
	// Note: When using Turbopack (--turbopack flag), webpack configurations are ignored.
	// The 404s for Supabase source maps are harmless - they're from browser devtools
	// trying to load source maps for bundled third-party code. This is expected behavior.
};

export default nextConfig;