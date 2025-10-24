import Copyright from "./CopyRight"
import HeaderLogo from "./HeaderLogo"
import Link from "next/link"
import { LinkedinIcon, FacebookIcon, TwitterIcon, YoutubeIcon } from "lucide-react"

const Footer = () => {
    return (
      <footer className="site-footer">

        {/* Main Footer Content */}
        <div className="site-footer-content theme-bg-color border-t theme-border-color py-12 md:py-16">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
              {/* Brand Column */}
              <div className="space-y-4">
                <HeaderLogo />
                <p className="text-sm theme-fc-light">
                  Fresh, home-cooked meals delivered daily. Connect with local home chefs for affordable, healthy, and delicious meals.
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="text-base font-semibold theme-fc-heading mb-4">Quick Links</h3>
                <ul className="space-y-2.5">
                  <li>
                    <Link href="/#how-it-works" className="text-sm theme-fc-light hover:theme-text-primary-color-100 transition-colors">
                      How It Works
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className="text-sm theme-fc-light hover:theme-text-primary-color-100 transition-colors">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-sm theme-fc-light hover:theme-text-primary-color-100 transition-colors">
                      Contact
                    </Link>
                  </li>
                  <li>
                    <Link href="/homechefs" className="text-sm theme-fc-light hover:theme-text-primary-color-100 transition-colors">
                      Browse Home Chefs
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Get Started */}
              <div>
                <h3 className="text-base font-semibold theme-fc-heading mb-4">Get Started</h3>
                <ul className="space-y-2.5">
                  <li>
                    <Link href="/signup/customer" className="text-sm theme-fc-light hover:theme-text-primary-color-100 transition-colors">
                      Sign up as Customer
                    </Link>
                  </li>
                  <li>
                    <Link href="/signup/vendor" className="text-sm theme-fc-light hover:theme-text-primary-color-100 transition-colors">
                      Sign up as Vendor
                    </Link>
                  </li>
                  <li>
                    <Link href="/signup/rider" className="text-sm theme-fc-light hover:theme-text-primary-color-100 transition-colors">
                      Sign up as Rider
                    </Link>
                  </li>
                  <li>
                    <Link href="/login" className="text-sm theme-fc-light hover:theme-text-primary-color-100 transition-colors">
                      Login
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h3 className="text-base font-semibold theme-fc-heading mb-4">Legal</h3>
                <ul className="space-y-2.5">
                  <li>
                    <Link href="/privacy-policy" className="text-sm theme-fc-light hover:theme-text-primary-color-100 transition-colors">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms-and-conditions" className="text-sm theme-fc-light hover:theme-text-primary-color-100 transition-colors">
                      Terms & Conditions
                    </Link>
                  </li>
                  <li>
                    <Link href="/refund-policy" className="text-sm theme-fc-light hover:theme-text-primary-color-100 transition-colors">
                      Refund Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/shipping-and-delivery" className="text-sm theme-fc-light hover:theme-text-primary-color-100 transition-colors">
                      Delivery Policy
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Social Media */}
            <div className="flex py-6 border-y theme-border-color-light gap-6 justify-center items-center my-8">
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Follow us on LinkedIn"
                className="w-10 h-10 rounded-full theme-bg-color-dark flex items-center justify-center hover:theme-bg-primary-color-100 hover:text-white transition-all"
              >
                <LinkedinIcon className="w-5 h-5"/>
              </a>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Follow us on Facebook"
                className="w-10 h-10 rounded-full theme-bg-color-dark flex items-center justify-center hover:theme-bg-primary-color-100 hover:text-white transition-all"
              >
                <FacebookIcon className="w-5 h-5"/>
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Follow us on Twitter"
                className="w-10 h-10 rounded-full theme-bg-color-dark flex items-center justify-center hover:theme-bg-primary-color-100 hover:text-white transition-all"
              >
                <TwitterIcon className="w-5 h-5"/>
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Follow us on YouTube"
                className="w-10 h-10 rounded-full theme-bg-color-dark flex items-center justify-center hover:theme-bg-primary-color-100 hover:text-white transition-all"
              >
                <YoutubeIcon className="w-5 h-5"/>
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t theme-fg-color-dark">
          <div className="container">
            <Copyright/>
          </div>
        </div>

      </footer>
    )
  }
  
  export default Footer
