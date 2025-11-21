/**
 * Role-Specific Data Fetchers
 * Server-side data fetching functions for each role's dashboard
 * 
 * All functions return data ready to be passed to Client Components
 * as initialData props, eliminating client-side loading states.
 */

import { createClient } from '@/lib/supabase/server'
import type { Meal } from '@/types/meal'
import type { VendorDeliverySlots } from '@/types/subscription'

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface VendorDashboardData {
  vendor: {
    id: string
    display_name: string
    zone_id: string | null
    status: string
    kyc_status?: string
    rejection_reason?: string
    rating_avg?: number
    rating_count?: number
  } | null
  mealCount: number
  todayOrders?: {
    breakfast: number
    lunch: number
    dinner: number
    scheduled: number
    preparing: number
    ready: number
    total: number
  }
}

export interface VendorMenuData {
  vendorId: string
  meals: {
    breakfast: Meal[]
    lunch: Meal[]
    dinner: Meal[]
  }
}

export interface VendorMedia {
  profile: { id: string; url: string; media_type: string; display_order?: number } | null
  cover: { id: string; url: string; media_type: string; display_order?: number } | null
  gallery: Array<{ id: string; url: string; media_type: string; display_order?: number }>
  intro_video: { id: string; url: string; media_type: string; display_order?: number } | null
}

export interface VendorProfileData {
  vendor: {
    id: string
    display_name: string
    bio: string | null
    veg_only: boolean
    zone_id: string | null
    slug: string | null
    kitchen_address_id: string | null
    delivery_slots: VendorDeliverySlots | null
  } | null
  media: VendorMedia
  zone: { id: string; name: string } | null
  address: {
    id: string
    line1: string
    city: string
    state: string
    pincode: string
  } | null
}

export interface VendorComplianceData {
  vendor: {
    id: string
    kyc_status?: string
    fssai_no?: string
    rejection_reason?: string
  } | null
}

export interface CustomerDashboardData {
  subscriptions: Array<{
    id: string
    vendor: { id: string; display_name: string }
    plan_name: string
    status: string
    next_delivery: string | null
    renewal_date: string | null
  }>
  stats: {
    activeSubscriptions: number
    ordersThisMonth: number
  }
}

export interface RiderDashboardData {
  rider: {
    id: string
    zone_id: string
    vehicle_type: string
    status: string
  } | null
  stats?: {
    deliveriesToday: number
    earningsThisMonth: number
  }
}

export interface AdminDashboardData {
  stats: {
    totalUsers: number
    totalVendors: number
    activeVendors: number
    pendingVendors: number
    totalRiders: number
    activeRiders: number
    totalZones: number
  }
}

export interface AdminUser {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  roles: string[]
  account_status: string
  created_at: string
  vendors?: Array<{ id: string; display_name: string }>
  riders?: Array<{ id: string }>
}

export interface AdminUsersData {
  users: AdminUser[]
}

export interface AdminVendorListItem {
  id: string
  display_name: string
  status: string
  kyc_status: string
  rating_avg: number | null
  rating_count: number
  created_at: string
  zones?: { id: string; name: string } | null
}

export interface AdminVendorsData {
  vendors: AdminVendorListItem[]
  zones: Array<{ id: string; name: string }>
}

export interface AdminZone {
  id: string
  name: string
  polygon: Record<string, unknown> | null
  active: boolean
  created_at: string
  updated_at: string
  vendorCount: number
}

export interface AdminZonesData {
  zones: AdminZone[]
}

export interface AdminVendorDetailData {
  vendor: {
    id: string
    display_name: string
    bio: string | null
    fssai_no: string | null
    status: string
    kyc_status: string
    rejection_reason: string | null
    rating_avg: number | null
    rating_count: number
    veg_only: boolean
    capacity_breakfast: number
    capacity_lunch: number
    capacity_dinner: number
    slug: string | null
    created_at: string
    updated_at: string
    zones?: { id: string; name: string } | null
    addresses?: { id: string; line1: string; city: string; state: string; pincode: string } | null
    vendor_media?: Array<{ id: string; media_type: string; url: string }>
    vendor_docs?: Array<{ id: string; doc_type: string; url: string; verified_by_admin: boolean }>
    meals?: Array<{ id: string; slot: string; name: string; active: boolean }>
  } | null
}

