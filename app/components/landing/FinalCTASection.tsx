import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Utensils } from 'lucide-react'

export default function FinalCTASection() {
  return (
    <section className='pb-section relative overflow-hidden border-b theme-border-color bg-[#cd2555]'>
      <div className='dark container-max-md pt-20 md:pt-30 pb-20 md:pb-30 lb-section-content w-full gap-8 md:gap-10 flex flex-col items-center text-center relative'>
        <div className="gap-4 md:gap-7 flex flex-col items-center text-center px-4">
          <div className="text-center uppercase text-white-opacity-60 tracking-[3px] md:tracking-[4px] text-xs md:text-sm lg:text-base">
            Get Started Today!
          </div>
          <h2 className='lb-hero-heading theme-fc-heading w-full text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium leading-6' style={{ lineHeight: 1.2 }}>
            Ready to Transform Your Mealtime?
          </h2>
          <p className='mb-3 theme-fc-light text-sm sm:text-base container-max-tab'>
            Join thousands of satisfied customers who&apos;ve discovered the joy of home-cooked meals delivered daily. Whether you&apos;re a hungry customer, aspiring vendor, or delivery partner, BellyBox has something for everyone.
          </p>
        </div>

        <div className="flex gap-3 flex-wrap justify-center">
          <Link href="/signup/customer">
            <Button variant="white" size="lg" className="min-w-[160px]">
              Start Ordering
            </Button>
          </Link>
          <Link href="/signup/vendor">
            <Button variant="outline-white" size="lg" className="min-w-[160px]">
              Join as Vendor
            </Button>
          </Link>
        </div>
      </div>

      <div className="w-full h-48 md:h-64 bg-gradient-to-br from-orange-300 via-orange-400 to-orange-500 flex items-center justify-center">
        <div className="text-center text-white px-4">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Utensils className="w-10 h-10 md:w-12 md:h-12" />
          </div>
          <p className="text-base md:text-lg font-semibold mb-2">Delicious Home-Cooked Meals</p>
          <p className="text-sm opacity-90">Delivered Fresh to Your Doorstep</p>
        </div>
      </div>

      <div className="h-[300px] md:h-[400px] absolute w-full bg-black pointer-events-none" style={{ boxShadow: '0px -160px 400px #0000004f' }}></div>
    </section>
  )
}


