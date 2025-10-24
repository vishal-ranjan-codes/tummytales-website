/**
 * Join as Vendor Landing Page
 * Recruitment page for home chefs and tiffin vendors
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SignedIn, SignedOut } from '@/app/components/auth-components'
import { 
  DollarSign, 
  Clock, 
  Users, 
  TrendingUp, 
  Shield, 
  Smartphone,
  ChefHat,
  Home,
  Heart,
  Star
} from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export const metadata = {
  title: 'Join as Vendor | Tummy Tales',
  description: 'Turn your cooking passion into a profitable business. Join Tummy Tales as a home chef or tiffin vendor and reach customers in your area.',
}

export default function JoinVendorPage() {
  return (
    <main className="site-content">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-[#EA5A36] border-b theme-border-color">
        <div className="dark container-max-lg pt-20 md:pt-30 pb-20 md:pb-30">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white-opacity-20 rounded-full text-white text-sm font-medium mb-4">
              <ChefHat className="w-4 h-4" />
              <span>Start Your Food Business Today</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Turn Your Passion for Cooking<br />Into a <span className="underline decoration-wavy">Profitable Business</span>
            </h1>
            
            <p className="text-lg md:text-xl text-white-opacity-90 max-w-3xl mx-auto">
              Join Tummy Tales and connect with hungry customers in your area. Cook from home, set your own hours, and earn a steady income doing what you love.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <SignedOut>
                <Link href="/signup/vendor">
                  <Button variant="white" size="lg" className="min-w-[200px] text-base">
                    Get Started Now
                  </Button>
                </Link>
              </SignedOut>
              <SignedIn>
                <Link href="/signup/vendor">
                  <Button variant="white" size="lg" className="min-w-[200px] text-base">
                    Add Vendor Role
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
                  ✨ Already logged in? Add the vendor role to your account to start selling your delicious meals!
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
              Why Join Tummy Tales?
            </h2>
            <p className="text-lg theme-fc-light max-w-2xl mx-auto">
              Everything you need to build and grow your home-based food business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="box p-8 text-center hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold theme-fc-heading mb-3">Earn Extra Income</h3>
              <p className="theme-fc-light">
                Set your own prices and earn money doing what you love. Many vendors earn ₹15,000-₹30,000+ per month.
              </p>
            </div>

            <div className="box p-8 text-center hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold theme-fc-heading mb-3">Flexible Schedule</h3>
              <p className="theme-fc-light">
                Work on your own time. Cook when it&apos;s convenient for you and set your own delivery hours.
              </p>
            </div>

            <div className="box p-8 text-center hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold theme-fc-heading mb-3">Ready Customer Base</h3>
              <p className="theme-fc-light">
                Access thousands of customers looking for home-cooked meals in your area. We bring customers to you.
              </p>
            </div>

            <div className="box p-8 text-center hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Home className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold theme-fc-heading mb-3">Work from Home</h3>
              <p className="theme-fc-light">
                No need for a commercial kitchen or restaurant space. Cook from your own home kitchen.
              </p>
            </div>

            <div className="box p-8 text-center hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-semibold theme-fc-heading mb-3">Easy Management</h3>
              <p className="theme-fc-light">
                Simple dashboard to manage orders, track earnings, update menu, and communicate with customers.
              </p>
            </div>

            <div className="box p-8 text-center hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold theme-fc-heading mb-3">Grow Your Business</h3>
              <p className="theme-fc-light">
                Build your reputation with reviews and ratings. Expand your customer base and increase earnings over time.
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
              Get started in 3 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div className="relative">
              <div className="text-center">
                <div className="relative w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-white" />
                  <span className="absolute -top-2 -right-2 w-10 h-10 bg-white theme-fc-heading rounded-full flex items-center justify-center font-bold text-xl border-4 border-primary-100">1</span>
                </div>
                <h3 className="text-2xl font-semibold theme-fc-heading mb-4">Sign Up</h3>
                <p className="theme-fc-light">
                  Create your vendor account and complete your profile. Tell us about your cooking style and specialties.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="text-center">
                <div className="relative w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-10 h-10 text-white" />
                  <span className="absolute -top-2 -right-2 w-10 h-10 bg-white theme-fc-heading rounded-full flex items-center justify-center font-bold text-xl border-4 border-primary-100">2</span>
                </div>
                <h3 className="text-2xl font-semibold theme-fc-heading mb-4">Create Your Menu</h3>
                <p className="theme-fc-light">
                  Add your dishes, set prices, and define your subscription plans. Upload appetizing photos of your food.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="text-center">
                <div className="relative w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Star className="w-10 h-10 text-white" />
                  <span className="absolute -top-2 -right-2 w-10 h-10 bg-white theme-fc-heading rounded-full flex items-center justify-center font-bold text-xl border-4 border-primary-100">3</span>
                </div>
                <h3 className="text-2xl font-semibold theme-fc-heading mb-4">Start Cooking</h3>
                <p className="theme-fc-light">
                  Receive orders, prepare delicious meals, and start earning. We handle delivery and payments for you.
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
                  <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-semibold theme-fc-heading mb-2">FSSAI License</h4>
                  <p className="text-sm theme-fc-light">
                    Valid food safety license (we can help you get one)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 box">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <Home className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold theme-fc-heading mb-2">Home Kitchen</h4>
                  <p className="text-sm theme-fc-light">
                    Clean, well-maintained kitchen space
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 box">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <Heart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold theme-fc-heading mb-2">Cooking Passion</h4>
                  <p className="text-sm theme-fc-light">
                    Love for cooking and serving quality food
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 box">
                <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <Smartphone className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h4 className="font-semibold theme-fc-heading mb-2">Smartphone</h4>
                  <p className="text-sm theme-fc-light">
                    To manage orders and communicate with customers
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
                  How much can I earn as a vendor?
                </AccordionTrigger>
                <AccordionContent className="theme-fc-light">
                  Earnings vary based on your menu, pricing, and number of customers. Most vendors earn ₹15,000-₹30,000 per month, with top vendors earning ₹50,000+. You set your own prices and control your earning potential.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="box px-6">
                <AccordionTrigger className="text-left font-semibold theme-fc-heading">
                  Do I need a commercial kitchen?
                </AccordionTrigger>
                <AccordionContent className="theme-fc-light">
                  No, you can cook from your home kitchen. However, you need to maintain proper hygiene standards and have a valid FSSAI license for home-based food businesses.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="box px-6">
                <AccordionTrigger className="text-left font-semibold theme-fc-heading">
                  Who handles delivery?
                </AccordionTrigger>
                <AccordionContent className="theme-fc-light">
                  We have a network of delivery riders who will pick up meals from your location and deliver to customers. You focus on cooking, we handle the logistics.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="box px-6">
                <AccordionTrigger className="text-left font-semibold theme-fc-heading">
                  When do I receive payments?
                </AccordionTrigger>
                <AccordionContent className="theme-fc-light">
                  Payments are processed weekly directly to your bank account. You can track all your earnings in real-time through your vendor dashboard.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="box px-6">
                <AccordionTrigger className="text-left font-semibold theme-fc-heading">
                  Is there a registration fee?
                </AccordionTrigger>
                <AccordionContent className="theme-fc-light">
                  No, registration is completely free. We only charge a small commission on each order to cover platform costs and delivery.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="box px-6">
                <AccordionTrigger className="text-left font-semibold theme-fc-heading">
                  Can I set my own working hours?
                </AccordionTrigger>
                <AccordionContent className="theme-fc-light">
                  Absolutely! You have complete flexibility to set your available days and times. Take breaks whenever you need and work at your own pace.
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
              Start Your Food Business Today
            </h2>
            <p className="text-lg text-white-opacity-90 max-w-2xl mx-auto">
              Join thousands of home chefs already earning with Tummy Tales. Turn your cooking passion into profit!
            </p>
            <div className="pt-4">
              <SignedOut>
                <Link href="/signup/vendor">
                  <Button variant="white" size="lg" className="min-w-[220px] text-lg">
                    Sign Up as Vendor
                  </Button>
                </Link>
              </SignedOut>
              <SignedIn>
                <Link href="/signup/vendor">
                  <Button variant="white" size="lg" className="min-w-[220px] text-lg">
                    Add Vendor Role
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

