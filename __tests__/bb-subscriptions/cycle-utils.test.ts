/**
 * Unit Tests: BB Cycle Utils
 * Test cycle boundary calculations
 * 
 * Note: Install jest and @types/jest to run these tests:
 * npm install --save-dev jest @types/jest ts-jest
 */

import {
  getNextMonday,
  getNextMonthStart,
  getCycleBoundaries,
} from '@/lib/utils/bb-cycle-utils'

// Mock date-fns if needed

describe('BB Cycle Utils', () => {
  describe('getNextMonday', () => {
    it('should return next Monday if today is Sunday', () => {
      const sunday = new Date('2024-01-07') // Sunday
      const nextMonday = getNextMonday(sunday)
      expect(nextMonday.toISOString().split('T')[0]).toBe('2024-01-08')
    })

    it('should return next Monday if today is Monday', () => {
      const monday = new Date('2024-01-08') // Monday
      const nextMonday = getNextMonday(monday)
      expect(nextMonday.toISOString().split('T')[0]).toBe('2024-01-15')
    })

    it('should return next Monday if today is Wednesday', () => {
      const wednesday = new Date('2024-01-10') // Wednesday
      const nextMonday = getNextMonday(wednesday)
      expect(nextMonday.toISOString().split('T')[0]).toBe('2024-01-15')
    })
  })

  describe('getNextMonthStart', () => {
    it('should return 1st of next month if today is 1st', () => {
      const firstOfMonth = new Date('2024-01-01')
      const nextMonthStart = getNextMonthStart(firstOfMonth)
      expect(nextMonthStart.toISOString().split('T')[0]).toBe('2024-02-01')
    })

    it('should return 1st of current month if today is not 1st', () => {
      const midMonth = new Date('2024-01-15')
      const nextMonthStart = getNextMonthStart(midMonth)
      expect(nextMonthStart.toISOString().split('T')[0]).toBe('2024-02-01')
    })
  })

  describe('getCycleBoundaries', () => {
    it('should calculate weekly cycle boundaries correctly', () => {
      const startDate = new Date('2024-01-10') // Wednesday
      const boundaries = getCycleBoundaries('weekly', startDate)

      expect(boundaries.cycle_start.toISOString().split('T')[0]).toBe('2024-01-15') // Next Monday
      expect(boundaries.cycle_end.toISOString().split('T')[0]).toBe('2024-01-21') // Sunday
      expect(boundaries.renewal_date.toISOString().split('T')[0]).toBe('2024-01-22') // Next Monday
    })

    it('should calculate monthly cycle boundaries correctly', () => {
      const startDate = new Date('2024-01-15')
      const boundaries = getCycleBoundaries('monthly', startDate)

      expect(boundaries.cycle_start.toISOString().split('T')[0]).toBe('2024-02-01')
      // cycle_end should be last day of February (2024 is leap year)
      expect(boundaries.cycle_end.toISOString().split('T')[0]).toBe('2024-02-29')
      expect(boundaries.renewal_date.toISOString().split('T')[0]).toBe('2024-03-01')
    })
  })
})

