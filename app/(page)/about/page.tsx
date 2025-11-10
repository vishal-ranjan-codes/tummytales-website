import { Button } from "@/components/ui/button";

export default function About() {
  return (
    <main className='site-content'>
      {/* Hero Section */}
      <div className='hero-section relative overflow-hidden border-b theme-border-color bg-[#cd2555]'>

        <div className='relative z-2 gap-20 sm:gap-10 pt-16 pb-16'>
          <div className='dark container lb-hero-content'>
            <div className="flex flex-col gap-20 max-sm:gap-10">
              <div className="flex flex-col gap-6 pt-30 container-max-md text-center justify-center">
                <h1 className='lb-hero-heading theme-fc-heading w-full leading-6 text-2xl md:text-4xl lg:text-5xl font-medium' style={{lineHeight: 1.2}}>
                  About BellyBox
                </h1>
                <p className="theme-fc-light container-max-tab">
                  We&apos;re on a mission to connect home chefs with hungry customers. No more expensive restaurants, no more unhealthy fast food - just fresh, authentic, home-cooked meals delivered to your doorstep.
                </p>
                <div className="flex gap-2 flex-wrap justify-center">
                  <Button variant="white" size="lg">
                    Start Ordering
                  </Button>
                  <Button variant="outline-white" size="lg">
                    Become a Vendor
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Our Story Section */}
      <div className="pb-section pt-30 pb-30 max-md:py-20 border-b overflow-hidden relative">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl mb-7 theme-fc-heading" style={{lineHeight: 1.2}}>
                Our Story
              </h2>
              <p className="text-lg mb-6 theme-fc-light">
                BellyBox was born from a simple observation: millions of people crave home-cooked meals but don&apos;t have the time or skills to prepare them, while talented home chefs struggle to reach customers beyond their immediate neighborhoods.
              </p>
              <p className="text-lg mb-6 theme-fc-light">
                We believe that everyone deserves access to fresh, authentic, home-cooked meals. That&apos;s why we&apos;ve created a platform that connects skilled home chefs with hungry customers, making quality food accessible and affordable for everyone.
              </p>
              <p className="text-lg theme-fc-light">
                From students and working professionals to home chefs and delivery partners, we&apos;ve built a community that celebrates good food and supports local culinary talent.
              </p>
            </div>
            <div className="relative">
              <div className="box p-2 theme-rounded-lg">
                <div className="aspect-square relative overflow-hidden theme-rounded-md">
                  <div className="w-full h-full bg-gradient-to-br from-orange-200 to-orange-400 flex items-center justify-center">
                    <div className="text-center text-white">
                      <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <p className="text-lg font-semibold">Our Story Image</p>
                      <p className="text-sm opacity-80">Team working together</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mission & Values Section */}
      <div className="pb-section pt-40 pb-44 overflow-hidden relative border-b">
        <div className="container-max-lg">
          <div className="container-max-md mb-20 flex flex-col gap-4">
            <h2 className="text-3xl md:text-4xl lg:text-5xl mb-7 text-center theme-fc-heading" style={{lineHeight: 1.2}}>
              Our Mission & Values
            </h2>
            <p className="text-center max-sm:text-sm theme-fc-light container-max-tab">
              We&apos;re building more than just a food delivery platform - we&apos;re building a community that celebrates authentic home-cooked meals and supports local culinary talent.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="box p-8">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl mb-3 theme-fc-base">Quality First</h3>
              <p className="text-fc-light max-sm:text-sm">We ensure every meal meets our high standards for freshness, taste, and nutrition. Quality ingredients and authentic cooking methods are non-negotiable.</p>
            </div>

            <div className="box p-8">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-xl mb-3 theme-fc-base">Community Driven</h3>
              <p className="text-fc-light max-sm:text-sm">We believe in building a supportive community where home chefs can thrive, customers can discover amazing food, and everyone benefits from authentic home-cooked meals.</p>
            </div>

            <div className="box p-8">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl mb-3 theme-fc-base">Sustainability</h3>
              <p className="text-fc-light max-sm:text-sm">We promote sustainable food practices by supporting local producers, reducing food waste, and creating economic opportunities for home-based food businesses.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="pb-section pt-40 pb-44 overflow-hidden relative">
        <div className="container">
          <div className="container-max-md text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl mb-7 theme-fc-heading" style={{lineHeight: 1.2}}>
              Ready to Join Our Community?
            </h2>
            <p className="text-lg mb-8 theme-fc-light">
              Join thousands of satisfied customers, talented home chefs, and delivery partners who&apos;ve already discovered the joy of BellyBox.
            </p>
            <div className="flex gap-4 flex-wrap justify-center">
              <Button variant="default" size="lg">
                Start Ordering
              </Button>
              <Button variant="outline" size="lg">
                Become a Vendor
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
