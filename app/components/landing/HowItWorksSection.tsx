import { Users, Heart, Truck } from 'lucide-react'

const steps = [
  {
    icon: Users,
    title: 'Browse Vendors',
    description: 'Discover local home chefs and tiffin vendors in your area. Read reviews, check menus, and find your perfect match.',
  },
  {
    icon: Heart,
    title: 'Subscribe',
    description: 'Choose your meal plans and subscription preferences. Set delivery schedules that work with your lifestyle.',
  },
  {
    icon: Truck,
    title: 'Get Delivered',
    description: 'Enjoy fresh, home-cooked meals delivered right to your doorstep. Track your orders in real-time.',
  },
]

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="pb-section pt-20 md:pt-30 pb-20 md:pb-30 border-b overflow-hidden relative scroll-mt-20">
      <div className="container">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-4 theme-fc-heading text-center">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 mt-8 md:mt-12">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={step.title} className="text-center p-6 rounded-lg hover:theme-bg-color-dark transition-colors">
                <div className="relative w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-10 h-10 text-white" />
                  <span className="absolute -top-2 -right-2 w-8 h-8 bg-white theme-fc-heading rounded-full flex items-center justify-center font-bold text-sm border-2 border-primary-100">
                    {index + 1}
                  </span>
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-3 theme-fc-heading">{step.title}</h3>
                <p className="theme-fc-light text-sm md:text-base">{step.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}


