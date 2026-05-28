import type { Metadata } from "next"
import { Geist_Mono, Noto_Sans } from "next/font/google"

import "./globals.css"
import { FirebaseAnalytics } from "@/components/firebase-analytics"
import { QueryProvider } from "@/components/query-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

const notoSans = Noto_Sans({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://my-link-pink.vercel.app"
const siteTitle = "MyLink | Development in One Link"
const siteDescription =
  "GitHub, 블로그, 포트폴리오까지 개발자의 정보를 한 페이지로 요약해보세요."

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "MyLink",
  title: {
    default: siteTitle,
    template: "%s | MyLink",
  },
  description: siteDescription,
  keywords: [
    "MyLink",
    "마이링크",
    "링크트리",
    "개발자 포트폴리오",
    "프로필 링크",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: "/",
    siteName: "MyLink",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "MyLink - Development in One Link",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/opengraph-image"],
  },
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
        <QueryProvider>
          <ThemeProvider>
            <FirebaseAnalytics />
            {children}
            <Toaster position="top-center" />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
