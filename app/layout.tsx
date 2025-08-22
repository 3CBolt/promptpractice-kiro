import type { Metadata } from 'next'
import './globals.css'
import ErrorBoundary from '@/components/ErrorBoundary'
import GlobalNav from '@/components/GlobalNav'

export const metadata: Metadata = {
  title: 'Prompt Practice App',
  description: 'Learn prompt engineering with interactive Guides and Labs',
  keywords: 'prompt engineering, AI, machine learning, education, practice',
  authors: [{ name: 'Prompt Practice Team' }],
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#007bff',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <ErrorBoundary>
          <div id="root">
            <GlobalNav />
            <main id="main-content" role="main">
              {children}
            </main>
          </div>
        </ErrorBoundary>
        
        {/* Focus management for screen readers */}
        <div id="announcements" aria-live="polite" aria-atomic="true" className="sr-only" />
      </body>
    </html>
  )
}