// ============================================
// VENDOR DATA FETCHERS
// ============================================

/**
 * Get vendor dashboard data (home page)
 * Fetches vendor info and meal count
 */
export async function getVendorDashboardData(userId: string): Promise<VendorDashboardData> {
  const supabase = await createClient()

  try {
    // Get vendor data
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendors')
      .select('id, display_name, zone_id, status, kyc_status, rejection_reason, rating_avg, rating_count')
      .eq('user_id', userId)
      .single()

    if (vendorError) {
      // If vendor not found (e.g., user hasn't completed onboarding), return null vendor
      if (vendorError.code === 'PGRST116') {
        // PGRST116 = no rows returned
        console.log('Vendor not found for user:', userId)
        return { vendor: null, mealCount: 0 }
      }
      console.error('Error fetching vendor:', vendorError)
      return { vendor: null, mealCount: 0 }
    }

    // Get meal count and today's orders in parallel if vendor exists
    let mealCount = 0
    const todayOrders = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      scheduled: 0,
      preparing: 0,
      ready: 0,
      total: 0,
    }

    if (vendorData?.id) {
      const today = new Date().toISOString().split('T')[0]
      
      const [mealsResult, ordersResult] = await Promise.all([
        supabase
          .from('meals')
          .select('*', { count: 'exact', head: true })
          .eq('vendor_id', vendorData.id),
        supabase
          .from('orders')
          .select('id, slot, status')
          .eq('vendor_id', vendorData.id)
          .eq('date', today)
          .in('status', ['scheduled', 'preparing', 'ready']),
      ])

      if (!mealsResult.error) {
        mealCount = mealsResult.count || 0
      }

      if (!ordersResult.error && ordersResult.data) {
        const orders = ordersResult.data
        todayOrders.total = orders.length
        orders.forEach((order: { slot: string; status: string }) => {
          if (order.slot === 'breakfast') todayOrders.breakfast++
          if (order.slot === 'lunch') todayOrders.lunch++
          if (order.slot === 'dinner') todayOrders.dinner++
          if (order.status === 'scheduled') todayOrders.scheduled++
          if (order.status === 'preparing') todayOrders.preparing++
          if (order.status === 'ready') todayOrders.ready++
        })
      }
    }

    return {
      vendor: vendorData,
      mealCount,
      todayOrders,
    }
  } catch (error) {
    console.error('Error fetching vendor dashboard data:', error)
    return { vendor: null, mealCount: 0 }
  }
}

/**
 * Get vendor menu data (meals by slot)
 * Groups meals by breakfast/lunch/dinner
 */
export async function getVendorMenuData(userId: string): Promise<VendorMenuData | null> {
  const supabase = await createClient()

  try {
    // First get vendor
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (vendorError || !vendorData) {
      console.error('Error fetching vendor:', vendorError)
      return null
    }

    // Get all meals
    const { data: mealsData, error: mealsError } = await supabase
      .from('meals')
      .select('*')
      .eq('vendor_id', vendorData.id)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (mealsError) {
      console.error('Error fetching meals:', mealsError)
      return null
    }

    // Group by slot
    const grouped = {
      breakfast: (mealsData || []).filter((m: Meal) => m.slot === 'breakfast'),
      lunch: (mealsData || []).filter((m: Meal) => m.slot === 'lunch'),
      dinner: (mealsData || []).filter((m: Meal) => m.slot === 'dinner'),
    }

    return {
      vendorId: vendorData.id,
      meals: grouped,
    }
  } catch (error) {
    console.error('Error fetching vendor menu data:', error)
    return null
  }
}

/**
 * Get vendor profile data (profile page)
 * Fetches vendor, media, zone, and address
 */
