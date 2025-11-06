import type { Metadata } from "next";
import { Inter } from 'next/font/google'
import "./globals.css";
import FooterWrapper from './components/FooterWrapper'
import HeaderServer from './components/HeaderServer'
import { getBaseMetadata } from '@/lib/seo/metadata'
import { getOrganizationSchema, getWebsiteSchema } from '@/lib/seo/structured-data'
import StructuredData from './components/seo/StructuredData'
import { AuthProvider } from '@/lib/contexts/AuthContext'
import { Toaster } from '@/components/ui/sonner'

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
          <HeaderServer/>
            {children}
          <FooterWrapper/>
        </div>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
