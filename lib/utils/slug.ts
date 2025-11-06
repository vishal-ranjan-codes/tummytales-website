/**
 * Slug Generation Utility
 * Creates URL-safe slugs and ensures uniqueness
 */

/**
 * Generate a URL-safe slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Ensure slug is unique by appending a number if needed
 * @param slug - Base slug
 * @param checkUnique - Async function to check if slug exists (should return true if unique)
 * @param maxAttempts - Maximum attempts to find unique slug
 */
export async function ensureUniqueSlug(
  slug: string,
  checkUnique: (slug: string) => Promise<boolean>,
  maxAttempts: number = 10
): Promise<string> {
  let candidate = slug
  let attempt = 0

  while (attempt < maxAttempts) {
    const isUnique = await checkUnique(candidate)
    if (isUnique) {
      return candidate
    }
    attempt++
    candidate = `${slug}-${attempt}`
  }

  // Fallback: append timestamp if still not unique
  return `${slug}-${Date.now()}`
}