export async function getVendorProfileData(userId: string): Promise<VendorProfileData> {
  const supabase = await createClient()

  try {
    // Get vendor with zone and address
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendors')
      .select(`
        id,
        display_name,
        bio,
        veg_only,
        zone_id,
        slug,
        kitchen_address_id,
        delivery_slots,
        zones (id, name),
        addresses!kitchen_address_id (id, line1, city, state, pincode)
      `)
      .eq('user_id', userId)
      .single()

    if (vendorError) {
      console.error('Error fetching vendor:', vendorError)
      return {
        vendor: null,
        media: {
          profile: null,
          cover: null,
          gallery: [],
          intro_video: null,
        },
        zone: null,
        address: null,
      }
    }

    // Get media
    const { data: mediaData } = await supabase
      .from('vendor_media')
      .select('id, url, media_type, display_order')
      .eq('vendor_id', vendorData.id)
      .order('display_order', { ascending: true })

    // Organize media - convert null display_order to undefined
    const normalizeMediaItem = (item: { id: string; url: string; media_type: string; display_order?: number | null }) => ({
      id: item.id,
      url: item.url,
      media_type: item.media_type,
      display_order: item.display_order ?? undefined,
    })

    const media: VendorMedia = {
      profile: (mediaData || []).find(m => m.media_type === 'profile') ? normalizeMediaItem((mediaData || []).find(m => m.media_type === 'profile')!) : null,
      cover: (mediaData || []).find(m => m.media_type === 'cover') ? normalizeMediaItem((mediaData || []).find(m => m.media_type === 'cover')!) : null,
      gallery: (mediaData || []).filter(m => m.media_type === 'gallery').map(normalizeMediaItem),
      intro_video: (mediaData || []).find(m => m.media_type === 'intro_video') ? normalizeMediaItem((mediaData || []).find(m => m.media_type === 'intro_video')!) : null,
    }

    // Extract zone and address (handling array returns from Supabase)
    let zone: { id: string; name: string } | null = null
    if (Array.isArray(vendorData.zones) && vendorData.zones.length > 0) {
      zone = vendorData.zones[0] as unknown as { id: string; name: string }
    } else if (vendorData.zones && typeof vendorData.zones === 'object' && 'id' in vendorData.zones && 'name' in vendorData.zones) {
      zone = vendorData.zones as unknown as { id: string; name: string }
    }
    
    let address: { id: string; line1: string; city: string; state: string; pincode: string } | null = null
    if (Array.isArray(vendorData.addresses) && vendorData.addresses.length > 0) {
      address = vendorData.addresses[0] as unknown as { id: string; line1: string; city: string; state: string; pincode: string }
    } else if (vendorData.addresses && typeof vendorData.addresses === 'object' && 'id' in vendorData.addresses) {
      address = vendorData.addresses as unknown as { id: string; line1: string; city: string; state: string; pincode: string }
    }

    return {
      vendor: {
        id: vendorData.id,
        display_name: vendorData.display_name,
        bio: vendorData.bio,
        veg_only: vendorData.veg_only,
        zone_id: vendorData.zone_id,
        slug: vendorData.slug,
        kitchen_address_id: vendorData.kitchen_address_id,
        delivery_slots: vendorData.delivery_slots as VendorDeliverySlots | null,
      },
      media,
      zone,
      address,
    }
  } catch (error) {
    console.error('Error fetching vendor profile data:', error)
    return {
      vendor: null,
      media: {
        profile: null,
        cover: null,
        gallery: [],
        intro_video: null,
      },
      zone: null,
      address: null,
    }
  }
}

/**
 * Get vendor compliance data
 * Fetches KYC status and compliance info
 */
export async function getVendorComplianceData(userId: string): Promise<VendorComplianceData> {
  const supabase = await createClient()

  try {
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendors')
      .select('id, kyc_status, fssai_no, rejection_reason')
      .eq('user_id', userId)
      .single()

    if (vendorError) {
      // If vendor not found (e.g., user hasn't completed onboarding), return null vendor
      if (vendorError.code === 'PGRST116') {
        // PGRST116 = no rows returned
        console.log('Vendor not found for user:', userId)
        return { vendor: null }
      }
      console.error('Error fetching vendor compliance:', vendorError)
      return { vendor: null }
    }

    if (!vendorData) {
      return { vendor: null }
    }

    return {
      vendor: {
        id: vendorData.id,
        kyc_status: vendorData.kyc_status,
        fssai_no: vendorData.fssai_no,
        rejection_reason: vendorData.rejection_reason,
      },
    }
  } catch (error) {
    console.error('Unexpected error fetching vendor compliance data:', error)
    return { vendor: null }
  }
}

