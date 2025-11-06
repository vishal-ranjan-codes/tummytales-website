/**
 * Vendor Bio Component
 * Displays vendor bio and intro video
 */

interface VendorBioProps {
  bio?: string | null
  video?: string
}

export default function VendorBio({ bio, video }: VendorBioProps) {
  return (
    <div className="box p-6 space-y-6">
      <h2 className="text-2xl font-bold theme-fc-heading">About</h2>
      
      {bio ? (
        <div className="prose prose-sm max-w-none theme-fc-body">
          <p className="whitespace-pre-line leading-relaxed">{bio}</p>
        </div>
      ) : (
        <p className="theme-fc-light italic">No bio available.</p>
      )}

      {video && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold theme-fc-heading">Watch Our Story</h3>
          <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
            <video
              src={video}
              controls
              className="w-full h-full object-contain"
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}
    </div>
  )
}

