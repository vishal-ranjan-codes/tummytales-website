'use client'

/**
 * Customer Payments Client Component
 * Displays payment history and refund status
 */

import { useState, useMemo } from 'react'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard, Download, Filter } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/payment'
import { formatDateShort } from '@/lib/utils/subscription'
import { exportOrdersToCSV, downloadCSV } from '@/lib/utils/export-orders'

interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  payment_method: string
  payment_date: string | null
  refund_id: string | null
  refund_status: string | null
  refund_amount: number | null
  refunded_at: string | null
  created_at: string
  vendor_name: string
}

interface PaymentsClientProps {
  initialPayments: Payment[]
}

export default function PaymentsClient({ initialPayments }: PaymentsClientProps) {
  const [payments] = useState(initialPayments)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  const filteredPayments = useMemo(() => {
    let filtered = [...payments]

    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter)
    }

    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter((p) => p.payment_method === paymentMethodFilter)
    }

    if (dateFrom) {
      filtered = filtered.filter((p) => p.created_at >= dateFrom)
    }

    if (dateTo) {
      filtered = filtered.filter((p) => p.created_at <= dateTo)
    }

    return filtered.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }, [payments, statusFilter, paymentMethodFilter, dateFrom, dateTo])

  const handleExport = () => {
    const exportableData = filteredPayments.map((p) => ({
      id: p.id,
      service_date: p.created_at,
      slot: '',
      status: p.status,
      vendor_name: p.vendor_name,
      meal_name: '',
      delivery_address: '',
      created_at: p.created_at,
    }))

    const csvContent = exportOrdersToCSV(exportableData)
    const filename = `payments_${new Date().toISOString().split('T')[0]}.csv`
    downloadCSV(csvContent, filename)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      paid: 'default',
      pending_payment: 'secondary',
      failed: 'destructive',
      refunded: 'secondary',
    }
    const labels: Record<string, string> = {
      paid: 'Paid',
      pending_payment: 'Pending',
      failed: 'Failed',
      refunded: 'Refunded',
    }
    return (
      <Badge variant={variants[status] || 'secondary'}>{labels[status] || status.replace(/_/g, ' ')}</Badge>
    )
  }

  return (
    <div className="dashboard-page-content space-y-6">
      {/* Header */}
      <div className="dashboard-page-header flex items-center justify-between flex-wrap gap-4 border-b theme-border-color px-4 py-3 md:py-5 md:px-3 lg:px-6 lg:py-4">
        <div>
          <h1 className="theme-h4">Payment History</h1>
          <p className="theme-fc-light mt-1">View your payment history and refund status</p>
        </div>
        {filteredPayments.length > 0 && (
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      <div className="page-content p-4 md:p-5 lg:p-6 space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending_payment">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Payment Method</label>
                <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="upi_autopay">UPI Autopay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">From Date</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">To Date</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments List */}
        {filteredPayments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CreditCard className="w-12 h-12 mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No payments found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPayments.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{payment.vendor_name}</h3>
                        {getStatusBadge(payment.status)}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>
                          Amount: <span className="font-medium">{formatCurrency(payment.amount)}</span>
                        </div>
                        <div>
                          Payment Method:{' '}
                          <span className="font-medium capitalize">
                            {payment.payment_method === 'upi_autopay' ? 'UPI Autopay' : 'Manual'}
                          </span>
                        </div>
                        {payment.payment_date && (
                          <div>
                            Paid: <span className="font-medium">{formatDateShort(payment.payment_date)}</span>
                          </div>
                        )}
                        {payment.refund_status && (
                          <div>
                            Refund Status:{' '}
                            <Badge variant="outline" className="ml-1">
                              {payment.refund_status}
                            </Badge>
                            {payment.refund_amount && (
                              <span className="ml-2">
                                ({formatCurrency(payment.refund_amount)})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {formatDateShort(payment.created_at)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