// ============================================
// CUSTOMER DATA FETCHERS
// ============================================

/**
 * Get customer dashboard data
 * Fetches active subscriptions, orders count, and subscription summaries
 */
export async function getCustomerDashboardData(userId: string): Promise<CustomerDashboardData> {
  const supabase = await createClient()

  try {
    // Get current month start date
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const today = now.toISOString().split('T')[0]

    // Fetch active subscriptions count and orders this month in parallel
    const [subscriptionsResult, activeSubscriptionsResult, ordersResult] = await Promise.all([
      // Get active subscriptions with vendor and plan info (limit to 3 for dashboard)
      supabase
        .from('subscriptions')
        .select(`
          id,
          status,
          renews_on,
          vendors(id, display_name),
          plans(id, name)
        `)
        .eq('consumer_id', userId)
        .in('status', ['trial', 'active', 'paused'])
        .order('created_at', { ascending: false })
        .limit(3),
      // Get total active subscriptions count
      supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('consumer_id', userId)
        .in('status', ['trial', 'active', 'paused']),
      // Get orders this month count
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('consumer_id', userId)
        .gte('created_at', monthStart),
    ])

    const activeSubscriptionsCount = activeSubscriptionsResult.count || 0
    const ordersThisMonth = ordersResult.count || 0

    // Process subscription summaries
    const subscriptions: CustomerDashboardData['subscriptions'] = []

    if (subscriptionsResult.data && subscriptionsResult.data.length > 0) {
      // Get next delivery dates for each subscription by checking upcoming orders
      const subscriptionIds = subscriptionsResult.data.map((sub) => sub.id)
      
      const { data: upcomingOrders } = await supabase
        .from('orders')
        .select('subscription_id, date')
        .in('subscription_id', subscriptionIds)
        .gte('date', today)
        .in('status', ['scheduled', 'preparing'])
        .order('date', { ascending: true })

      // Group orders by subscription to find next delivery
      const nextDeliveries = new Map<string, string>()
      if (upcomingOrders) {
        const processedSubs = new Set<string>()
        for (const order of upcomingOrders) {
          if (!processedSubs.has(order.subscription_id)) {
            nextDeliveries.set(order.subscription_id, order.date)
            processedSubs.add(order.subscription_id)
          }
        }
      }

      // Build subscription summaries
      for (const sub of subscriptionsResult.data) {
        const vendor = Array.isArray(sub.vendors) ? sub.vendors[0] : sub.vendors
        const plan = Array.isArray(sub.plans) ? sub.plans[0] : sub.plans

        subscriptions.push({
          id: sub.id,
          vendor: vendor
            ? { id: vendor.id, display_name: vendor.display_name }
            : { id: '', display_name: 'Unknown Vendor' },
          plan_name: plan?.name || 'Unknown Plan',
          status: sub.status,
          next_delivery: nextDeliveries.get(sub.id) || null,
          renewal_date: sub.renews_on || null,
        })
      }
    }

    return {
      subscriptions,
      stats: {
        activeSubscriptions: activeSubscriptionsCount,
        ordersThisMonth,
      },
    }
  } catch (error) {
    console.error('Error fetching customer dashboard data:', error)
    return {
      subscriptions: [],
      stats: {
        activeSubscriptions: 0,
        ordersThisMonth: 0,
      },
    }
  }
}

// ============================================
// RIDER DATA FETCHERS
// ============================================

/**
 * Get rider dashboard data
 * Fetches rider info and stats
 */
