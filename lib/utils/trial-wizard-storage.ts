/**
 * Trial Wizard State Storage Utilities
 * Manages trial wizard state persistence using sessionStorage
 */

import type { MealSlot } from '@/types/bb-subscription'

export interface TrialWizardState {
  selectedTrialTypeId: string
  startDate: string // YYYY-MM-DD
  selectedMeals: Array<{
    service_date: string // YYYY-MM-DD
    slot: MealSlot
  }>
  selectedAddressId: string | null
  vendorId: string
  timestamp: number
  currentStep: number
}

const STORAGE_KEY_PREFIX = 'trial_wizard_'
const TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Get storage key for a specific vendor
 */
function getStorageKey(vendorId: string): string {
  return `${STORAGE_KEY_PREFIX}${vendorId}`
}

/**
 * Save trial wizard state to sessionStorage
 */
export function saveTrialWizardState(
  vendorId: string,
  state: Partial<TrialWizardState> & { vendorId: string }
): void {
  try {
    const fullState: TrialWizardState = {
      selectedTrialTypeId: state.selectedTrialTypeId || '',
      startDate: state.startDate || '',
      selectedMeals: state.selectedMeals || [],
      selectedAddressId: state.selectedAddressId || null,
      vendorId: state.vendorId,
      timestamp: state.timestamp || Date.now(),
      currentStep: state.currentStep || 1,
    }

    const key = getStorageKey(vendorId)
    sessionStorage.setItem(key, JSON.stringify(fullState))
  } catch (error) {
    console.error('Failed to save trial wizard state to sessionStorage:', error)
    // Silently fail - state persistence is not critical
  }
}

/**
 * Load trial wizard state from sessionStorage with validation
 * Returns null if state is invalid, expired, or doesn't match vendor
 */
export function loadTrialWizardState(
  vendorId: string,
  availableTrialTypes: Array<{ id: string }>
): TrialWizardState | null {
  try {
    const key = getStorageKey(vendorId)
    const stored = sessionStorage.getItem(key)

    if (!stored) {
      return null
    }

    const state: TrialWizardState = JSON.parse(stored)

    // Validate vendor ID matches
    if (state.vendorId !== vendorId) {
      console.warn('Trial wizard state vendor ID mismatch, clearing state')
      clearTrialWizardState(vendorId)
      return null
    }

    // Validate TTL (24 hours)
    const age = Date.now() - state.timestamp
    if (age > TTL_MS) {
      console.warn('Trial wizard state expired, clearing state')
      clearTrialWizardState(vendorId)
      return null
    }

    // Validate trial type still exists (if selected)
    if (state.selectedTrialTypeId) {
      const trialTypeExists = availableTrialTypes.some(
        (type) => type.id === state.selectedTrialTypeId
      )
      if (!trialTypeExists) {
        console.warn('Selected trial type no longer exists, clearing state')
        clearTrialWizardState(vendorId)
        return null
      }
    }

    return state
  } catch (error) {
    console.error('Failed to load trial wizard state from sessionStorage:', error)
    // Clear corrupted state
    clearTrialWizardState(vendorId)
    return null
  }
}

/**
 * Clear trial wizard state from sessionStorage
 */
export function clearTrialWizardState(vendorId: string): void {
  try {
    const key = getStorageKey(vendorId)
    sessionStorage.removeItem(key)
  } catch (error) {
    console.error('Failed to clear trial wizard state from sessionStorage:', error)
  }
}

/**
 * Check if trial wizard state exists for a vendor (without loading it)
 */
export function hasTrialWizardState(vendorId: string): boolean {
  try {
    const key = getStorageKey(vendorId)
    return sessionStorage.getItem(key) !== null
  } catch {
    return false
  }
}
