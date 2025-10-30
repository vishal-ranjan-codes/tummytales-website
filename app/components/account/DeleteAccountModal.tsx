'use client'

/**
 * Delete Account Modal Component
 * Multi-step confirmation for account deletion
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { deleteAccount } from '@/lib/actions/account-actions'
import { toast } from 'sonner'
import { AlertTriangle, X, Shield } from 'lucide-react'

interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function DeleteAccountModal({ isOpen, onClose, onSuccess }: DeleteAccountModalProps) {
  const [step, setStep] = useState(1)
  const [password, setPassword] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const handleClose = () => {
    setStep(1)
    setPassword('')
    setConfirmText('')
    onClose()
  }

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm')
      return
    }

    setIsDeleting(true)
    try {
      const result = await deleteAccount(password)
      if (result.success) {
        toast.success('Account deletion initiated. You will be signed out.')
        onSuccess()
      } else {
        toast.error(result.error || 'Failed to delete account')
      }
    } catch (error) {
      console.error('Delete account error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-semibold theme-fc-heading">
                Delete Account
              </h3>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Step 1: Warning */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">
                      Important: Account Deletion
                    </h4>
                    <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                      <li>• Your account will be marked as deleted immediately</li>
                      <li>• You will be signed out and cannot log in</li>
                      <li>• All your data will be permanently deleted after 30 days</li>
                      <li>• This action cannot be undone after 30 days</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  30-Day Grace Period
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  You can restore your account within 30 days by contacting support. 
                  After 30 days, all data will be permanently deleted.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setStep(2)}
                  className="flex-1"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Password Confirmation */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h4 className="font-medium theme-fc-heading mb-2">
                  Confirm Your Password
                </h4>
                <p className="text-sm theme-fc-light">
                  Enter your password to confirm account deletion
                </p>
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium theme-fc-heading">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="mt-1"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setStep(3)}
                  disabled={!password}
                  className="flex-1"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Final Confirmation */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h4 className="font-medium theme-fc-heading mb-2">
                  Final Confirmation
                </h4>
                <p className="text-sm theme-fc-light mb-4">
                  Type <strong>DELETE</strong> to confirm account deletion
                </p>
              </div>

              <div>
                <Label htmlFor="confirm" className="text-sm font-medium theme-fc-heading">
                  Type DELETE to confirm
                </Label>
                <Input
                  id="confirm"
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder="DELETE"
                  className="mt-1"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={confirmText !== 'DELETE' || isDeleting}
                  className="flex-1"
                >
                  {isDeleting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Deleting...
                    </div>
                  ) : (
                    'Delete Account'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
