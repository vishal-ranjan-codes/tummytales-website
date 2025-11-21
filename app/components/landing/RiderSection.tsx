import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Truck, Clock, Users } from 'lucide-react'

const riderBenefits = [
  {
    icon: Truck,
    title: 'Flexible Work',
    description: 'Choose your own hours and delivery areas. Work part-time or full-time based on your availability.',
    iconWrapperClass: 'bg-blue-100 dark:bg-blue-900/30',
    iconClass: 'text-blue-600 dark:text-blue-400',
  },
  {
    icon: Clock,
    title: 'Earn Daily',
    description: 'Get paid quickly with daily payouts. Track your earnings and delivery history in real-time.',
    iconWrapperClass: 'bg-green-100 dark:bg-green-900/30',
    iconClass: 'text-green-600 dark:text-green-400',
  },
  {
    icon: Users,
    title: 'Be Part of Community',
    description: 'Join a supportive community of riders. Get support, tips, and grow together with other delivery partners.',
    iconWrapperClass: 'bg-purple-100 dark:bg-purple-900/30',
    iconClass: 'text-purple-600 dark:text-purple-400',
  },
]

export default function RiderSection() {
  return (
    <section id="riders" className="pb-section pt-20 md:pt-40 pb-20 md:pb-44 overflow-hidden relative border-b scroll-mt-20">
      <div className="container-max-lg">
        <header className="container-max-md mb-12 md:mb-20 flex flex-col gap-4 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-4 md:mb-7 theme-fc-heading" style={{ lineHeight: 1.2 }}>
            For <b>Riders</b>
          </h2>
          <p className="text-center text-sm sm:text-base theme-fc-light container-max-tab">
            Join our delivery network and earn money by connecting great food with hungry customers. Flexible work that fits your schedule.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {riderBenefits.map((benefit) => {
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

        <div className="text-center mt-8">
          <Link href="/signup/rider">
            <Button variant="default" size="lg" className="min-w-[160px]">
              Join as Rider
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}


