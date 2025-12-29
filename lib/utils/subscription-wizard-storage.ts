/**
 * Subscription Wizard State Storage Utilities
 * Manages wizard state persistence using sessionStorage
 */

import type { BBPlan, MealSlot, DeliverySlot } from '@/types/bb-subscription'

export interface WizardState {
  selectedPlanId: string
  selectedSlots: MealSlot[]
  slotWeekdays: Record<MealSlot, number[]>
  preferredDeliveryTimes: Record<MealSlot, DeliverySlot>
  startDate: string
  selectedAddressId: string | null
  vendorId: string
  timestamp: number
  currentStep: number
}

const STORAGE_KEY_PREFIX = 'subscription_wizard_'
const TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Get storage key for a specific vendor
 */
function getStorageKey(vendorId: string): string {
  return `${STORAGE_KEY_PREFIX}${vendorId}`
}

/**
 * Save wizard state to sessionStorage
 */
export function saveWizardState(
  vendorId: string,
  state: Partial<WizardState> & { vendorId: string }
): void {
  try {
    const fullState: WizardState = {
      selectedPlanId: state.selectedPlanId || '',
      selectedSlots: state.selectedSlots || [],
      slotWeekdays: state.slotWeekdays || { breakfast: [], lunch: [], dinner: [] },
      preferredDeliveryTimes: state.preferredDeliveryTimes || {
        breakfast: { start: '', end: '' },
        lunch: { start: '', end: '' },
        dinner: { start: '', end: '' },
      },
      startDate: state.startDate || '',
      selectedAddressId: state.selectedAddressId || null,
      vendorId: state.vendorId,
      timestamp: state.timestamp || Date.now(),
      currentStep: state.currentStep || 1,
    }

    const key = getStorageKey(vendorId)
    sessionStorage.setItem(key, JSON.stringify(fullState))
  } catch (error) {
    console.error('Failed to save wizard state to sessionStorage:', error)
    // Silently fail - state persistence is not critical
  }
}

/**
 * Load wizard state from sessionStorage with validation
 * Returns null if state is invalid, expired, or doesn't match vendor
 */
export function loadWizardState(
  vendorId: string,
  availablePlans: BBPlan[]
): WizardState | null {
  try {
    const key = getStorageKey(vendorId)
    const stored = sessionStorage.getItem(key)

    if (!stored) {
      return null
    }

    const state: WizardState = JSON.parse(stored)

    // Validate vendor ID matches
    if (state.vendorId !== vendorId) {
      console.warn('Wizard state vendor ID mismatch, clearing state')
      clearWizardState(vendorId)
      return null
    }

    // Validate TTL (24 hours)
    const age = Date.now() - state.timestamp
    if (age > TTL_MS) {
      console.warn('Wizard state expired, clearing state')
      clearWizardState(vendorId)
      return null
    }

    // Validate plan still exists
    const planExists = availablePlans.some((plan) => plan.id === state.selectedPlanId)
    if (!planExists) {
      console.warn('Selected plan no longer exists, clearing state')
      clearWizardState(vendorId)
      return null
    }

    return state
  } catch (error) {
    console.error('Failed to load wizard state from sessionStorage:', error)
    // Clear corrupted state
    clearWizardState(vendorId)
    return null
  }
}

/**
 * Clear wizard state from sessionStorage
 */
export function clearWizardState(vendorId: string): void {
  try {
    const key = getStorageKey(vendorId)
    sessionStorage.removeItem(key)
  } catch (error) {
    console.error('Failed to clear wizard state from sessionStorage:', error)
  }
}

/**
 * Check if wizard state exists for a vendor (without loading it)
 */
export function hasWizardState(vendorId: string): boolean {
  try {
    const key = getStorageKey(vendorId)
    return sessionStorage.getItem(key) !== null
  } catch {
    return false
  }
}

