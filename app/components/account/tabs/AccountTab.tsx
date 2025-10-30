'use client'

/**
 * Account Tab Component
 * Account statistics, data export, and account deletion
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { exportUserData, getAccountStats } from '@/lib/actions/account-actions'
import { DeleteAccountModal } from '../DeleteAccountModal'
import { useAuth } from '@/lib/contexts/AuthContext'
import { toast } from 'sonner'
import { Download, Trash2, Calendar, User, MapPin, AlertTriangle, Info } from 'lucide-react'

interface AccountTabProps {
  className?: string
}

interface AccountStats {
  member_since: string
  account_age_days: number
  roles: string[]
  address_count: number
  account_status: string
}

export function AccountTab({ className = '' }: AccountTabProps) {
  const { profile, loading } = useAuth()
  const [stats, setStats] = useState<AccountStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const result = await getAccountStats()
        if (result.success) {
          setStats(result.data as AccountStats)
        } else {
          toast.error(result.error || 'Failed to fetch account statistics')
        }
      } catch (error) {
        console.error('Fetch stats error:', error)
        toast.error('An unexpected error occurred')
      } finally {
        setIsLoadingStats(false)
      }
    }

    fetchStats()
  }, [])

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const result = await exportUserData()
      if (result.success) {
        // Create and download JSON file
        const dataStr = JSON.stringify(result.data, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `tummy-tales-data-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        toast.success('Data exported successfully')
      } else {
        toast.error(result.error || 'Failed to export data')
      }
    } catch (error) {
      console.error('Export data error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteSuccess = () => {
    // User will be redirected by the delete action
    toast.success('Account deletion initiated')
  }

  if (loading || isLoadingStats) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-100" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="theme-fc-light">Profile not found</p>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Account Statistics */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold theme-fc-heading flex items-center gap-2">
          <User className="w-5 h-5" />
          Account Statistics
        </h3>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg theme-border-color">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium theme-fc-heading">Member Since</p>
                  <p className="text-sm theme-fc-light">
                    {new Date(stats.member_since).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-xs theme-fc-light">
                    {stats.account_age_days} days ago
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg theme-border-color">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium theme-fc-heading">Addresses</p>
                  <p className="text-sm theme-fc-light">
                    {stats.address_count} saved address{stats.address_count !== 1 ? 'es' : ''}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg theme-border-color">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium theme-fc-heading">Roles</p>
                  <p className="text-sm theme-fc-light">
                    {stats.roles.length} role{stats.roles.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs theme-fc-light">
                    {stats.roles.join(', ')}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg theme-border-color">
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-medium theme-fc-heading">Status</p>
                  <p className="text-sm theme-fc-light capitalize">
                    {stats.account_status}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data Export */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold theme-fc-heading flex items-center gap-2">
          <Download className="w-5 h-5" />
          Data Export
        </h3>

        <div className="p-4 border rounded-lg theme-border-color">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium theme-fc-heading mb-2">
                Download Your Data
              </h4>
              <p className="text-sm theme-fc-light mb-3">
                Export all your account data including profile information, 
                addresses, and role-specific data in JSON format.
              </p>
              <Button
                onClick={handleExportData}
                disabled={isExporting}
                variant="outline"
                className="gap-2"
              >
                {isExporting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {isExporting ? 'Exporting...' : 'Export Data'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Account Deletion */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold theme-fc-heading flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          Account Deletion
        </h3>

        <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">
                Delete Your Account
              </h4>
              <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                This action will permanently delete your account and all associated data. 
                You will have 30 days to restore your account before permanent deletion.
              </p>
              <Button
                onClick={() => setIsDeleteModalOpen(true)}
                variant="destructive"
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Account Deletion Modal */}
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  )
}
