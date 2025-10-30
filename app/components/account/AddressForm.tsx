'use client'

/**
 * Address Form Component
 * Form for adding/editing addresses with Google Maps integration
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createAddress, updateAddress } from '@/lib/actions/address-actions'
import { toast } from 'sonner'
import { MapPin, X } from 'lucide-react'

interface Address {
  id?: string
  label: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  lat?: number
  lng?: number
  is_default?: boolean
}

interface AddressFormProps {
  address?: Address | null
  onSuccess: () => void
  onCancel: () => void
  isOpen: boolean
}

const addressLabels = [
  { value: 'home', label: 'Home' },
  { value: 'office', label: 'Office' },
  { value: 'pg', label: 'PG/Hostel' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'other', label: 'Other' }
]

export function AddressForm({ address, onSuccess, onCancel, isOpen }: AddressFormProps) {
  const [formData, setFormData] = useState<Address>({
    label: 'home',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    lat: undefined,
    lng: undefined
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form data when address changes
  useEffect(() => {
    if (address) {
      setFormData(address)
    } else {
      setFormData({
        label: 'home',
        line1: '',
        line2: '',
        city: '',
        state: '',
        pincode: '',
        lat: undefined,
        lng: undefined
      })
    }
  }, [address])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      let result
      if (address?.id) {
        // Update existing address
        result = await updateAddress(address.id, formData)
      } else {
        // Create new address
        result = await createAddress(formData)
      }

      if (result.success) {
        toast.success(address?.id ? 'Address updated successfully' : 'Address added successfully')
        onSuccess()
      } else {
        toast.error(result.error || 'Failed to save address')
      }
    } catch (error) {
      console.error('Address form error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof Address, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePincodeChange = (value: string) => {
    // Only allow digits and limit to 6 characters
    const numericValue = value.replace(/\D/g, '').slice(0, 6)
    setFormData(prev => ({
      ...prev,
      pincode: numericValue
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold theme-fc-heading">
              {address?.id ? 'Edit Address' : 'Add New Address'}
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Address Label */}
            <div>
              <Label htmlFor="label" className="text-sm font-medium theme-fc-heading">
                Address Label
              </Label>
              <select
                id="label"
                value={formData.label}
                onChange={(e) => handleInputChange('label', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-100 theme-bg-color theme-border-color theme-fc-body"
                required
              >
                {addressLabels.map((label) => (
                  <option key={label.value} value={label.value}>
                    {label.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Address Line 1 */}
            <div>
              <Label htmlFor="line1" className="text-sm font-medium theme-fc-heading">
                Address Line 1 *
              </Label>
              <Input
                id="line1"
                type="text"
                value={formData.line1}
                onChange={(e) => handleInputChange('line1', e.target.value)}
                placeholder="Street address, building name, etc."
                required
                className="mt-1"
              />
            </div>

            {/* Address Line 2 */}
            <div>
              <Label htmlFor="line2" className="text-sm font-medium theme-fc-heading">
                Address Line 2
              </Label>
              <Input
                id="line2"
                type="text"
                value={formData.line2 || ''}
                onChange={(e) => handleInputChange('line2', e.target.value)}
                placeholder="Apartment, suite, unit, etc. (optional)"
                className="mt-1"
              />
            </div>

            {/* City and State */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city" className="text-sm font-medium theme-fc-heading">
                  City *
                </Label>
                <Input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="City"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="state" className="text-sm font-medium theme-fc-heading">
                  State *
                </Label>
                <Input
                  id="state"
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="State"
                  required
                  className="mt-1"
                />
              </div>
            </div>

            {/* Pincode */}
            <div>
              <Label htmlFor="pincode" className="text-sm font-medium theme-fc-heading">
                Pincode *
              </Label>
              <Input
                id="pincode"
                type="text"
                value={formData.pincode}
                onChange={(e) => handlePincodeChange(e.target.value)}
                placeholder="6-digit pincode"
                maxLength={6}
                required
                className="mt-1"
              />
            </div>

            {/* Google Maps Integration Placeholder */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-2 text-sm theme-fc-light">
                <MapPin className="w-4 h-4" />
                <span>Google Maps integration coming soon</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : (address?.id ? 'Update' : 'Add')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
