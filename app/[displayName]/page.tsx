import type { Metadata } from "next"

import { PublicProfilePage } from "@/components/public-profile-page"
import { fetchOgPublicProfile } from "@/lib/og/public-profile"

type PageProps = {
  params: Promise<{ displayName: string }>
}

function normalizeDisplayName(displayName: string) {
  return displayName.trim().replace(/^@/, "")
}

function getProfileTitle(userName: string | undefined, displayName: string) {
  if (userName && userName.trim().length > 0) {
    return `${userName.trim()}의 MyLink`
  }

  return `${displayName}의 MyLink`
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { displayName } = await params
  const normalizedDisplayName = normalizeDisplayName(displayName)
  const profile = await fetchOgPublicProfile(normalizedDisplayName)
  const publicName = profile?.displayName ?? normalizedDisplayName
  const title = getProfileTitle(profile?.userName, publicName)
  const description =
    profile?.bio && profile.bio.trim().length > 0
      ? profile.bio.trim()
      : "프로젝트, 포트폴리오, 채널을 하나의 링크로 공유합니다."
  const pathname = `/${encodeURIComponent(publicName)}`
  const imagePath = `${pathname}/opengraph-image`

  return {
    title,
    description,
    alternates: {
      canonical: pathname,
    },
    openGraph: {
      title,
      description,
      url: pathname,
      siteName: "MyLink",
      locale: "ko_KR",
      type: "website",
      images: [
        {
          url: imagePath,
          width: 1200,
          height: 630,
          alt: `${title} 공개 페이지`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imagePath],
    },
  }
}

export default async function Page({ params }: PageProps) {
  const { displayName } = await params

  return <PublicProfilePage displayName={displayName} />
}
