/**
 * Structured Data Helpers
 * JSON-LD schema generators for SEO
 */

export interface OrganizationSchema {
  '@context': string
  '@type': string
  name: string
  description: string
  url: string
  logo: string
  contactPoint?: {
    '@type': string
    telephone: string
    contactType: string
    email: string
  }
  sameAs?: string[]
}

export interface WebsiteSchema {
  '@context': string
  '@type': string
  name: string
  url: string
  potentialAction?: {
    '@type': string
    target: string
    'query-input': string
  }
}

export interface BreadcrumbSchema {
  '@context': string
  '@type': string
  itemListElement: Array<{
    '@type': string
    position: number
    name: string
    item?: string
  }>
}

/**
 * Get organization schema
 */
export function getOrganizationSchema(): OrganizationSchema {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tummytales.com'

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Tummy Tales',
    description: 'Home-cooked tiffin subscription service connecting home chefs with customers',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-XXX-XXXXXXX',
      contactType: 'customer service',
      email: 'support@tummytales.com',
    },
    sameAs: [
      // Add social media links when available
      // 'https://facebook.com/tummytales',
      // 'https://twitter.com/tummytales',
      // 'https://instagram.com/tummytales',
    ],
  }
}

/**
 * Get website schema with search action
 */
export function getWebsiteSchema(): WebsiteSchema {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tummytales.com'

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Tummy Tales',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/vendors?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

/**
 * Generate breadcrumb schema for nested pages
 */
export function getBreadcrumbSchema(breadcrumbs: Array<{ name: string; url?: string }>): BreadcrumbSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      ...(crumb.url && { item: crumb.url }),
    })),
  }
}

/**
 * Convert schema object to JSON-LD script tag
 */
export function schemaToJsonLd(schema: Record<string, unknown>): string {
  return JSON.stringify(schema)
}

