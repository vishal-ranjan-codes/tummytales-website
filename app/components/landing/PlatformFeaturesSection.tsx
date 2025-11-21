import { Smartphone, Truck, Shield, Star } from 'lucide-react'

const features = [
  {
    icon: Smartphone,
    title: 'Easy Subscription Management',
    description: 'Manage your subscriptions, pause or skip meals, and customize your orders with just a few taps.',
  },
  {
    icon: Truck,
    title: 'Real-time Tracking',
    description: 'Track your orders from kitchen to doorstep. Get live updates on preparation and delivery status.',
  },
  {
    icon: Shield,
    title: 'Multiple Payment Options',
    description: 'Pay with cards, UPI, wallets, or cash on delivery. Secure payment processing for peace of mind.',
  },
  {
    icon: Star,
    title: 'Ratings & Reviews',
    description: 'Read authentic reviews from other customers. Rate your meals and help others make informed choices.',
  },
]

export default function PlatformFeaturesSection() {
  return (
    <section id="features" className="pb-section pt-20 md:pt-40 pb-20 md:pb-44 overflow-hidden relative border-b scroll-mt-20">
      <div className="container-max-lg">
        <header className="container-max-md mb-12 md:mb-20 flex flex-col gap-4 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-4 md:mb-7 theme-fc-heading" style={{ lineHeight: 1.2 }}>
            Platform <b>Features</b>
          </h2>
          <p className="text-center text-sm sm:text-base theme-fc-light container-max-tab">
            Everything you need for a seamless tiffin subscription experience. Built for consumers, vendors, and riders.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="box p-6 md:p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 bg-primary-100 dark:bg-primary-100--dark rounded-lg mb-4 flex items-center justify-center">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg md:text-xl mb-3 theme-fc-heading font-semibold">{feature.title}</h3>
                <p className="text-fc-light text-sm md:text-base">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}


