import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Users, Clock, Heart } from 'lucide-react'

const vendorHighlights = [
  {
    icon: Users,
    title: 'Extra Income',
    description: 'Earn money doing what you love. Set your own prices and build a steady income stream.',
  },
  {
    icon: Clock,
    title: 'Flexible Hours',
    description: "Work on your own schedule. Cook when it's convenient for you and your family.",
  },
  {
    icon: Heart,
    title: 'Grow Your Business',
    description: 'Access tools to manage orders, track earnings, and expand your customer base.',
  },
]

export default function VendorSection() {
  return (
    <section id="vendors" className='pb-section relative overflow-hidden border-b theme-border-color bg-[#cd2555] scroll-mt-20'>
      <div className='dark container-max-lg pt-20 md:pt-30 pb-20 md:pb-30 lb-section-content w-full gap-8 md:gap-10 flex flex-col items-center text-center relative'>
        <div className="gap-4 md:gap-7 flex flex-col items-center text-center">
          <h2 className='lb-hero-heading theme-fc-heading w-full text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium leading-6' style={{ lineHeight: 1.2 }}>
            For <b>Vendors</b>
          </h2>
          <p className='mb-3 theme-fc-light text-sm sm:text-base container-max-tab'>
            Turn your cooking passion into a profitable business. Reach more customers, manage orders easily, and grow your home-based food business with our platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full max-w-4xl">
          {vendorHighlights.map((highlight) => {
            const Icon = highlight.icon
            return (
              <div key={highlight.title} className="text-center p-4">
                <div className="w-16 md:w-20 h-16 md:h-20 bg-white-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 md:w-10 h-8 md:h-10 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-2 text-white">{highlight.title}</h3>
                <p className="text-white-opacity-80 text-sm md:text-base">{highlight.description}</p>
              </div>
            )
          })}
        </div>

        <div className="flex gap-3 flex-wrap justify-center mt-4 md:mt-8">
          <Link href="/signup/vendor">
            <Button variant="white" size="lg" className="min-w-[180px]">
              Register as Vendor
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}


