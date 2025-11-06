'use client'

/**
 * Admin Users Client Component
 * Handles user management with search, filters, and CRUD operations
 */

import { useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Search, Users, Ban, CheckCircle, LogOut, Settings } from 'lucide-react'
import { toast } from 'sonner'
import {
  suspendUser,
  unsuspendUser,
  updateUserRoles,
  forceLogoutUser,
} from '@/lib/admin/user-actions'
import type { AdminUsersData, AdminUser } from '@/lib/auth/data-fetchers'

interface AdminUsersClientProps {
  initialData: AdminUsersData
}

export default function AdminUsersClient({ initialData }: AdminUsersClientProps) {
  const [users, setUsers] = useState(initialData.users)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // Role edit dialog state
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)

  // Client-side filtering
  const filteredUsers = useMemo(() => {
    let filtered = [...users]

    // Apply search
    if (search.trim()) {
      const searchLower = search.trim().toLowerCase()
      filtered = filtered.filter(user => 
        user.full_name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.phone?.includes(searchLower)
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.account_status === statusFilter)
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.roles?.includes(roleFilter))
    }

    return filtered
  }, [users, search, statusFilter, roleFilter])

  const loadUsers = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        phone,
        roles,
        account_status,
        created_at,
        vendors (id, display_name),
        riders (id)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } else {
      setUsers((data || []) as AdminUser[])
    }
  }, [])

  const handleSuspend = async (userId: string) => {
    setActionLoading(userId)
    try {
      const result = await suspendUser(userId)
      if (result?.success) {
        toast.success('User suspended')
        await loadUsers()
      } else {
        toast.error(result?.error || 'Failed to suspend user')
      }
    } catch (error) {
      console.error('Error suspending user:', error)
      toast.error('An unexpected error occurred while suspending user')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnsuspend = async (userId: string) => {
    setActionLoading(userId)
    try {
      const result = await unsuspendUser(userId)
      if (result?.success) {
        toast.success('User unsuspended')
        await loadUsers()
      } else {
        toast.error(result?.error || 'Failed to unsuspend user')
      }
    } catch (error) {
      console.error('Error unsuspending user:', error)
      toast.error('An unexpected error occurred while unsuspending user')
    } finally {
      setActionLoading(null)
    }
  }

  const handleForceLogout = async (userId: string) => {
    setActionLoading(userId)
    try {
      const result = await forceLogoutUser(userId)
      if (result?.success) {
        toast.success('User logged out (sessions invalidated)')
      } else {
        toast.error(result?.error || 'Failed to logout user')
      }
    } catch (error) {
      console.error('Error force logging out user:', error)
      toast.error('An unexpected error occurred while logging out user')
    } finally {
      setActionLoading(null)
    }
  }

  const handleEditRoles = (user: AdminUser) => {
    setEditingUser(user)
    setSelectedRoles(user.roles ? [...user.roles] : [])
    setRoleDialogOpen(true)
  }

  const handleSaveRoles = async () => {
    if (!editingUser) return

    setActionLoading(editingUser.id)
    try {
      const result = await updateUserRoles(editingUser.id, selectedRoles)
      if (result?.success) {
        toast.success('Roles updated')
        setEditingUser(null)
        setSelectedRoles([])
        setRoleDialogOpen(false)
        await loadUsers()
      } else {
        toast.error(result?.error || 'Failed to update roles')
      }
    } catch (error) {
      console.error('Error updating roles:', error)
      toast.error('An unexpected error occurred while updating roles')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelRoles = () => {
    setEditingUser(null)
    setSelectedRoles([])
    setRoleDialogOpen(false)
  }

  const toggleRole = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    )
  }

  const getRoleBadges = (roles: string[]) => {
    const roleColors: Record<string, string> = {
      customer: 'bg-blue-500',
      vendor: 'bg-green-500',
      rider: 'bg-purple-500',
      admin: 'bg-red-500',
    }

    return roles.map(role => (
      <Badge key={role} className={roleColors[role] || 'bg-gray-500'}>
        {role}
      </Badge>
    ))
  }

  const validRoles = ['customer', 'vendor', 'rider', 'admin']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold theme-fc-heading mb-2">User Management</h1>
        <p className="theme-fc-light">Manage all platform users</p>
      </div>

      {/* Filters */}
      <div className="box p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or phone..."
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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="deleted">Deleted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Role Filter */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="vendor">Vendor</SelectItem>
              <SelectItem value="rider">Rider</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Edit Roles Dialog - Single dialog for all users */}
      <Dialog open={roleDialogOpen} onOpenChange={(open) => {
        if (!open) {
          handleCancelRoles()
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Roles</DialogTitle>
            <DialogDescription>
              Select the roles for {editingUser?.full_name || 'user'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {validRoles.map((role) => (
              <div key={role} className="flex items-center space-x-2">
                <Checkbox
                  id={`role-${role}-${editingUser?.id || ''}`}
                  checked={selectedRoles.includes(role)}
                  onCheckedChange={() => toggleRole(role)}
                />
                <Label
                  htmlFor={`role-${role}-${editingUser?.id || ''}`}
                  className="cursor-pointer capitalize"
                >
                  {role}
                </Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelRoles}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveRoles}
              disabled={actionLoading === editingUser?.id || selectedRoles.length === 0}
            >
              {actionLoading === editingUser?.id ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Users Table */}
      <div className="box overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="theme-fc-light">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="theme-bg-secondary border-b theme-border-color">
                <tr>
                  <th className="text-left p-4 font-semibold theme-fc-heading">User</th>
                  <th className="text-left p-4 font-semibold theme-fc-heading">Contact</th>
                  <th className="text-left p-4 font-semibold theme-fc-heading">Roles</th>
                  <th className="text-left p-4 font-semibold theme-fc-heading">Status</th>
                  <th className="text-left p-4 font-semibold theme-fc-heading">Associated</th>
                  <th className="text-left p-4 font-semibold theme-fc-heading">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isSuspended = user.account_status === 'suspended'
                  const isAdmin = user.roles?.includes('admin')
                  
                  return (
                    <tr
                      key={user.id}
                      className="border-b theme-border-color hover:theme-bg-secondary transition-colors"
                    >
                      <td className="p-4">
                        <div className="font-medium theme-fc-heading">{user.full_name}</div>
                        <div className="text-xs theme-fc-light">ID: {user.id.slice(0, 8)}...</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm theme-fc-light">
                          {user.email && <div>{user.email}</div>}
                          {user.phone && <div>{user.phone}</div>}
                          {!user.email && !user.phone && <span className="text-gray-400">No contact info</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {getRoleBadges(user.roles || [])}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={isSuspended ? 'destructive' : 'default'}>
                          {user.account_status}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm theme-fc-light">
                        {user.vendors && user.vendors.length > 0 && (
                          <div>Vendor: {user.vendors[0].display_name}</div>
                        )}
                        {user.riders && user.riders.length > 0 && (
                          <div>Rider: Yes</div>
                        )}
                        {(!user.vendors || user.vendors.length === 0) &&
                          (!user.riders || user.riders.length === 0) && (
                            <span className="text-gray-400">None</span>
                          )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditRoles(user)}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>

                          {isSuspended ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnsuspend(user.id)}
                              disabled={actionLoading === user.id}
                              className="text-green-600"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          ) : (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={actionLoading === user.id}
                                  className="text-red-600"
                                >
                                  <Ban className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Suspend User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to suspend {user.full_name}? This will also suspend any associated vendor or rider accounts.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleSuspend(user.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Suspend
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}

                          {!isAdmin && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={actionLoading === user.id}
                                >
                                  <LogOut className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Force Logout</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Force {user.full_name} to logout from all sessions? This requires Supabase Admin API for full implementation.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleForceLogout(user.id)}>
                                    Logout
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
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
  )
}

