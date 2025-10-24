/**
 * Join as Rider Landing Page
 * Recruitment page for delivery riders
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SignedIn, SignedOut } from '@/app/components/auth-components'
import { 
  DollarSign, 
  Clock, 
  MapPin, 
  Shield, 
  Smartphone,
  Bike,
  Calendar,
  Heart,
  Star,
  Zap
} from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export const metadata = {
  title: 'Join as Rider | Tummy Tales',
  description: 'Earn money on your schedule as a delivery rider. Join Tummy Tales and be your own boss while helping deliver delicious meals.',
}

export default function JoinRiderPage() {
  return (
    <main className="site-content">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-[#EA5A36] border-b theme-border-color">
        <div className="dark container-max-lg pt-20 md:pt-30 pb-20 md:pb-30">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white-opacity-20 rounded-full text-white text-sm font-medium mb-4">
              <Bike className="w-4 h-4" />
              <span>Flexible Delivery Opportunities</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Earn Money on Your Schedule<br />as a <span className="underline decoration-wavy">Delivery Rider</span>
            </h1>
            
            <p className="text-lg md:text-xl text-white-opacity-90 max-w-3xl mx-auto">
              Join Tummy Tales delivery network and earn competitive pay while enjoying complete flexibility. Work part-time or full-time—you decide!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <SignedOut>
                <Link href="/signup/rider">
                  <Button variant="white" size="lg" className="min-w-[200px] text-base">
                    Start Earning Now
                  </Button>
                </Link>
              </SignedOut>
              <SignedIn>
                <Link href="/signup/rider">
                  <Button variant="white" size="lg" className="min-w-[200px] text-base">
                    Add Rider Role
                  </Button>
                </Link>
              </SignedIn>
              <Link href="#how-it-works">
                <Button variant="outline-white" size="lg" className="min-w-[200px] text-base">
                  Learn How It Works
                </Button>
              </Link>
            </div>

            <SignedIn>
              <div className="mt-6 p-4 bg-white-opacity-20 rounded-lg max-w-md mx-auto">
                <p className="text-white text-sm">
                  ✨ Already logged in? Add the rider role to your account to start delivering and earning!
                </p>
              </div>
            </SignedIn>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20 md:py-30 border-b theme-border-color">
        <div className="container-max-lg">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold theme-fc-heading mb-4">
              Why Deliver with Tummy Tales?
            </h2>
            <p className="text-lg theme-fc-light max-w-2xl mx-auto">
              Enjoy the freedom and benefits of being your own boss
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="box p-8 text-center hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold theme-fc-heading mb-3">Competitive Pay</h3>
              <p className="theme-fc-light">
                Earn ₹25-₹50 per delivery plus tips. Many riders earn ₹15,000-₹40,000+ monthly working part-time.
              </p>
            </div>

            <div className="box p-8 text-center hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold theme-fc-heading mb-3">Total Flexibility</h3>
              <p className="theme-fc-light">
                Choose when and where you work. Set your own hours and take time off whenever you need.
              </p>
            </div>

            <div className="box p-8 text-center hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold theme-fc-heading mb-3">Daily Payouts</h3>
              <p className="theme-fc-light">
                Get paid daily for your deliveries. Track earnings in real-time and cash out whenever you want.
              </p>
            </div>

            <div className="box p-8 text-center hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold theme-fc-heading mb-3">Choose Your Zone</h3>
              <p className="theme-fc-light">
                Select delivery areas you&apos;re comfortable with. Work in neighborhoods you know well.
              </p>
            </div>

            <div className="box p-8 text-center hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-semibold theme-fc-heading mb-3">Easy to Use App</h3>
              <p className="theme-fc-light">
                Simple rider app with navigation, order details, and earnings tracking all in one place.
              </p>
            </div>

            <div className="box p-8 text-center hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold theme-fc-heading mb-3">Support Community</h3>
              <p className="theme-fc-light">
                Join a supportive network of riders. Get help, share tips, and grow together with the community.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="py-20 md:py-30 border-b theme-border-color scroll-mt-20">
        <div className="container-max-lg">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold theme-fc-heading mb-4">
              How It Works
            </h2>
            <p className="text-lg theme-fc-light max-w-2xl mx-auto">
              Start delivering in 3 easy steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div className="relative">
              <div className="text-center">
                <div className="relative w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Smartphone className="w-10 h-10 text-white" />
                  <span className="absolute -top-2 -right-2 w-10 h-10 bg-white theme-fc-heading rounded-full flex items-center justify-center font-bold text-xl border-4 border-primary-100">1</span>
                </div>
                <h3 className="text-2xl font-semibold theme-fc-heading mb-4">Sign Up</h3>
                <p className="theme-fc-light">
                  Create your rider account, complete your profile, and upload required documents. Quick and easy process.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="text-center">
                <div className="relative w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-10 h-10 text-white" />
                  <span className="absolute -top-2 -right-2 w-10 h-10 bg-white theme-fc-heading rounded-full flex items-center justify-center font-bold text-xl border-4 border-primary-100">2</span>
                </div>
                <h3 className="text-2xl font-semibold theme-fc-heading mb-4">Set Your Schedule</h3>
                <p className="theme-fc-light">
                  Choose your delivery zones and available hours. Update your schedule anytime to fit your lifestyle.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="text-center">
                <div className="relative w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Star className="w-10 h-10 text-white" />
                  <span className="absolute -top-2 -right-2 w-10 h-10 bg-white theme-fc-heading rounded-full flex items-center justify-center font-bold text-xl border-4 border-primary-100">3</span>
                </div>
                <h3 className="text-2xl font-semibold theme-fc-heading mb-4">Start Delivering</h3>
                <p className="theme-fc-light">
                  Accept delivery requests, pick up meals, and deliver to happy customers. Track earnings in real-time!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Requirements Section */}
      <div className="py-20 md:py-30 border-b theme-border-color theme-bg-color-dark">
        <div className="container-max-lg">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold theme-fc-heading mb-4">
              What You Need
            </h2>
            <p className="text-lg theme-fc-light max-w-2xl mx-auto">
              Simple requirements to get started
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4 p-6 box">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bike className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-semibold theme-fc-heading mb-2">Two-Wheeler</h4>
                  <p className="text-sm theme-fc-light">
                    Bike or scooter in good working condition
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 box">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold theme-fc-heading mb-2">Valid License</h4>
                  <p className="text-sm theme-fc-light">
                    Valid driving license and vehicle documents
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 box">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <Smartphone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold theme-fc-heading mb-2">Smartphone</h4>
                  <p className="text-sm theme-fc-light">
                    Android or iOS device with GPS and internet
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 box">
                <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <Heart className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h4 className="font-semibold theme-fc-heading mb-2">Customer Service</h4>
                  <p className="text-sm theme-fc-light">
                    Friendly attitude and commitment to quality service
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-20 md:py-30 border-b theme-border-color">
        <div className="container-max-lg">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold theme-fc-heading mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="box px-6">
                <AccordionTrigger className="text-left font-semibold theme-fc-heading">
                  How much can I earn as a rider?
                </AccordionTrigger>
                <AccordionContent className="theme-fc-light">
                  Earnings vary based on your hours and location. Most riders earn ₹25-₹50 per delivery plus tips. Working part-time (4-5 hours/day), you can earn ₹15,000-₹25,000 monthly. Full-time riders often earn ₹30,000-₹40,000+ per month.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="box px-6">
                <AccordionTrigger className="text-left font-semibold theme-fc-heading">
                  Can I choose my own working hours?
                </AccordionTrigger>
                <AccordionContent className="theme-fc-light">
                  Yes! You have complete flexibility. Log in whenever you want to work and log out when you&apos;re done. There are no minimum hour requirements.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="box px-6">
                <AccordionTrigger className="text-left font-semibold theme-fc-heading">
                  When do I get paid?
                </AccordionTrigger>
                <AccordionContent className="theme-fc-light">
                  We offer daily payouts. Your earnings are calculated daily and can be withdrawn to your bank account. Track all your earnings in real-time through the rider app.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="box px-6">
                <AccordionTrigger className="text-left font-semibold theme-fc-heading">
                  Do I need my own vehicle?
                </AccordionTrigger>
                <AccordionContent className="theme-fc-light">
                  Yes, you need your own two-wheeler (bike or scooter) with valid registration and insurance. We provide insulated delivery bags.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="box px-6">
                <AccordionTrigger className="text-left font-semibold theme-fc-heading">
                  Is there a registration fee?
                </AccordionTrigger>
                <AccordionContent className="theme-fc-light">
                  No, registration is completely free. There are no hidden charges or deposits required. Start earning from your first delivery!
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="box px-6">
                <AccordionTrigger className="text-left font-semibold theme-fc-heading">
                  What about fuel costs?
                </AccordionTrigger>
                <AccordionContent className="theme-fc-light">
                  Our delivery fees are designed to cover your fuel costs and time. Many riders find the earnings more than cover expenses and provide good income.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="relative overflow-hidden bg-[#EA5A36]">
        <div className="dark container-max-md pt-20 md:pt-30 pb-20 md:pb-30">
          <div className="text-center space-y-6">
            <div className="text-sm uppercase tracking-wider text-white-opacity-80">
              Ready to Get Started?
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
              Start Delivering and Earning Today
            </h2>
            <p className="text-lg text-white-opacity-90 max-w-2xl mx-auto">
              Join thousands of riders earning with Tummy Tales. Be your own boss and work on your schedule!
            </p>
            <div className="pt-4">
              <SignedOut>
                <Link href="/signup/rider">
                  <Button variant="white" size="lg" className="min-w-[220px] text-lg">
                    Sign Up as Rider
                  </Button>
                </Link>
              </SignedOut>
              <SignedIn>
                <Link href="/signup/rider">
                  <Button variant="white" size="lg" className="min-w-[220px] text-lg">
                    Add Rider Role
                  </Button>
                </Link>
              </SignedIn>
            </div>
            <p className="text-sm text-white-opacity-80 pt-4">
              Have questions? <Link href="/contact" className="underline hover:text-white">Contact our team</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

