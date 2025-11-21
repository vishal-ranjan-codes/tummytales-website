import { Utensils, Shield, Clock, Heart } from 'lucide-react'

const consumerBenefits = [
  {
    icon: Utensils,
    title: 'Affordable',
    description: "Get quality home-cooked meals at prices that won't break your budget. Save money compared to restaurants.",
    iconWrapperClass: 'bg-green-100 dark:bg-green-900/30',
    iconClass: 'text-green-600 dark:text-green-400',
  },
  {
    icon: Shield,
    title: 'Healthy',
    description: 'Fresh ingredients, balanced nutrition, and authentic cooking methods ensure you eat well every day.',
    iconWrapperClass: 'bg-blue-100 dark:bg-blue-900/30',
    iconClass: 'text-blue-600 dark:text-blue-400',
  },
  {
    icon: Clock,
    title: 'Convenient',
    description: 'No more meal planning or grocery shopping. Just order and enjoy delicious meals delivered to you.',
    iconWrapperClass: 'bg-purple-100 dark:bg-purple-900/30',
    iconClass: 'text-purple-600 dark:text-purple-400',
  },
  {
    icon: Heart,
    title: 'Home-Cooked',
    description: 'Experience the authentic taste of home-cooked meals prepared with love by skilled home chefs.',
    iconWrapperClass: 'bg-orange-100 dark:bg-orange-900/30',
    iconClass: 'text-orange-600 dark:text-orange-400',
  },
]

export default function ConsumerBenefitsSection() {
  return (
    <section id="consumers" className="pb-section pt-20 md:pt-40 pb-20 md:pb-44 overflow-hidden relative border-b scroll-mt-20">
      <div className="container-max-lg">
        <header className="container-max-md mb-12 md:mb-20 flex flex-col gap-4 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-4 md:mb-7 theme-fc-heading" style={{ lineHeight: 1.2 }}>
            For <b>Consumers</b>
          </h2>
          <p className="text-sm sm:text-base theme-fc-light container-max-tab mx-auto">
            Get access to authentic, home-cooked meals without the hassle of cooking. Perfect for busy professionals, students, and anyone who misses the taste of home.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {consumerBenefits.map((benefit) => {
            const Icon = benefit.icon
            return (
              <div key={benefit.title} className="box p-6 md:p-8 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className={`w-14 h-14 ${benefit.iconWrapperClass} rounded-lg mb-4 flex items-center justify-center mx-auto`}>
                  <Icon className={`w-7 h-7 ${benefit.iconClass}`} />
                </div>
                <h3 className="text-lg md:text-xl mb-3 theme-fc-heading font-semibold">{benefit.title}</h3>
                <p className="text-fc-light text-sm md:text-base">{benefit.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}


