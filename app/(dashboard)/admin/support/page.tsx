/**
 * Admin Support Page (Server Component)
 * Support management for administrators
 * Uses Native React Server Components pattern
 */

import { requireRole } from '@/lib/auth/server'
import ComingSoon from '@/app/components/ui/ComingSoon'
import { Mail, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function AdminSupportPage() {
  // Require admin role
  await requireRole('admin')

  return (
    <div className="space-y-6">
      <ComingSoon
        title="Support Management"
        message="Support management coming in Phase 3"
        phase="Phase 3"
      />
      
      <div className="box p-6 max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold theme-fc-heading mb-4">Need Help?</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 theme-text-primary-color-100" />
            <div>
              <p className="font-medium theme-fc-heading">Email Support</p>
              <p className="text-sm theme-fc-light">support@tummytales.com</p>
            </div>
            <Button variant="outline" size="sm" className="ml-auto">
              Send Email
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 theme-text-primary-color-100" />
            <div>
              <p className="font-medium theme-fc-heading">Phone Support</p>
              <p className="text-sm theme-fc-light">+91 1800-XXX-XXXX</p>
            </div>
            <Button variant="outline" size="sm" className="ml-auto">
              Call Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
