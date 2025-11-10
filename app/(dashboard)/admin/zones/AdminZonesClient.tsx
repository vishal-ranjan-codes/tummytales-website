'use client'

/**
 * Admin Zones Client Component
 * Handles zone management with CRUD operations
 */

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { MapPin, Plus, Edit, Trash2, Power } from 'lucide-react'
import { toast } from 'sonner'
import {
  createZone,
  updateZone,
  toggleZoneActive,
  deleteZone,
} from '@/lib/admin/zone-actions'
import type { AdminZonesData, AdminZone } from '@/lib/auth/data-fetchers'

interface AdminZonesClientProps {
  initialData: AdminZonesData
}

export default function AdminZonesClient({ initialData }: AdminZonesClientProps) {
  const [zones, setZones] = useState(initialData.zones)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingZone, setEditingZone] = useState<AdminZone | null>(null)
  const [zoneName, setZoneName] = useState('')

  const loadZones = useCallback(async () => {
    const supabase = createClient()

    // Fetch zones
    const { data: zonesData, error: zonesError } = await supabase
      .from('zones')
      .select('*')
      .order('name', { ascending: true })

    if (zonesError) {
      console.error('Error fetching zones:', zonesError)
      toast.error('Failed to load zones')
      return
    }

    // Fetch vendor counts per zone
    const { data: vendorsData, error: vendorsError } = await supabase
      .from('vendors')
      .select('zone_id')

    if (vendorsError) {
      console.error('Error fetching vendor counts:', vendorsError)
      toast.error('Failed to load vendor counts')
      // Continue with zones but vendorCount will be 0
    }

    // Count vendors per zone
    const vendorCounts = new Map<string, number>()
    if (vendorsData) {
      vendorsData.forEach(vendor => {
        if (vendor.zone_id) {
          vendorCounts.set(vendor.zone_id, (vendorCounts.get(vendor.zone_id) || 0) + 1)
        }
      })
    }

    // Transform zones with vendor counts
    const transformedZones = (zonesData || []).map(zone => ({
      id: zone.id,
      name: zone.name,
      polygon: zone.polygon,
      active: zone.active,
      created_at: zone.created_at,
      updated_at: zone.updated_at,
      vendorCount: vendorCounts.get(zone.id) || 0,
    })) as AdminZone[]

    setZones(transformedZones)
  }, [])

  const handleCreate = async () => {
    if (!zoneName.trim()) {
      toast.error('Zone name is required')
      return
    }

    setActionLoading('create')
    const result = await createZone(zoneName.trim())
    if (result.success) {
      toast.success('Zone created successfully')
      setShowCreateDialog(false)
      setZoneName('')
      await loadZones()
    } else {
      toast.error(result.error || 'Failed to create zone')
    }
    setActionLoading(null)
  }

  const handleEdit = (zone: AdminZone) => {
    setEditingZone(zone)
    setZoneName(zone.name)
  }

  const handleUpdate = async () => {
    if (!editingZone || !zoneName.trim()) {
      toast.error('Zone name is required')
      return
    }

    setActionLoading(editingZone.id)
    const result = await updateZone(editingZone.id, { name: zoneName.trim() })
    if (result.success) {
      toast.success('Zone updated successfully')
      setEditingZone(null)
      setZoneName('')
      await loadZones()
    } else {
      toast.error(result.error || 'Failed to update zone')
    }
    setActionLoading(null)
  }

  const handleToggleActive = async (zoneId: string) => {
    setActionLoading(zoneId)
    const result = await toggleZoneActive(zoneId)
    if (result.success) {
      toast.success('Zone status updated')
      await loadZones()
    } else {
      toast.error(result.error || 'Failed to update zone status')
    }
    setActionLoading(null)
  }

  const handleDelete = async (zoneId: string) => {
    setActionLoading(zoneId)
    const result = await deleteZone(zoneId)
    if (result.success) {
      toast.success('Zone deleted')
      await loadZones()
    } else {
      toast.error(result.error || 'Failed to delete zone')
    }
    setActionLoading(null)
  }

  return (
    <div className="dashboard-page-content space-y-6">
      {/* Header */}
      <div className="dashboard-page-header flex items-center justify-between flex-wrap gap-4 border-b theme-border-color px-4 py-3 md:py-5 md:px-3 lg:px-6 lg:py-4">
        <div>
          <h1 className="theme-h4">Zone Management</h1>
          <p className="theme-fc-light mt-1">Manage operational zones</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Zone
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Zone</DialogTitle>
              <DialogDescription>
                Add a new operational zone. Polygon boundaries can be added later.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="zone-name">Zone Name *</Label>
                <Input
                  id="zone-name"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  placeholder="e.g., Delhi NCR, South Delhi"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false)
                  setZoneName('')
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={actionLoading === 'create' || !zoneName.trim()}
              >
                {actionLoading === 'create' ? 'Creating...' : 'Create Zone'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="page-content p-4 md:p-5 lg:p-6 space-y-8">
        {/* Zones List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="theme-fc-light">No zones found</p>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="mt-4"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Zone
              </Button>
            </div>
          ) : (
            zones.map((zone) => (
              <div key={zone.id} className="box p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-5 h-5 theme-fc-light" />
                      <h3 className="text-lg font-semibold theme-fc-heading">{zone.name}</h3>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={zone.active ? 'default' : 'secondary'}>
                        {zone.active ? 'Active' : 'Inactive'}
                      </Badge>
                      <span className="text-sm theme-fc-light">
                        {zone.vendorCount} vendor(s)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(zone)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Zone</DialogTitle>
                        <DialogDescription>
                          Update zone name. Polygon editing coming soon.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="edit-zone-name">Zone Name *</Label>
                          <Input
                            id="edit-zone-name"
                            value={zoneName}
                            onChange={(e) => setZoneName(e.target.value)}
                            placeholder="Zone name"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingZone(null)
                            setZoneName('')
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleUpdate}
                          disabled={actionLoading === zone.id || !zoneName.trim()}
                        >
                          {actionLoading === zone.id ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(zone.id)}
                    disabled={actionLoading === zone.id}
                    className={zone.active ? 'text-orange-600' : 'text-green-600'}
                  >
                    <Power className="w-4 h-4 mr-1" />
                    {zone.active ? 'Deactivate' : 'Activate'}
                  </Button>

                  {!zone.active && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actionLoading === zone.id}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Zone</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {zone.name}? This action cannot be undone.
                            The zone will be permanently removed if there are no active vendors.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(zone.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  )
}

