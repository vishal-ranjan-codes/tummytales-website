/**
 * OAuth Divider Component
 * Visual divider between auth methods
 */

interface OAuthDividerProps {
  text?: string
}

export default function OAuthDivider({ text = 'OR' }: OAuthDividerProps) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t theme-border-color"></div>
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-4 theme-bg-color theme-fc-light font-medium">
          {text}
        </span>
      </div>
    </div>
  )
}

