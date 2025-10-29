import type { Metadata } from "next";
import { Inter } from 'next/font/google'
import "./globals.css";
import Footer from './components/Footer'
import Header from './components/Header'
import { getBaseMetadata } from '@/lib/seo/metadata'
import { getOrganizationSchema, getWebsiteSchema } from '@/lib/seo/structured-data'
import StructuredData from './components/seo/StructuredData'
import { AuthProvider } from '@/lib/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = getBaseMetadata()

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className='light'>
      <head>
        <StructuredData data={getOrganizationSchema()} />
        <StructuredData data={getWebsiteSchema()} />
      </head>
      <body className={`theme-fc-base theme-bg-color ${ inter.className }`}>
        <AuthProvider>
          <div className="site" id="page">
            <Header/>
              {children}
            <Footer/>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
