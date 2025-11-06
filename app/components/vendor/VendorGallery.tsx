/**
 * Vendor Gallery Component
 * Displays vendor gallery images in a grid
 */

import Image from 'next/image'

interface VendorGalleryProps {
  gallery: Array<{
    id: string
    url: string
    display_order: number
  }>
}

export default function VendorGallery({ gallery }: VendorGalleryProps) {
  if (!gallery || gallery.length === 0) {
    return null
  }

  return (
    <div className="box p-6">
      <h3 className="text-xl font-bold theme-fc-heading mb-4">Gallery</h3>
      <div className="grid grid-cols-2 gap-3">
        {gallery.slice(0, 6).map((item) => (
          <div
            key={item.id}
            className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border theme-border-color group cursor-pointer"
          >
            <Image
              src={item.url}
              alt="Gallery"
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          </div>
        ))}
      </div>
      {gallery.length > 6 && (
        <p className="text-sm theme-fc-light mt-3 text-center">
          +{gallery.length - 6} more images
        </p>
      )}
    </div>
  )
}

