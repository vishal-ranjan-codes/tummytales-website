'use client'

/**
 * Payment History Client Component
 * Displays payment history with filters and actions
 */

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ArrowLeft, CreditCard, Download, RefreshCw } from 'lucide-react'
import { formatDateShort } from '@/lib/utils/subscription'
import { formatCurrency } from '@/lib/utils/payment'
import type { Payment } from '@/types/subscription'
import { retryFailedPayment, getPaymentInvoice } from '@/lib/payments/payment-actions'
import { toast } from 'sonner'

interface PaymentHistoryClientProps {
  subscriptionId: string
  payments: Payment[]
}

export default function PaymentHistoryClient({
  subscriptionId,
  payments: initialPayments,
}: PaymentHistoryClientProps) {
  const router = useRouter()
  const [payments] = useState(initialPayments)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [retryDialogOpen, setRetryDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  // Filter payments
  const filteredPayments = useMemo(() => {
    let filtered = [...payments]

    if (statusFilter !== 'all') {
      filtered = filtered.filter((payment) => payment.status === statusFilter)
    }

    if (dateFrom) {
      filtered = filtered.filter((payment) => payment.created_at >= dateFrom)
    }

    if (dateTo) {
      filtered = filtered.filter((payment) => payment.created_at <= dateTo)
    }

    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [payments, statusFilter, dateFrom, dateTo])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      success: 'default',
      pending: 'secondary',
      failed: 'destructive',
      refunded: 'secondary',
      partially_refunded: 'secondary',
    }
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const handleRetryPayment = async () => {
    if (!selectedPayment) return

    setIsRetrying(true)
    try {
      const result = await retryFailedPayment(selectedPayment.id)
      if (!result.success || !result.data) {
        toast.error(result.error || 'Failed to create payment order')
        setIsRetrying(false)
        return
      }

      // Open Razorpay checkout
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Razorpay = (window as any).Razorpay
        const publicKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder'

        const options = {
          key: publicKeyId,
          amount: result.data!.amount * 100,
          currency: 'INR',
          name: 'BellyBox',
          description: `Retry payment for subscription`,
          order_id: result.data!.paymentOrder.id,
          handler: async function () {
            toast.success('Payment successful!')
            setRetryDialogOpen(false)
            setSelectedPayment(null)
            router.refresh()
          },
          modal: {
            ondismiss: () => {
              setIsRetrying(false)
              toast.info('Payment cancelled')
            },
          },
        }

        const razorpay = new Razorpay(options)
        razorpay.open()
        setIsRetrying(false)
      }
      script.onerror = () => {
        toast.error('Failed to load Razorpay checkout')
        setIsRetrying(false)
      }
      document.body.appendChild(script)
    } catch (error) {
      console.error('Error retrying payment:', error)
      toast.error('An unexpected error occurred')
      setIsRetrying(false)
    }
  }

  const handleDownloadInvoice = async (paymentId: string) => {
    try {
      const result = await getPaymentInvoice(paymentId)
      if (result.success && result.data) {
        // Open invoice URL in new tab
        window.open(result.data.invoiceUrl, '_blank')
      } else {
        toast.error(result.error || 'Failed to get invoice')
      }
    } catch (error) {
      console.error('Error downloading invoice:', error)
      toast.error('An unexpected error occurred')
    }
  }

  return (
    <div className="dashboard-page-content space-y-6">
      {/* Header */}
      <div className="dashboard-page-header flex items-center justify-between flex-wrap gap-4 border-b theme-border-color px-4 py-3 md:py-5 md:px-3 lg:px-6 lg:py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/customer/subscriptions/${subscriptionId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="theme-h4">Payment History</h1>
            <p className="theme-fc-light mt-1">View and manage your payment records</p>
          </div>
        </div>
      </div>

      <div className="page-content p-4 md:p-5 lg:p-6 space-y-6">
        {/* Filters */}
        <div className="box p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Payments Table */}
        {filteredPayments.length === 0 ? (
          <div className="box text-center py-12">
            <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="theme-fc-light">No payments found</p>
          </div>
        ) : (
          <div className="box overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b theme-border-color">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium theme-fc-heading">Date</th>
                    <th className="text-left p-4 text-sm font-medium theme-fc-heading">Amount</th>
                    <th className="text-left p-4 text-sm font-medium theme-fc-heading">Status</th>
                    <th className="text-left p-4 text-sm font-medium theme-fc-heading">Payment ID</th>
                    <th className="text-left p-4 text-sm font-medium theme-fc-heading">Method</th>
                    <th className="text-right p-4 text-sm font-medium theme-fc-heading">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-b theme-border-color hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-4 text-sm theme-fc-heading">
                        {formatDateShort(payment.created_at)}
                      </td>
                      <td className="p-4 text-sm theme-fc-heading font-medium">
                        {formatCurrency(payment.amount, payment.currency)}
                      </td>
                      <td className="p-4">{getStatusBadge(payment.status)}</td>
                      <td className="p-4 text-sm theme-fc-light font-mono">
                        {payment.provider_payment_id.slice(0, 12)}...
                      </td>
                      <td className="p-4 text-sm theme-fc-light capitalize">
                        {payment.metadata?.payment_method || 'N/A'}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {payment.status === 'success' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadInvoice(payment.id)}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Invoice
                            </Button>
                          )}
                          {payment.status === 'failed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPayment(payment)
                                setRetryDialogOpen(true)
                              }}
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Retry
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Retry Payment Dialog */}
      <Dialog open={retryDialogOpen} onOpenChange={setRetryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retry Payment</DialogTitle>
            <DialogDescription>
              {selectedPayment && (
                <>
                  Retry payment of {formatCurrency(selectedPayment.amount, selectedPayment.currency)}.
                  You will be redirected to Razorpay checkout.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRetryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRetryPayment} disabled={isRetrying}>
              {isRetrying ? 'Processing...' : 'Proceed to Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

