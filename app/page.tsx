import { Button } from "@/components/ui/button";
import Image from "next/image"
import Link from "next/link";
import { Utensils, Clock, Truck, Star, Shield, Smartphone, Users, Heart } from "lucide-react";

export default function Home() {
  return (
    <main className='site-content'>

      {/* Hero Section */}
      <div className='hero-section relative overflow-hidden border-b theme-border-color bg-[#EA5A36]'>
        <div className='relative z-2 gap-20 sm:gap-10'>
          <div className='container lb-hero-content'>
            <div className="flex flex-col gap-20 max-sm:gap-10">
              <div className="dark flex flex-col gap-6 pt-30 container-max-md text-center justify-center">
                <h1 className='lb-hero-heading theme-fc-heading w-full leading-6 text-2xl md:text-4xl lg:text-5xl font-medium' style={{lineHeight: 1.2}}>
                  Fresh, Home-Cooked Meals Delivered Daily
                </h1>
                <p className="theme-fc-light container-max-tab">
                  Connect with local home chefs and tiffin vendors for affordable, healthy, and delicious meals. Perfect for students, professionals, and PG residents who crave authentic home-cooked food.
                </p>
                <div className="flex gap-2 flex-wrap justify-center">
                  <Button variant="white" size="lg">
                    Order Now
                  </Button>
                  <Button variant="outline-white" size="lg">
                    Become a Vendor
                  </Button>
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
      <div className="pb-section pt-30 pb-30 max-md:py-20 border-b overflow-hidden relative">
        <div className="container">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold mb-4 theme-fc-heading text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 theme-fc-heading">Browse Vendors</h3>
              <p className="theme-fc-light">Discover local home chefs and tiffin vendors in your area. Read reviews, check menus, and find your perfect match.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 theme-fc-heading">Subscribe</h3>
              <p className="theme-fc-light">Choose your meal plans and subscription preferences. Set delivery schedules that work with your lifestyle.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 theme-fc-heading">Get Delivered</h3>
              <p className="theme-fc-light">Enjoy fresh, home-cooked meals delivered right to your doorstep. Track your orders in real-time.</p>
            </div>
          </div>
        </div>
      </div>

      {/* For Consumers Section */}
      <div id="consumers" className="pb-section pt-40 pb-44 overflow-hidden relative border-b">
        <div className="container-max-lg">
          <div className="container-max-md mb-20 flex flex-col gap-4">
            <h2 className="text-3xl md:text-4xl lg:text-5xl mb-7 text-center theme-fc-heading" style={{lineHeight: 1.2}}>
              For <b>Consumers</b>
            </h2>
            <p className="text-center max-sm:text-sm theme-fc-light container-max-tab">
              Get access to authentic, home-cooked meals without the hassle of cooking. Perfect for busy professionals, students, and anyone who misses the taste of home.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="box p-8 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg mb-4 flex items-center justify-center mx-auto">
                <Utensils className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl mb-3 theme-fc-base">Affordable</h3>
              <p className="text-fc-light max-sm:text-sm">Get quality home-cooked meals at prices that won't break your budget. Save money compared to restaurants.</p>
            </div>

            <div className="box p-8 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg mb-4 flex items-center justify-center mx-auto">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl mb-3 theme-fc-base">Healthy</h3>
              <p className="text-fc-light max-sm:text-sm">Fresh ingredients, balanced nutrition, and authentic cooking methods ensure you eat well every day.</p>
            </div>

            <div className="box p-8 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg mb-4 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl mb-3 theme-fc-base">Convenient</h3>
              <p className="text-fc-light max-sm:text-sm">No more meal planning or grocery shopping. Just order and enjoy delicious meals delivered to you.</p>
            </div>

            <div className="box p-8 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg mb-4 flex items-center justify-center mx-auto">
                <Heart className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl mb-3 theme-fc-base">Home-Cooked</h3>
              <p className="text-fc-light max-sm:text-sm">Experience the authentic taste of home-cooked meals prepared with love by skilled home chefs.</p>
            </div>
          </div>
        </div>
      </div>

      {/* For Vendors Section */}
      <div id="vendors" className='pb-section relative overflow-hidden border-b theme-border-color bg-[#EA5A36]'>
        <div className='dark container-max-lg pt-30 pb-30 lb-section-content w-full gap-10 flex flex-col items-center text-center relative'>
          <div className="gap-7 flex flex-col items-center text-center">
            <h2 className='lb-hero-heading theme-fc-heading w-full text-3xl md:text-4xl lg:text-5xl font-medium leading-6' style={{lineHeight: 1.2}}>
              For <b>Vendors</b>
            </h2>
            <p className='mb-3 theme-fc-light max-sm:text-sm container-max-tab'>
              Turn your cooking passion into a profitable business. Reach more customers, manage orders easily, and grow your home-based food business with our platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-white-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Extra Income</h3>
              <p className="text-white-opacity-80">Earn money doing what you love. Set your own prices and build a steady income stream.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Flexible Hours</h3>
              <p className="text-white-opacity-80">Work on your own schedule. Cook when it's convenient for you and your family.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Grow Your Business</h3>
              <p className="text-white-opacity-80">Access tools to manage orders, track earnings, and expand your customer base.</p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap justify-center mt-8">
            <Button variant="white" size="lg">
              Register as Vendor
            </Button>
          </div>
        </div>
      </div>

      {/* For Riders Section */}
      <div id="riders" className="pb-section pt-40 pb-44 overflow-hidden relative border-b">
        <div className="container-max-lg">
          <div className="container-max-md mb-20 flex flex-col gap-4">
            <h2 className="text-3xl md:text-4xl lg:text-5xl mb-7 text-center theme-fc-heading" style={{lineHeight: 1.2}}>
              For <b>Riders</b>
            </h2>
            <p className="text-center max-sm:text-sm theme-fc-light container-max-tab">
              Join our delivery network and earn money by connecting great food with hungry customers. Flexible work that fits your schedule.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="box p-8 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg mb-4 flex items-center justify-center mx-auto">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl mb-3 theme-fc-base">Flexible Work</h3>
              <p className="text-fc-light max-sm:text-sm">Choose your own hours and delivery areas. Work part-time or full-time based on your availability.</p>
            </div>

            <div className="box p-8 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg mb-4 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl mb-3 theme-fc-base">Earn Daily</h3>
              <p className="text-fc-light max-sm:text-sm">Get paid quickly with daily payouts. Track your earnings and delivery history in real-time.</p>
            </div>

            <div className="box p-8 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg mb-4 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl mb-3 theme-fc-base">Be Part of Community</h3>
              <p className="text-fc-light max-sm:text-sm">Join a supportive community of riders. Get support, tips, and grow together with other delivery partners.</p>
            </div>
          </div>

          <div className="text-center mt-8">
            <Button variant="default" size="lg">
              Join as Rider
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="pb-section pt-40 pb-44 overflow-hidden relative border-b">
        <div className="container-max-lg">
          <div className="container-max-md mb-20 flex flex-col gap-4">
            <h2 className="text-3xl md:text-4xl lg:text-5xl mb-7 text-center theme-fc-heading" style={{lineHeight: 1.2}}>
              Platform <b>Features</b>
            </h2>
            <p className="text-center max-sm:text-sm theme-fc-light container-max-tab">
              Everything you need for a seamless tiffin subscription experience. Built for consumers, vendors, and riders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="box p-8">
              <div className="w-12 h-12 bg-primary-100 rounded-lg mb-4 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl mb-3 theme-fc-base">Easy Subscription Management</h3>
              <p className="text-fc-light max-sm:text-sm">Manage your subscriptions, pause or skip meals, and customize your orders with just a few taps.</p>
            </div>

            <div className="box p-8">
              <div className="w-12 h-12 bg-primary-100 rounded-lg mb-4 flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl mb-3 theme-fc-base">Real-time Tracking</h3>
              <p className="text-fc-light max-sm:text-sm">Track your orders from kitchen to doorstep. Get live updates on preparation and delivery status.</p>
            </div>

            <div className="box p-8">
              <div className="w-12 h-12 bg-primary-100 rounded-lg mb-4 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl mb-3 theme-fc-base">Multiple Payment Options</h3>
              <p className="text-fc-light max-sm:text-sm">Pay with cards, UPI, wallets, or cash on delivery. Secure payment processing for peace of mind.</p>
            </div>

            <div className="box p-8">
              <div className="w-12 h-12 bg-primary-100 rounded-lg mb-4 flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl mb-3 theme-fc-base">Ratings & Reviews</h3>
              <p className="text-fc-light max-sm:text-sm">Read authentic reviews from other customers. Rate your meals and help others make informed choices.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className='pb-section relative overflow-hidden border-b theme-border-color bg-[#EA5A36]'>
        <div className='dark container-max-md pt-30 pb-30 lb-section-content w-full gap-10 flex flex-col items-center text-center relative'>
          <div className="gap-7 flex flex-col items-center text-center">
            <div className="text-center uppercase text-white-opacity-60 tracking-[4px] text-sm md:text-lg">Get Started Today!</div>
            <h2 className='lb-hero-heading theme-fc-heading w-full text-3xl md:text-4xl lg:text-5xl font-medium leading-6' style={{lineHeight: 1.2}}>
              Ready to Transform Your Mealtime?
            </h2>
            <p className='mb-3 theme-fc-light max-sm:text-sm container-max-tab'>
              Join thousands of satisfied customers who've discovered the joy of home-cooked meals delivered daily. Whether you're a hungry customer, aspiring vendor, or delivery partner, Tummy Tales has something for everyone.
            </p>
          </div>

          <div className="flex gap-2 flex-wrap justify-center">
            <Button variant="white" size="lg">
              Start Ordering
            </Button>
            <Button variant="outline-white" size="lg">
              Join as Vendor
            </Button>
          </div>
        </div>

        <div className="w-full h-64 bg-gradient-to-br from-orange-200 to-orange-400 flex items-center justify-center">
          <div className="text-center text-white">
            <Utensils className="w-16 h-16 mx-auto mb-4" />
            <p className="text-lg font-semibold">CTA Section Image Placeholder</p>
            <p className="text-sm opacity-80">Happy customers enjoying meals</p>
          </div>
        </div>

        <div className="h-[400px] absolute w-full bg-black" style={{boxShadow: '0px -160px 400px #0000004f'}}></div>
      </div>

    </main>
  );
}
