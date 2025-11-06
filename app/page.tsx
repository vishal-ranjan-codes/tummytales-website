import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Utensils, Clock, Truck, Star, Shield, Smartphone, Users, Heart } from "lucide-react";

export default function Home() {
  return (
    <main className='site-content'>

      {/* Hero Section */}
      <div className='hero-section relative overflow-hidden border-b theme-border-color bg-[#EA5A36]'>
        <div className='relative z-2 gap-20 sm:gap-10'>
          <div className='container lb-hero-content'>
            <div className="flex flex-col gap-20 max-sm:gap-10">
              <div className="dark flex flex-col gap-6 pt-20 md:pt-30 container-max-md text-center justify-center animate-in fade-in duration-700">
                <h1 className='lb-hero-heading theme-fc-heading w-full leading-6 text-xl sm:text-2xl md:text-4xl lg:text-5xl font-medium' style={{lineHeight: 1.2}}>
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
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="pb-section pt-20 md:pt-30 pb-20 md:pb-30 border-b overflow-hidden relative scroll-mt-20">
        <div className="container">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-4 theme-fc-heading text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 mt-8 md:mt-12">
            <div className="text-center p-6 rounded-lg hover:theme-bg-color-dark transition-colors">
              <div className="relative w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-white" />
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-white theme-fc-heading rounded-full flex items-center justify-center font-bold text-sm border-2 border-primary-100">1</span>
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-3 theme-fc-heading">Browse Vendors</h3>
              <p className="theme-fc-light text-sm md:text-base">Discover local home chefs and tiffin vendors in your area. Read reviews, check menus, and find your perfect match.</p>
            </div>
            <div className="text-center p-6 rounded-lg hover:theme-bg-color-dark transition-colors">
              <div className="relative w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-10 h-10 text-white" />
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-white theme-fc-heading rounded-full flex items-center justify-center font-bold text-sm border-2 border-primary-100">2</span>
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-3 theme-fc-heading">Subscribe</h3>
              <p className="theme-fc-light text-sm md:text-base">Choose your meal plans and subscription preferences. Set delivery schedules that work with your lifestyle.</p>
            </div>
            <div className="text-center p-6 rounded-lg hover:theme-bg-color-dark transition-colors">
              <div className="relative w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-10 h-10 text-white" />
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-white theme-fc-heading rounded-full flex items-center justify-center font-bold text-sm border-2 border-primary-100">3</span>
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-3 theme-fc-heading">Get Delivered</h3>
              <p className="theme-fc-light text-sm md:text-base">Enjoy fresh, home-cooked meals delivered right to your doorstep. Track your orders in real-time.</p>
            </div>
          </div>
        </div>
      </div>

      {/* For Consumers Section */}
      <div id="consumers" className="pb-section pt-20 md:pt-40 pb-20 md:pb-44 overflow-hidden relative border-b scroll-mt-20">
        <div className="container-max-lg">
          <div className="container-max-md mb-12 md:mb-20 flex flex-col gap-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-4 md:mb-7 text-center theme-fc-heading" style={{lineHeight: 1.2}}>
              For <b>Consumers</b>
            </h2>
            <p className="text-center text-sm sm:text-base theme-fc-light container-max-tab">
              Get access to authentic, home-cooked meals without the hassle of cooking. Perfect for busy professionals, students, and anyone who misses the taste of home.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="box p-6 md:p-8 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-lg mb-4 flex items-center justify-center mx-auto">
                <Utensils className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg md:text-xl mb-3 theme-fc-heading font-semibold">Affordable</h3>
              <p className="text-fc-light text-sm md:text-base">Get quality home-cooked meals at prices that won&apos;t break your budget. Save money compared to restaurants.</p>
            </div>

            <div className="box p-6 md:p-8 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-lg mb-4 flex items-center justify-center mx-auto">
                <Shield className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg md:text-xl mb-3 theme-fc-heading font-semibold">Healthy</h3>
              <p className="text-fc-light text-sm md:text-base">Fresh ingredients, balanced nutrition, and authentic cooking methods ensure you eat well every day.</p>
            </div>

            <div className="box p-6 md:p-8 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-lg mb-4 flex items-center justify-center mx-auto">
                <Clock className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg md:text-xl mb-3 theme-fc-heading font-semibold">Convenient</h3>
              <p className="text-fc-light text-sm md:text-base">No more meal planning or grocery shopping. Just order and enjoy delicious meals delivered to you.</p>
            </div>

            <div className="box p-6 md:p-8 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-lg mb-4 flex items-center justify-center mx-auto">
                <Heart className="w-7 h-7 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg md:text-xl mb-3 theme-fc-heading font-semibold">Home-Cooked</h3>
              <p className="text-fc-light text-sm md:text-base">Experience the authentic taste of home-cooked meals prepared with love by skilled home chefs.</p>
            </div>
          </div>
        </div>
      </div>

      {/* For Vendors Section */}
      <div id="vendors" className='pb-section relative overflow-hidden border-b theme-border-color bg-[#EA5A36] scroll-mt-20'>
        <div className='dark container-max-lg pt-20 md:pt-30 pb-20 md:pb-30 lb-section-content w-full gap-8 md:gap-10 flex flex-col items-center text-center relative'>
          <div className="gap-4 md:gap-7 flex flex-col items-center text-center">
            <h2 className='lb-hero-heading theme-fc-heading w-full text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium leading-6' style={{lineHeight: 1.2}}>
              For <b>Vendors</b>
            </h2>
            <p className='mb-3 theme-fc-light text-sm sm:text-base container-max-tab'>
              Turn your cooking passion into a profitable business. Reach more customers, manage orders easily, and grow your home-based food business with our platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full max-w-4xl">
            <div className="text-center p-4">
              <div className="w-16 md:w-20 h-16 md:h-20 bg-white-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 md:w-10 h-8 md:h-10 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2 text-white">Extra Income</h3>
              <p className="text-white-opacity-80 text-sm md:text-base">Earn money doing what you love. Set your own prices and build a steady income stream.</p>
            </div>
            <div className="text-center p-4">
              <div className="w-16 md:w-20 h-16 md:h-20 bg-white-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 md:w-10 h-8 md:h-10 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2 text-white">Flexible Hours</h3>
              <p className="text-white-opacity-80 text-sm md:text-base">Work on your own schedule. Cook when it&apos;s convenient for you and your family.</p>
            </div>
            <div className="text-center p-4">
              <div className="w-16 md:w-20 h-16 md:h-20 bg-white-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 md:w-10 h-8 md:h-10 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2 text-white">Grow Your Business</h3>
              <p className="text-white-opacity-80 text-sm md:text-base">Access tools to manage orders, track earnings, and expand your customer base.</p>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap justify-center mt-4 md:mt-8">
            <Link href="/signup/vendor">
              <Button variant="white" size="lg" className="min-w-[180px]">
                Register as Vendor
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* For Riders Section */}
      <div id="riders" className="pb-section pt-20 md:pt-40 pb-20 md:pb-44 overflow-hidden relative border-b scroll-mt-20">
        <div className="container-max-lg">
          <div className="container-max-md mb-12 md:mb-20 flex flex-col gap-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-4 md:mb-7 text-center theme-fc-heading" style={{lineHeight: 1.2}}>
              For <b>Riders</b>
            </h2>
            <p className="text-center text-sm sm:text-base theme-fc-light container-max-tab">
              Join our delivery network and earn money by connecting great food with hungry customers. Flexible work that fits your schedule.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="box p-6 md:p-8 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-lg mb-4 flex items-center justify-center mx-auto">
                <Truck className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg md:text-xl mb-3 theme-fc-heading font-semibold">Flexible Work</h3>
              <p className="text-fc-light text-sm md:text-base">Choose your own hours and delivery areas. Work part-time or full-time based on your availability.</p>
            </div>

            <div className="box p-6 md:p-8 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-lg mb-4 flex items-center justify-center mx-auto">
                <Clock className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg md:text-xl mb-3 theme-fc-heading font-semibold">Earn Daily</h3>
              <p className="text-fc-light text-sm md:text-base">Get paid quickly with daily payouts. Track your earnings and delivery history in real-time.</p>
            </div>

            <div className="box p-6 md:p-8 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-lg mb-4 flex items-center justify-center mx-auto">
                <Users className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg md:text-xl mb-3 theme-fc-heading font-semibold">Be Part of Community</h3>
              <p className="text-fc-light text-sm md:text-base">Join a supportive community of riders. Get support, tips, and grow together with other delivery partners.</p>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link href="/signup/rider">
              <Button variant="default" size="lg" className="min-w-[160px]">
                Join as Rider
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="pb-section pt-20 md:pt-40 pb-20 md:pb-44 overflow-hidden relative border-b scroll-mt-20">
        <div className="container-max-lg">
          <div className="container-max-md mb-12 md:mb-20 flex flex-col gap-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-4 md:mb-7 text-center theme-fc-heading" style={{lineHeight: 1.2}}>
              Platform <b>Features</b>
            </h2>
            <p className="text-center text-sm sm:text-base theme-fc-light container-max-tab">
              Everything you need for a seamless tiffin subscription experience. Built for consumers, vendors, and riders.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="box p-6 md:p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-primary-100 dark:bg-primary-100--dark rounded-lg mb-4 flex items-center justify-center">
                <Smartphone className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg md:text-xl mb-3 theme-fc-heading font-semibold">Easy Subscription Management</h3>
              <p className="text-fc-light text-sm md:text-base">Manage your subscriptions, pause or skip meals, and customize your orders with just a few taps.</p>
              </div>

              <div className="box p-6 md:p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-primary-100 dark:bg-primary-100--dark rounded-lg mb-4 flex items-center justify-center">
                <Truck className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg md:text-xl mb-3 theme-fc-heading font-semibold">Real-time Tracking</h3>
              <p className="text-fc-light text-sm md:text-base">Track your orders from kitchen to doorstep. Get live updates on preparation and delivery status.</p>
              </div>

              <div className="box p-6 md:p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-primary-100 dark:bg-primary-100--dark rounded-lg mb-4 flex items-center justify-center">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg md:text-xl mb-3 theme-fc-heading font-semibold">Multiple Payment Options</h3>
              <p className="text-fc-light text-sm md:text-base">Pay with cards, UPI, wallets, or cash on delivery. Secure payment processing for peace of mind.</p>
              </div>

              <div className="box p-6 md:p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-primary-100 dark:bg-primary-100--dark rounded-lg mb-4 flex items-center justify-center">
                <Star className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg md:text-xl mb-3 theme-fc-heading font-semibold">Ratings & Reviews</h3>
              <p className="text-fc-light text-sm md:text-base">Read authentic reviews from other customers. Rate your meals and help others make informed choices.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className='pb-section relative overflow-hidden border-b theme-border-color bg-[#EA5A36]'>
        <div className='dark container-max-md pt-20 md:pt-30 pb-20 md:pb-30 lb-section-content w-full gap-8 md:gap-10 flex flex-col items-center text-center relative'>
          <div className="gap-4 md:gap-7 flex flex-col items-center text-center px-4">
            <div className="text-center uppercase text-white-opacity-60 tracking-[3px] md:tracking-[4px] text-xs md:text-sm lg:text-base">Get Started Today!</div>
            <h2 className='lb-hero-heading theme-fc-heading w-full text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium leading-6' style={{lineHeight: 1.2}}>
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

        <div className="h-[300px] md:h-[400px] absolute w-full bg-black pointer-events-none" style={{boxShadow: '0px -160px 400px #0000004f'}}></div>
      </div>

    </main>
  );
}
