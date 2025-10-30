'use client'

/**
 * Address Card Component
 * Display address with edit/delete actions and default badge
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { deleteAddress, setDefaultAddress } from '@/lib/actions/address-actions'
import { toast } from 'sonner'
import { MapPin, Edit, Trash2, Star, StarOff } from 'lucide-react'

interface Address {
  id: string
  label: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  is_default: boolean
  created_at: string
}

interface AddressCardProps {
  address: Address
  onEdit: (address: Address) => void
  onUpdate: () => void
  className?: string
}

const labelColors = {
  home: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  office: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  pg: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  kitchen: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
}

const labelNames = {
  home: 'Home',
  office: 'Office',
  pg: 'PG/Hostel',
  kitchen: 'Kitchen',
  other: 'Other'
}

export function AddressCard({ address, onEdit, onUpdate, className = '' }: AddressCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSettingDefault, setIsSettingDefault] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this address?')) {
      return
    }

    setIsDeleting(true)
    try {
      const result = await deleteAddress(address.id)
      if (result.success) {
        toast.success('Address deleted successfully')
        onUpdate()
      } else {
        toast.error(result.error || 'Failed to delete address')
      }
    } catch (error) {
      console.error('Delete address error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSetDefault = async () => {
    setIsSettingDefault(true)
    try {
      const result = await setDefaultAddress(address.id)
      if (result.success) {
        toast.success('Default address updated')
        onUpdate()
      } else {
        toast.error(result.error || 'Failed to set default address')
      }
    } catch (error) {
      console.error('Set default address error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsSettingDefault(false)
    }
  }

  return (
    <div className={`p-4 border rounded-lg theme-border-color theme-bg-color ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${labelColors[address.label as keyof typeof labelColors]}`}>
            {labelNames[address.label as keyof typeof labelNames]}
          </span>
          {address.is_default && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              <Star className="w-3 h-3" />
              Default
            </span>
          )}
        </div>
        
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(address)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 theme-fc-light mt-0.5 flex-shrink-0" />
          <div className="theme-fc-heading">
            <p className="font-medium">{address.line1}</p>
            {address.line2 && (
              <p className="text-sm theme-fc-light">{address.line2}</p>
            )}
            <p className="text-sm theme-fc-light">
              {address.city}, {address.state} - {address.pincode}
            </p>
          </div>
        </div>
      </div>

      {!address.is_default && (
        <div className="mt-3 pt-3 border-t theme-border-color">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSetDefault}
            disabled={isSettingDefault}
            className="w-full gap-2"
          >
            {isSettingDefault ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
            ) : (
              <StarOff className="w-4 h-4" />
            )}
            Set as Default
          </Button>
        </div>
      )}
    </div>
  )
}
