// ROOT LAYOUT — wraps every single page in the app
// Whatever is here appears on ALL pages
// This is where global styles, fonts, and metadata live
// Next.js requires this file to exist

import type { Metadata } from 'next'
import './globals.css'

// Metadata appears in:
//   - Browser tab title
//   - Search engine results
//   - Social media link previews
export const metadata: Metadata = {
  title: 'Smart Bookmarks',
  description: 'Save, organize and access your bookmarks from anywhere',
}

export default function RootLayout({
  children, // children = the current page being visited
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {/* Every page renders inside here */}
        {children}
      </body>
    </html>
  )
}