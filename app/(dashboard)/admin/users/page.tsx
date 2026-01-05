'use client';

/**
 * Enhanced User Management Page
 * Role-based user management with permission checks
 */

import React, { useState, useEffect, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/lib/rbac/permissions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Search, Shield, UserCog, Check } from 'lucide-react';
import { updateUserRoles } from '@/lib/actions/users';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string;
  role: string;
  roles: string[] | null;
  is_super_admin: boolean;
  created_at: string;
}

const ROLE_TIERS: Record<string, number> = {
  super_admin: 1,
  admin: 2,
  product_manager: 3,
  developer: 4,
  operations: 4,
  customer: 5,
  vendor: 5,
  rider: 5
};

export default function UserManagementPage() {
  const { role: actorPrimaryRole, isSuperAdmin: actorIsSuperAdmin } = usePermissions();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const supabase = createClient();

  // Role options
  const roleOptions = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'admin', label: 'Admin' },
    { value: 'product_manager', label: 'Product Manager' },
    { value: 'developer', label: 'Developer' },
    { value: 'operations', label: 'Operations' },
    { value: 'customer', label: 'Customer' },
    { value: 'vendor', label: 'Vendor' },
    { value: 'rider', label: 'Rider' },
  ];

  // Hierarchy Logic: Determine Actor Rank
  const actorRank = actorIsSuperAdmin ? 1 : (ROLE_TIERS[actorPrimaryRole] || 5);

  useEffect(() => {
    async function fetchUsers() {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, roles, is_super_admin, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Failed to load users');
      } else {
        setUsers(data as UserProfile[]);
      }
      setLoading(false);
    }

    fetchUsers();
  }, [supabase]);

  const handleToggleRole = (user: UserProfile, toggledRole: string) => {
    const currentRoles = user.roles || [user.role || 'customer'];
    let nextRoles: string[];

    if (currentRoles.includes(toggledRole)) {
      // Don't allow removing the last role
      if (currentRoles.length <= 1) {
        toast.error('User must have at least one role');
        return;
      }
      nextRoles = currentRoles.filter(r => r !== toggledRole);
    } else {
      nextRoles = [...currentRoles, toggledRole];
    }

    startTransition(async () => {
      try {
        await updateUserRoles(user.id, nextRoles);
        toast.success(`Roles updated for ${user.full_name || user.email}`);

        // Optimize: Sort next roles by tier for display
        const sorted = [...nextRoles].sort((a, b) => (ROLE_TIERS[a] || 5) - (ROLE_TIERS[b] || 5));

        setUsers(prev => prev.map(u =>
          u.id === user.id ? { ...u, roles: nextRoles, role: sorted[0] } : u
        ));
      } catch (error: any) {
        toast.error(error.message || 'Failed to update roles');
      }
    });
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' ||
      user.role === roleFilter ||
      (user.roles && user.roles.includes(roleFilter));

    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 theme-text-primary-color-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="border-b theme-border-color pb-4">
        <h2 className="theme-h2 tracking-tight">User Management</h2>
        <p className="theme-fc-light mt-1 text-sm">Restored Multi-role support with Tiered Authorization Matrix</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 theme-fc-lighter" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roleOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <div className="box overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-900/50">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Active Roles</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => {
              const userRoles = user.roles || [user.role || 'customer'];
              const targetRank = user.is_super_admin ? 1 : Math.min(...userRoles.map(r => ROLE_TIERS[r] || 5));

              // TIERED AUTH LOGIC
              // 1. Super Admin can manage anyone
              // 2. Others cannot manage anyone of equal or higher rank
              const isSuperiorOrEqual = actorRank !== 1 && actorRank >= targetRank;
              const canEdit = !isSuperiorOrEqual && actorRank < 4;

              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium theme-fc-heading">
                    <div className="flex items-center gap-2">
                      {user.full_name || 'N/A'}
                      {user.is_super_admin && <Shield className="h-4 w-4 text-orange-500 fill-orange-500/10" />}
                    </div>
                  </TableCell>
                  <TableCell className="theme-fc-base">{user.email || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {userRoles.map(r => (
                        <Badge key={r} variant="secondary" className="capitalize text-[10px] px-2 py-0 h-5">
                          {r.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="theme-fc-light text-sm">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {canEdit ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <UserCog className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2" align="end">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase px-2 py-1 mb-1 tracking-wider">
                            Manage Roles
                          </p>
                          <div className="space-y-1">
                            {roleOptions.map((opt) => {
                              const isChecked = userRoles.includes(opt.value);
                              const optRank = ROLE_TIERS[opt.value];

                              // RESTRICTION CHECK
                              // Actor cannot assign a role higher or equal to their own rank (unless Super Admin)
                              let isDisabled = actorRank !== 1 && actorRank >= optRank;

                              // PM Specific restriction (Tier 3 can only manage Tier 4 and Tier 5)
                              if (actorRank === 3 && optRank < 4) isDisabled = true;

                              return (
                                <div
                                  key={opt.value}
                                  className={cn(
                                    "flex items-center space-x-2 px-2 py-1.5 rounded-sm transition-colors",
                                    isDisabled ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-100 cursor-pointer"
                                  )}
                                  onClick={() => !isDisabled && !isPending && handleToggleRole(user, opt.value)}
                                >
                                  <div className={cn(
                                    "h-4 w-4 rounded border border-primary flex items-center justify-center",
                                    isChecked ? "bg-primary text-primary-foreground" : "bg-transparent"
                                  )}>
                                    {isChecked && <Check className="h-3 w-3" />}
                                  </div>
                                  <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    {opt.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <Shield className="h-4 w-4 theme-fc-lighter" />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filteredUsers.length === 0 && (
          <div className="py-12 text-center theme-fc-light">
            No users found matching your filters
          </div>
        )}
      </div>
    </div>
  );
}
