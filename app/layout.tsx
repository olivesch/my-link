import type { Metadata } from "next"
import { Geist_Mono, Noto_Sans } from "next/font/google"

import "./globals.css"
import { FirebaseAnalytics } from "@/components/firebase-analytics"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const notoSans = Noto_Sans({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "dev_kim | MyLink",
  description: "Frontend Developer dev_kim의 링크 페이지입니다.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        notoSans.variable
      )}
    >
      <body>
        <ThemeProvider>
          <FirebaseAnalytics />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
