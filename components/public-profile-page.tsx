"use client"

import Image from "next/image"
import NextLink from "next/link"
import { notFound } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ArrowUpRight01Icon, Loading03Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { LinkFavicon } from "@/components/link-favicon"
import { fetchLinks, getLinksQueryKey } from "@/lib/firebase/links"
import {
  fetchPublicProfile,
  getPublicProfileQueryKey,
  type PublicProfile,
} from "@/lib/firebase/profiles"

function getInitials(userName: string) {
  return userName.slice(0, 2).toUpperCase()
}

function ProfileAvatar({ profile }: { profile: PublicProfile }) {
  return (
    <div className="relative flex size-24 items-center justify-center overflow-hidden rounded-full border border-primary/20 bg-primary/10 text-2xl font-semibold text-primary">
      {profile.photoURL ? (
        <Image
          src={profile.photoURL}
          alt={`${profile.userName} 프로필 사진`}
          fill
          sizes="96px"
          className="object-cover"
        />
      ) : (
        getInitials(profile.userName)
      )}
    </div>
  )
}

function LinkList({ userId }: { userId: string }) {
  const {
    data: links = [],
    isPending,
    isError,
  } = useQuery({
    queryKey: getLinksQueryKey(userId),
    queryFn: () => fetchLinks(userId),
  })

  if (isPending) {
    return (
      <p className="flex h-16 items-center justify-center gap-2 border border-border bg-card text-sm text-muted-foreground">
        <HugeiconsIcon icon={Loading03Icon} className="animate-spin" />
        링크 불러오는 중
      </p>
    )
  }

  if (isError) {
    return (
      <p className="border border-destructive/30 bg-destructive/10 px-4 py-4 text-center text-sm text-destructive">
        링크를 불러오지 못했습니다.
      </p>
    )
  }

  if (links.length === 0) {
    return (
      <p className="border border-border bg-card px-4 py-5 text-center text-sm text-muted-foreground">
        아직 등록된 링크가 없습니다.
      </p>
    )
  }

  return links.map((link) => (
    <a
      key={link.id}
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex min-h-16 items-center gap-3 border border-border bg-card px-4 transition-colors hover:border-primary/35 hover:bg-primary/5 focus-visible:border-primary/40 focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:outline-none"
    >
      <LinkFavicon url={link.url} />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {link.title}
      </span>
      <HugeiconsIcon
        icon={ArrowUpRight01Icon}
        size={17}
        className="text-muted-foreground transition-colors group-hover:text-primary"
        aria-hidden="true"
      />
    </a>
  ))
}

export function PublicProfilePage({ displayName }: { displayName: string }) {
  const {
    data: profile,
    isPending,
    isError,
  } = useQuery({
    queryKey: getPublicProfileQueryKey(displayName),
    queryFn: () => fetchPublicProfile(displayName),
  })

  if (isPending) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background">
        <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <HugeiconsIcon icon={Loading03Icon} className="animate-spin" />
          페이지 불러오는 중
        </p>
      </main>
    )
  }

  if (isError) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background px-5 text-foreground">
        <div className="max-w-sm border border-destructive/30 bg-destructive/10 p-5 text-center">
          <p className="text-sm text-destructive">
            페이지를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
          </p>
        </div>
      </main>
    )
  }

  if (!profile) {
    notFound()
  }

  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="h-1 bg-primary" />
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between px-5 py-4 sm:px-0">
          <NextLink
            href="/"
            className="flex items-center gap-2.5 text-sm font-semibold"
          >
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
              M
            </span>
            MyLink
          </NextLink>
          <span className="text-xs text-muted-foreground">
            /{profile.displayName}
          </span>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-lg flex-col items-center px-5 pt-11 pb-12 sm:px-0 sm:pt-14">
        <ProfileAvatar profile={profile} />
        <h1 className="mt-5 text-2xl font-semibold">{profile.userName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          @{profile.displayName}
        </p>
        {profile.bio && (
          <p className="mt-4 max-w-sm text-center text-sm leading-7 text-muted-foreground">
            {profile.bio}
          </p>
        )}

        <div className="mt-9 flex w-full flex-col gap-3">
          <LinkList userId={profile.uid} />
        </div>
      </section>
    </main>
  )
}
