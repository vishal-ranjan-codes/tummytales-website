import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function LegacyVendorRoute({ params }: PageProps) {
  const { slug } = await params
  redirect(`/vendors/${slug}`)
}

