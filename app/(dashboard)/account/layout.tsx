import type { ReactNode } from 'react'

export default function AccountLayout({ children }: { children: ReactNode }) {
	return (
		<div className="min-h-[60vh] container mx-auto px-4 py-8">
			{children}
		</div>
	)
}