export async function getRiderDashboardData(userId: string): Promise<RiderDashboardData> {
  const supabase = await createClient()

  try {
    const { data: riderData, error: riderError } = await supabase
      .from('riders')
      .select('id, zone_id, vehicle_type, status')
      .eq('user_id', userId)
      .maybeSingle()

    if (riderError) {
      console.error('Error fetching rider:', riderError)
      return { 
        rider: null,
        stats: {
          deliveriesToday: 0,
          earningsThisMonth: 0,
        },
      }
    }

    // If no rider record exists, return null rider
    if (!riderData) {
      console.log('Rider not found for user:', userId)
      return { 
        rider: null,
        stats: {
          deliveriesToday: 0,
          earningsThisMonth: 0,
        },
      }
    }

    // TODO: Add stats fetching when orders feature is ready
    return {
      rider: riderData,
      stats: {
        deliveriesToday: 0,
        earningsThisMonth: 0,
      },
    }
  } catch (error) {
    console.error('Error fetching rider dashboard data:', error)
    return { 
      rider: null,
      stats: {
        deliveriesToday: 0,
        earningsThisMonth: 0,
      },
    }
  }
}

// ============================================
// ADMIN DATA FETCHERS
// ============================================

/**
 * Get admin dashboard data (platform stats)
 * Fetches all platform statistics
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getAdminDashboardData(_userId: string): Promise<AdminDashboardData> {
  const supabase = await createClient()

  try {
    // Fetch all stats in parallel
    const [
      { count: totalUsers },
      { count: totalVendors },
      { count: activeVendors },
      { count: pendingVendors },
      { count: totalRiders },
      { count: activeRiders },
      { count: totalZones },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('vendors').select('*', { count: 'exact', head: true }),
      supabase.from('vendors').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('vendors').select('*', { count: 'exact', head: true }).eq('kyc_status', 'pending'),
      supabase.from('riders').select('*', { count: 'exact', head: true }),
      supabase.from('riders').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('zones').select('*', { count: 'exact', head: true }).eq('active', true),
    ])

    return {
      stats: {
        totalUsers: totalUsers || 0,
        totalVendors: totalVendors || 0,
        activeVendors: activeVendors || 0,
        pendingVendors: pendingVendors || 0,
        totalRiders: totalRiders || 0,
        activeRiders: activeRiders || 0,
        totalZones: totalZones || 0,
      },
    }
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error)
    return {
      stats: {
        totalUsers: 0,
        totalVendors: 0,
        activeVendors: 0,
        pendingVendors: 0,
        totalRiders: 0,
        activeRiders: 0,
        totalZones: 0,
      },
    }
  }
}

/**
 * Get admin users list (for users management page)
 * Fetches all users with their vendors/riders relationships
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getAdminUsersData(_userId: string): Promise<AdminUsersData> {
  const supabase = await createClient()

  try {
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
      return { users: [] }
    }

    return {
      users: (data || []) as AdminUser[],
    }
  } catch (error) {
    console.error('Error fetching admin users data:', error)
    return { users: [] }
  }
}

/**
 * Get admin vendors list (for vendors management page)
 * Fetches all vendors with zones, also fetches zones list for filters
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getAdminVendorsData(_userId: string): Promise<AdminVendorsData> {
  const supabase = await createClient()

  try {
    // Fetch vendors and zones in parallel
    const [vendorsResult, zonesResult] = await Promise.all([
      supabase
        .from('vendors')
        .select(`
          id,
          display_name,
          status,
          kyc_status,
          rating_avg,
          rating_count,
          created_at,
          zones (id, name)
        `)
        .order('created_at', { ascending: false }),
      supabase
        .from('zones')
        .select('id, name')
        .eq('active', true)
        .order('name'),
    ])

    if (vendorsResult.error) {
      console.error('Error fetching vendors:', vendorsResult.error)
      return { vendors: [], zones: [] }
    }

    // Transform zones array to single object
    const vendors = (vendorsResult.data || []).map(v => ({
      ...v,
      zones: Array.isArray(v.zones) && v.zones.length > 0 
        ? (v.zones[0] as unknown as { id: string; name: string })
        : (v.zones as unknown as { id: string; name: string } | null) || null,
    })) as AdminVendorListItem[]

    return {
      vendors,
      zones: (zonesResult.data || []) as Array<{ id: string; name: string }>,
    }
  } catch (error) {
    console.error('Error fetching admin vendors data:', error)
    return { vendors: [], zones: [] }
  }
}

/**
 * Get admin zones list (for zones management page)
 * Fetches all zones with vendor counts
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getAdminZonesData(_userId: string): Promise<AdminZonesData> {
  const supabase = await createClient()

  try {
    // Fetch zones
    const { data: zonesData, error: zonesError } = await supabase
      .from('zones')
      .select('*')
      .order('name', { ascending: true })

    if (zonesError) {
      console.error('Error fetching zones:', zonesError)
      return { zones: [] }
    }

    // Fetch vendor counts per zone
    const { data: vendorsData, error: vendorsError } = await supabase
      .from('vendors')
      .select('zone_id')

    if (vendorsError) {
      console.error('Error fetching vendor counts:', vendorsError)
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
    const zones = (zonesData || []).map(zone => ({
      id: zone.id,
      name: zone.name,
      polygon: zone.polygon,
      active: zone.active,
      created_at: zone.created_at,
      updated_at: zone.updated_at,
      vendorCount: vendorCounts.get(zone.id) || 0,
    })) as AdminZone[]

    return { zones }
  } catch (error) {
    console.error('Error fetching admin zones data:', error)
    return { zones: [] }
  }
}

/**
 * Get admin vendor detail (for vendor detail page)
 * Fetches complete vendor information with media, docs, and meals
 */
