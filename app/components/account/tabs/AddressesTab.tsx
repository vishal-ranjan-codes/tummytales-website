'use client'

/**
 * Addresses Tab Component
 * Address management with CRUD operations
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { getUserAddresses } from '@/lib/actions/address-actions'
import { AddressForm } from '../AddressForm'
import { AddressCard } from '../AddressCard'
import { toast } from 'sonner'
import { MapPin, Plus, AlertCircle } from 'lucide-react'

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

interface AddressesTabProps {
  className?: string
}

export function AddressesTab({ className = '' }: AddressesTabProps) {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)

  const fetchAddresses = async () => {
    try {
      const result = await getUserAddresses()
      if (result.success) {
        setAddresses(result.data as Address[])
      } else {
        toast.error(result.error || 'Failed to fetch addresses')
      }
    } catch (error) {
      console.error('Fetch addresses error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAddresses()
  }, [])

  const handleAddAddress = () => {
    setEditingAddress(null)
    setIsFormOpen(true)
  }

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address)
    setIsFormOpen(true)
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setEditingAddress(null)
    fetchAddresses() // Refresh the list
  }

  const handleFormCancel = () => {
    setIsFormOpen(false)
    setEditingAddress(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-100" />
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold theme-fc-heading flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Addresses
        </h3>
        <Button onClick={handleAddAddress} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Address
        </Button>
      </div>

      {/* Addresses List */}
      {addresses.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 theme-fc-light mx-auto mb-4" />
          <h4 className="text-lg font-medium theme-fc-heading mb-2">
            No addresses yet
          </h4>
          <p className="theme-fc-light mb-4">
            Add your first address to get started with deliveries
          </p>
          <Button onClick={handleAddAddress} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Your First Address
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={handleEditAddress}
              onUpdate={fetchAddresses}
            />
          ))}
        </div>
      )}

      {/* Address Form Modal */}
      <AddressForm
        address={editingAddress}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
        isOpen={isFormOpen}
      />

      {/* Help Text */}
      {addresses.length > 0 && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Address Management Tips
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Set a default address for quick checkout</li>
                <li>• Keep your addresses updated for accurate deliveries</li>
                <li>• You can have multiple addresses for different purposes</li>
                <li>• Kitchen address is required for vendors</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
