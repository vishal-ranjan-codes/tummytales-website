/**
 * Order Export Utility
 * Exports orders to CSV format
 */

export interface ExportableOrder {
  id: string
  service_date: string
  slot: string
  status: string
  vendor_name?: string
  meal_name?: string
  delivery_address?: string
  created_at: string
}

/**
 * Convert orders to CSV format
 */
export function exportOrdersToCSV(orders: ExportableOrder[]): string {
  if (orders.length === 0) {
    return ''
  }

  // CSV headers
  const headers = [
    'Order ID',
    'Service Date',
    'Slot',
    'Status',
    'Vendor',
    'Meal',
    'Delivery Address',
    'Created At',
  ]

  // CSV rows
  const rows = orders.map((order) => [
    order.id,
    order.service_date,
    order.slot,
    order.status,
    order.vendor_name || '',
    order.meal_name || '',
    order.delivery_address || '',
    order.created_at,
  ])

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  return csvContent
}

/**
 * Download CSV file
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

