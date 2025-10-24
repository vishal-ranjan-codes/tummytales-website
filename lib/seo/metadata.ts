/**
 * Metadata Helpers
 * Reusable metadata generators for pages
 */

import { Metadata } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tummytales.com'
const siteName = 'Tummy Tales'

interface PageMetadataParams {
  title: string
  description: string
  path?: string
  image?: string
  noIndex?: boolean
}

/**
 * Generate base metadata for all pages
 */
export function getBaseMetadata(): Metadata {
  return {
    metadataBase: new URL(baseUrl),
    title: {
      template: `%s | ${siteName}`,
      default: siteName,
    },
    description: 'Fresh, home-cooked meals delivered daily. Connect with local home chefs and tiffin vendors for affordable, healthy, and delicious meals.',
    keywords: [
      'tiffin service',
      'home cooked food',
      'meal subscription',
      'home chef',
      'food delivery',
      'tiffin delivery',
      'home kitchen',
      'daily meals',
      'Delhi NCR',
    ],
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: 'website',
      locale: 'en_IN',
      url: baseUrl,
      siteName,
      title: siteName,
      description: 'Fresh, home-cooked meals delivered daily',
      images: [
        {
          url: `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: siteName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: siteName,
      description: 'Fresh, home-cooked meals delivered daily',
      images: [`${baseUrl}/og-image.png`],
      creator: '@tummytales',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: 'YOUR_GOOGLE_VERIFICATION_CODE',
      // yandex: 'YOUR_YANDEX_VERIFICATION_CODE',
      // bing: 'YOUR_BING_VERIFICATION_CODE',
    },
  }
}

/**
 * Generate page-specific metadata
 */
export function generatePageMetadata({
  title,
  description,
  path = '',
  image,
  noIndex = false,
}: PageMetadataParams): Metadata {
  const url = `${baseUrl}${path}`
  const ogImage = image || `${baseUrl}/og-image.png`

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: 'website',
      locale: 'en_IN',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
        },
  }
}

/**
 * Generate metadata for vendor pages
 */
export function generateVendorMetadata(params: {
  vendorName: string
  bio?: string
  zone?: string
  rating?: number
  image?: string
}): Metadata {
  const { vendorName, bio, zone, rating, image } = params
  
  const title = `${vendorName} - Home-Cooked Tiffin in ${zone || 'Delhi NCR'}`
  const description = bio || `Order delicious home-cooked meals from ${vendorName}. ${rating ? `Rated ${rating}/5 by customers.` : ''} Fresh, hygienic, and affordable tiffin service.`

  return generatePageMetadata({
    title,
    description,
    path: `/vendor/${vendorName.toLowerCase().replace(/\s+/g, '-')}`,
    image,
  })
}

