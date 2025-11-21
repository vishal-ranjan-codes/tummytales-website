import type { Metadata } from "next";
import "./globals.css";
import FooterWrapper from './components/FooterWrapper'
import HeaderServer from './components/HeaderServer'
import { getBaseMetadata } from '@/lib/seo/metadata'
import { getOrganizationSchema, getWebsiteSchema } from '@/lib/seo/structured-data'
import StructuredData from './components/seo/StructuredData'
import { AuthProvider } from '@/lib/contexts/AuthContext'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = getBaseMetadata()

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className='light'>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet" />
        <StructuredData data={getOrganizationSchema()} />
        <StructuredData data={getWebsiteSchema()} />
      </head>
      <body className="theme-fc-base theme-bg-color font-inter">
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
