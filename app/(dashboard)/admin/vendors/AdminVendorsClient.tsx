'use client'

/**
 * Admin Vendors Client Component
 * Handles vendor list with search, filters, and navigation
 */

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Store, Eye, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import type { AdminVendorsData } from '@/lib/auth/data-fetchers'

interface AdminVendorsClientProps {
  initialData: AdminVendorsData
}

export default function AdminVendorsClient({ initialData }: AdminVendorsClientProps) {
  const router = useRouter()
  const [vendors] = useState(initialData.vendors)
  const [zones] = useState(initialData.zones)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [kycFilter, setKycFilter] = useState<string>('all')
  const [zoneFilter, setZoneFilter] = useState<string>('all')

  // Client-side filtering
  const filteredVendors = useMemo(() => {
    let filtered = [...vendors]

    // Apply search
    if (search.trim()) {
      const searchLower = search.trim().toLowerCase()
      filtered = filtered.filter(vendor => 
        vendor.display_name?.toLowerCase().includes(searchLower)
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(vendor => vendor.status === statusFilter)
    }

    // Apply KYC filter
    if (kycFilter !== 'all') {
      filtered = filtered.filter(vendor => vendor.kyc_status === kycFilter)
    }

    // Apply zone filter
    if (zoneFilter !== 'all') {
      filtered = filtered.filter(vendor => vendor.zones?.id === zoneFilter)
    }

    return filtered
  }, [vendors, search, statusFilter, kycFilter, zoneFilter])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      pending: 'secondary',
      unavailable: 'secondary',
      suspended: 'destructive',
    }
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getKycBadge = (kycStatus: string) => {
    if (kycStatus === 'approved') {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
    }
    if (kycStatus === 'rejected') {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
    }
    return <Badge variant="secondary">Pending</Badge>
  }

  return (
    <div className="dashboard-page-content space-y-6">
      {/* Header */}
      <div className="dashboard-page-header flex items-center justify-between flex-wrap gap-4 border-b theme-border-color px-4 py-3 md:py-5 md:px-3 lg:px-6 lg:py-4">
        <div>
          <h1 className="theme-h4">Vendor Management</h1>
          <p className="theme-fc-light mt-1">Review and manage vendor applications</p>
        </div>
      </div>

      <div className="page-content p-4 md:p-5 lg:p-6 space-y-8">

        {/* Filters */}
        <div className="box p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by vendor name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            {/* KYC Status Filter */}
            <Select value={kycFilter} onValueChange={setKycFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All KYC Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All KYC Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Zone Filter */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={zoneFilter} onValueChange={setZoneFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Zones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                {zones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id}>
                    {zone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Vendor Table */}
        <div className="box overflow-hidden">
          {filteredVendors.length === 0 ? (
            <div className="text-center py-12">
              <Store className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="theme-fc-light">No vendors found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="theme-bg-secondary border-b theme-border-color">
                  <tr>
                    <th className="text-left p-4 font-semibold theme-fc-heading">Vendor</th>
                    <th className="text-left p-4 font-semibold theme-fc-heading">Zone</th>
                    <th className="text-left p-4 font-semibold theme-fc-heading">Status</th>
                    <th className="text-left p-4 font-semibold theme-fc-heading">KYC Status</th>
                    <th className="text-left p-4 font-semibold theme-fc-heading">Rating</th>
                    <th className="text-left p-4 font-semibold theme-fc-heading">Created</th>
                    <th className="text-left p-4 font-semibold theme-fc-heading">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVendors.map((vendor) => {
                    const zone = vendor.zones
                    return (
                      <tr
                        key={vendor.id}
                        className="border-b theme-border-color hover:theme-bg-secondary transition-colors cursor-pointer"
                        onClick={() => router.push(`/admin/vendor/${vendor.id}`)}
                      >
                        <td className="p-4">
                          <div className="font-medium theme-fc-heading">{vendor.display_name}</div>
                        </td>
                        <td className="p-4 theme-fc-light">
                          {zone?.name || 'N/A'}
                        </td>
                        <td className="p-4">
                          {getStatusBadge(vendor.status)}
                        </td>
                        <td className="p-4">
                          {getKycBadge(vendor.kyc_status)}
                        </td>
                        <td className="p-4 theme-fc-light">
                          {vendor.rating_avg ? (
                            <span>
                              ⭐ {vendor.rating_avg.toFixed(1)} ({vendor.rating_count})
                            </span>
                          ) : (
                            <span>No ratings</span>
                          )}
                        </td>
                        <td className="p-4 theme-fc-light text-sm">
                          {new Date(vendor.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </td>
                        <td className="p-4">
                          <Link
                            href={`/admin/vendor/${vendor.id}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

    </div>
  )
}

