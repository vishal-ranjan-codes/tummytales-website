import HeroSection from '@/components/landing/HeroSection'
import HowItWorksSection from '@/components/landing/HowItWorksSection'
import ConsumerBenefitsSection from '@/components/landing/ConsumerBenefitsSection'
import VendorSection from '@/components/landing/VendorSection'
import RiderSection from '@/components/landing/RiderSection'
import PlatformFeaturesSection from '@/components/landing/PlatformFeaturesSection'
import FinalCTASection from '@/components/landing/FinalCTASection'

export default function Home() {
  return (
    <main className='site-content'>
      <HeroSection />
      <HowItWorksSection />
      <ConsumerBenefitsSection />
      <VendorSection />
      <RiderSection />
      <PlatformFeaturesSection />
      <FinalCTASection />
    </main>
  );
}