export async function getAdminVendorDetailData(vendorId: string): Promise<AdminVendorDetailData> {
  const supabase = await createClient()

  try {
    // Get vendor with all relationships
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendors')
      .select(`
        *,
        zones (id, name),
        addresses!kitchen_address_id (id, line1, city, state, pincode)
      `)
      .eq('id', vendorId)
      .single()

    if (vendorError || !vendorData) {
      console.error('Error fetching vendor:', vendorError)
      return { vendor: null }
    }

    // Fetch media, docs, and meals in parallel
    const [mediaResult, docsResult, mealsResult] = await Promise.all([
      supabase
        .from('vendor_media')
        .select('id, media_type, url')
        .eq('vendor_id', vendorId),
      supabase
        .from('vendor_docs')
        .select('id, doc_type, url, verified_by_admin')
        .eq('vendor_id', vendorId),
      supabase
        .from('meals')
        .select('id, slot, name, active')
        .eq('vendor_id', vendorId),
    ])

    // Extract zone and address
    let zone: { id: string; name: string } | null = null
    if (Array.isArray(vendorData.zones) && vendorData.zones.length > 0) {
      zone = vendorData.zones[0] as unknown as { id: string; name: string }
    } else if (vendorData.zones && typeof vendorData.zones === 'object' && 'id' in vendorData.zones) {
      zone = vendorData.zones as unknown as { id: string; name: string }
    }

    let address: { id: string; line1: string; city: string; state: string; pincode: string } | null = null
    if (Array.isArray(vendorData.addresses) && vendorData.addresses.length > 0) {
      address = vendorData.addresses[0] as unknown as { id: string; line1: string; city: string; state: string; pincode: string }
    } else if (vendorData.addresses && typeof vendorData.addresses === 'object' && 'id' in vendorData.addresses) {
      address = vendorData.addresses as unknown as { id: string; line1: string; city: string; state: string; pincode: string }
    }

    return {
      vendor: {
        id: vendorData.id,
        display_name: vendorData.display_name,
        bio: vendorData.bio,
        fssai_no: vendorData.fssai_no,
        status: vendorData.status,
        kyc_status: vendorData.kyc_status,
        rejection_reason: vendorData.rejection_reason,
        rating_avg: vendorData.rating_avg,
        rating_count: vendorData.rating_count,
        veg_only: vendorData.veg_only,
        capacity_breakfast: vendorData.capacity_breakfast,
        capacity_lunch: vendorData.capacity_lunch,
        capacity_dinner: vendorData.capacity_dinner,
        slug: vendorData.slug,
        created_at: vendorData.created_at,
        updated_at: vendorData.updated_at,
        zones: zone,
        addresses: address,
        vendor_media: (mediaResult.data || []) as Array<{ id: string; media_type: string; url: string }>,
        vendor_docs: (docsResult.data || []) as Array<{ id: string; doc_type: string; url: string; verified_by_admin: boolean }>,
        meals: (mealsResult.data || []) as Array<{ id: string; slot: string; name: string; active: boolean }>,
      },
    }
  } catch (error) {
    console.error('Error fetching admin vendor detail data:', error)
    return { vendor: null }
  }
}

