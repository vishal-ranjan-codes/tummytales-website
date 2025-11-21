import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Utensils } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className='hero-section relative overflow-hidden border-b theme-border-color bg-[#cd2555]'>
      <div className='relative z-2 gap-20 sm:gap-10'>
        <div className='container lb-hero-content'>
          <div className="flex flex-col gap-20 max-sm:gap-10">
            <div className="dark flex flex-col gap-6 pt-20 md:pt-30 container-max-md text-center justify-center animate-in fade-in duration-700">
              <h1 className='lb-hero-heading theme-fc-heading w-full leading-6 text-xl sm:text-2xl md:text-4xl lg:text-5xl font-medium' style={{ lineHeight: 1.2 }}>
                Fresh, Home-Cooked Meals Delivered Daily
              </h1>
              <p className="theme-fc-light container-max-tab text-sm sm:text-base">
                Connect with local home chefs and tiffin vendors for affordable, healthy, and delicious meals. Perfect for students, professionals, and PG residents who crave authentic home-cooked food.
              </p>
              <div className="flex gap-3 flex-wrap justify-center">
                <Link href="/signup/customer">
                  <Button variant="white" size="lg" className="min-w-[140px]">
                    Order Now
                  </Button>
                </Link>
                <Link href="/signup/vendor">
                  <Button variant="outline-white" size="lg" className="min-w-[140px]">
                    Become a Vendor
                  </Button>
                </Link>
              </div>
            </div>

            <div className="hero-vid flex justify-center">
              <div className="overflow-hidden theme-rounded-t border-16 border-b-0">
                <div className="w-full h-64 md:h-96 bg-gradient-to-br from-orange-200 to-orange-400 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Utensils className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-lg font-semibold">Hero Video Placeholder</p>
                    <p className="text-sm opacity-80">Tiffin delivery showcase</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


