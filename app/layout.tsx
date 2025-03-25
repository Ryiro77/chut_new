import type { Metadata } from "next"
import { Inter, Urbanist } from 'next/font/google'
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { NextAuthProvider } from "@/components/providers"
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const urbanist = Urbanist({ subsets: ['latin'], variable: '--font-urbanist' })

export const metadata: Metadata = {
  title: "PC Builder - Custom PC Parts & Builds",
  description: "Build your custom PC with our wide selection of components. Find the best PC parts, compare prices, and create your dream build with our PC Builder tool.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${urbanist.variable} ${inter.variable} antialiased`}>
        <NextAuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  )
}
