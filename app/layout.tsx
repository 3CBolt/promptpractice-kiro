import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Prompt Practice App',
  description: 'Learn prompt engineering with interactive Guides and Labs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
