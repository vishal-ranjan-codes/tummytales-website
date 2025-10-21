import Copyright from "./CopyRight"
import HeaderLogo from "./HeaderLogo"
import Link from "next/link"
import { LinkedinIcon, FacebookIcon, TwitterIcon, YoutubeIcon } from "lucide-react"

const Footer = () => {
    return (
      <footer className="site-footer">

        <div className="site-footer-branding border-t theme-bg-color theme-border-color py-10">
          <div className="container-max-tab flex flex-col justify-center">
            <div className="flex justify-center">
              <HeaderLogo />
            </div>
            <div className="flex py-4 border-y theme-border-color-light gap-6 justify-center items-center my-4">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <LinkedinIcon className="text-fc-light w-4 hover:text-blue-500 transition-colors"/>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <FacebookIcon className="text-fc-light w-4 hover:text-blue-500 transition-colors"/>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <TwitterIcon className="text-fc-light w-4 hover:text-blue-500 transition-colors"/>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <YoutubeIcon className="text-fc-light w-4 hover:text-red-500 transition-colors"/>
              </a>
            </div>
            <div className="flex gap-4 justify-center items-center text-sm">
              <Link href="/privacy-policy">Privacy Policy</Link>
              <Link href="/terms-and-conditions">Terms & Conditions</Link>
              <Link href="/refund-policy">Refund Policy</Link>
              <Link href="/shipping-and-delivery">Delivery Policy</Link>
            </div>
          </div>
        </div>

        <div className="border-t theme-fg-color-dark">
          <div className="container">
            <Copyright/>
          </div>
        </div>

      </footer>
    )
  }
  
  export default Footer