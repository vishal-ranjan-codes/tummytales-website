'use client'

/**
 * Admin Invoices Client Component
 * Display and manage invoices with order generation
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { generateOrdersForInvoice } from '@/lib/admin/invoice-actions'
import { formatCurrency } from '@/lib/utils/payment'
import { 
  FileText, 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  RefreshCw 
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Invoice {
  id: string
  status: string
  total_amount: number
  paid_at: string | null
  created_at: string
  razorpay_order_id: string | null
  order_count: number
  group: {
    id: string
    vendor: {
      display_name: string
    } | null
    consumer: {
      full_name: string | null
      email: string | null
    } | null
  } | null
  cycle: {
    cycle_start: string
    cycle_end: string
  } | null
}

interface AdminInvoicesClientProps {
  initialInvoices: Invoice[]
}

export default function AdminInvoicesClient({
  initialInvoices,
}: AdminInvoicesClientProps) {
  const [invoices, setInvoices] = useState(initialInvoices)
  const [generatingOrders, setGeneratingOrders] = useState<string | null>(null)

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'MMM d, yyyy h:mm a')
  }

  const getStatusBadge = (status: string) => {
    const variantMap: Record<string, 'default' | 'secondary' | 'destructive'> = {
      paid: 'default',
      pending_payment: 'secondary',
      failed: 'destructive',
      void: 'destructive',
    }
    return (
      <Badge variant={variantMap[status] || 'secondary'} className="capitalize">
        {status.replace(/_/g, ' ')}
      </Badge>
    )
  }

  const handleGenerateOrders = async (invoiceId: string) => {
    setGeneratingOrders(invoiceId)

    try {
      const result = await generateOrdersForInvoice(invoiceId)

      if (!result.success) {
        toast.error(result.error || 'Failed to generate orders')
        return
      }

      toast.success(
        `Successfully generated ${result.data?.created_orders || 0} orders`
      )

      // Update invoice in state
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoiceId
            ? { ...inv, order_count: result.data?.created_orders || 0 }
            : inv
        )
      )

      // Reload page to refresh data
      window.location.reload()
    } catch (error) {
      console.error('Error generating orders:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setGeneratingOrders(null)
    }
  }

  // Filter invoices that need attention
  const paidWithoutOrders = invoices.filter(
    (inv) => inv.status === 'paid' && inv.order_count === 0
  )

  return (
    <div className="dashboard-page-content space-y-6">
      {/* Header */}
      <div className="dashboard-page-header flex items-center justify-between flex-wrap gap-4 border-b theme-border-color px-4 py-3 md:py-5 md:px-3 lg:px-6 lg:py-4">
        <div>
          <h1 className="theme-h4">Invoices</h1>
          <p className="theme-fc-light mt-1">
            Manage subscription invoices and orders
          </p>
        </div>
      </div>

      <div className="page-content p-4 md:p-5 lg:p-6 space-y-6">
        {/* Alert for invoices needing attention */}
        {paidWithoutOrders.length > 0 && (
          <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              <strong>Action Required:</strong> {paidWithoutOrders.length} paid{' '}
              {paidWithoutOrders.length === 1 ? 'invoice has' : 'invoices have'} no
              orders generated. Use the "Generate Orders" button to create them.
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium">Total Invoices</p>
              </div>
              <p className="text-2xl font-bold">{invoices.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <p className="text-sm font-medium">Paid</p>
              </div>
              <p className="text-2xl font-bold">
                {invoices.filter((i) => i.status === 'paid').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <p className="text-sm font-medium">Pending</p>
              </div>
              <p className="text-2xl font-bold">
                {invoices.filter((i) => i.status === 'pending_payment').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-blue-600" />
                <p className="text-sm font-medium">Needs Orders</p>
              </div>
              <p className="text-2xl font-bold">{paidWithoutOrders.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Invoices List */}
        <div className="space-y-4">
          {invoices.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No invoices found
              </CardContent>
            </Card>
          ) : (
            invoices.map((invoice) => {
              // Handle nested relations (Supabase may return arrays)
              const group = Array.isArray(invoice.group) ? invoice.group[0] : invoice.group
              const vendor = Array.isArray(group?.vendor) ? group?.vendor[0] : group?.vendor
              const consumer = Array.isArray(group?.consumer) ? group?.consumer[0] : group?.consumer
              const cycle = Array.isArray(invoice.cycle) ? invoice.cycle[0] : invoice.cycle

              return (
                <Card key={invoice.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {vendor?.display_name || 'Unknown Vendor'}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {consumer?.full_name || 'Unknown Customer'} ({consumer?.email || 'No email'})
                        </p>
                      </div>
                      {getStatusBadge(invoice.status)}
                    </div>
                  </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Amount</p>
                      <p className="text-lg font-bold">
                        {formatCurrency(invoice.total_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Orders Generated</p>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <p className="text-lg font-bold">{invoice.order_count}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {cycle && (
                      <div>
                        <p className="text-muted-foreground">Cycle Period</p>
                        <p className="font-medium">
                          {format(new Date(cycle.cycle_start), 'MMM d')} -{' '}
                          {format(new Date(cycle.cycle_end), 'MMM d, yyyy')}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p className="font-medium">{formatDate(invoice.created_at)}</p>
                    </div>
                    {invoice.paid_at && (
                      <div>
                        <p className="text-muted-foreground">Paid At</p>
                        <p className="font-medium">{formatDate(invoice.paid_at)}</p>
                      </div>
                    )}
                    {invoice.razorpay_order_id && (
                      <div>
                        <p className="text-muted-foreground">Razorpay Order ID</p>
                        <p className="font-medium text-xs">
                          {invoice.razorpay_order_id}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Generate Orders Button */}
                  {invoice.status === 'paid' && (
                    <div className="flex justify-end pt-2 border-t">
                      <Button
                        variant={invoice.order_count === 0 ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleGenerateOrders(invoice.id)}
                        disabled={generatingOrders === invoice.id}
                      >
                        {generatingOrders === invoice.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            {invoice.order_count === 0
                              ? 'Generate Orders'
                              : 'Regenerate Orders'}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

