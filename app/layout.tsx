import type { Metadata } from "next";
import { Inter } from 'next/font/google'
import "./globals.css";
import Footer from './components/Footer'
import Header from './components/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Tummy Tales - Home-Cooked Tiffin Subscriptions',
  description: 'Fresh, home-cooked meals delivered daily. Connect with local home chefs and tiffin vendors for affordable, healthy, and delicious meals. Perfect for students, professionals, and PG residents.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className='light'>
      <body className={`theme-fc-base theme-bg-color ${ inter.className }`}>
        <div className="site" id="page">
          <Header/>
            {children}
          <Footer/>
        </div>
      </body>
    </html>
  );
}
