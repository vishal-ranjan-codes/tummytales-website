
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
		],
	},
};

export default nextConfig;