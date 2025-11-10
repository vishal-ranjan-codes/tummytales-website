import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { mergeRoles, resolveDefaultRole } from '../lib/auth/role-helpers'

describe('mergeRoles', () => {
  test('adds new roles while preserving existing order', () => {
    const result = mergeRoles(['customer'], ['vendor', 'customer'])
    assert.deepEqual(result, ['customer', 'vendor'])
  })

  test('retains admin role when adding vendor', () => {
    const result = mergeRoles(['admin', 'customer'], ['vendor'])
    assert.deepEqual(result, ['admin', 'customer', 'vendor'])
  })

  test('ignores falsy entries', () => {
    const result = mergeRoles(['customer'], ['vendor', undefined, null])
    assert.deepEqual(result, ['customer', 'vendor'])
  })
})

describe('resolveDefaultRole', () => {
  test('returns candidate when no default is set', () => {
    const result = resolveDefaultRole(null, 'vendor')
    assert.equal(result, 'vendor')
  })

  test('returns undefined when default is already set', () => {
    const result = resolveDefaultRole('admin', 'vendor')
    assert.equal(result, undefined)
  })
})

