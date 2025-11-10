/**
 * Role helper utilities shared between client and server environments.
 */

/**
 * Merge the supplied roles into the existing role array without duplicates.
 */
export function mergeRoles(
  existingRoles: string[] | null | undefined,
  rolesToAdd: Array<string | null | undefined>,
): string[] {
  const merged = new Set<string>()

  for (const role of existingRoles ?? []) {
    if (role) {
      merged.add(role)
    }
  }

  for (const role of rolesToAdd) {
    if (role) {
      merged.add(role)
    }
  }

  return Array.from(merged)
}

/**
 * Determine whether the default role should be updated.
 * Returns the candidate value if the current default is empty.
 */
export function resolveDefaultRole(
  currentDefault: string | null | undefined,
  candidate: string,
): string | undefined {
  if (currentDefault && currentDefault.length > 0) {
    return undefined
  }

  return candidate
}

