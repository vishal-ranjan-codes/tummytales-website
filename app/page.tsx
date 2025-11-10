import {
  HeroSection,
  HowItWorksSection,
  ConsumerHighlights,
  VendorHighlights,
  RiderHighlights,
  FeatureHighlights,
  FinalCTASection,
} from '@/app/components/landing/sections'

export default function Home() {
  return (
    <main className="site-content">
      <HeroSection />
      <HowItWorksSection />
      <ConsumerHighlights />
      <VendorHighlights />
      <RiderHighlights />
      <FeatureHighlights />
      <FinalCTASection />
    </main>
  )
}
