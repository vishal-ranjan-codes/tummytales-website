/**
 * Trial Detail Page
 * Show trial details with meals and invoice
 */

import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/server'
import { getTrialDetails } from '@/lib/bb-trials/bb-trial-queries'
import TrialDetailClient from './TrialDetailClient'

interface PageProps {
  params: Promise<{ trialId: string }>
}

export default async function TrialDetailPage({ params }: PageProps) {
  await requireRole('customer')
  const { trialId } = await params

  const trialResult = await getTrialDetails(trialId)

  if (!trialResult.success || !trialResult.data) {
    notFound()
  }

  return <TrialDetailClient trial={trialResult.data} />
}

