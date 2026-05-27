"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowDown01Icon,
  ArrowUpRight01Icon,
  CopyLinkIcon,
  EyeIcon,
  Loading03Icon,
  Logout01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { toast } from "sonner"

import { LinkFavicon } from "@/components/link-favicon"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu"
import { fetchLinks, getLinksQueryKey } from "@/lib/firebase/links"
import { getPublicPagePath } from "@/lib/public-page"

type ProfileMenuProfile = {
  email: string
  userName: string
  displayName: string
  photoURL: string
  bio: string
}

type ProfileMenuProps = {
  userId: string
  profile: ProfileMenuProfile
  isSigningOut: boolean
  onSignOut: () => Promise<void>
}

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase()
}

function ProfileAvatar({
  profile,
  className,
}: {
  profile: ProfileMenuProfile
  className?: string
}) {
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 font-semibold text-primary ${className ?? ""}`}
    >
      {profile.photoURL ? (
        <Image
          src={profile.photoURL}
          alt=""
          fill
          sizes="64px"
          className="object-cover"
        />
      ) : (
        getInitials(profile.userName)
      )}
    </span>
  )
}

function PublicPagePreview({
  open,
  onOpenChange,
  userId,
  profile,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  profile: ProfileMenuProfile
}) {
  const {
    data: links = [],
    isPending: isLoading,
    isError: hasLoadError,
  } = useQuery({
    queryKey: getLinksQueryKey(userId),
    queryFn: () => fetchLinks(userId),
    enabled: open,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto p-0 sm:max-w-md">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle>내 페이지 미리보기</DialogTitle>
          <DialogDescription>
            방문자에게 표시될 프로필과 링크입니다.
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 pt-4 pb-6">
          <div className="flex flex-col items-center text-center">
            <ProfileAvatar profile={profile} className="size-16 text-lg" />
            <h2 className="mt-4 text-xl font-semibold">{profile.userName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              @{profile.displayName}
            </p>
            <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">
              {profile.bio}
            </p>
          </div>

          <div className="mt-7 flex flex-col gap-2">
            {isLoading ? (
              <p className="inline-flex h-14 items-center justify-center gap-2 border border-border text-sm text-muted-foreground">
                <HugeiconsIcon icon={Loading03Icon} className="animate-spin" />
                링크 불러오는 중
              </p>
            ) : hasLoadError ? (
              <p className="border border-destructive/30 bg-destructive/10 px-3 py-3 text-sm text-destructive">
                페이지 링크를 불러오지 못했습니다.
              </p>
            ) : links.length === 0 ? (
              <p className="border border-border px-3 py-4 text-center text-sm text-muted-foreground">
                아직 등록된 링크가 없습니다.
              </p>
            ) : (
              links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-14 items-center gap-3 border border-border bg-card px-4 transition-colors hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <LinkFavicon url={link.url} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {link.title}
                  </span>
                </a>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ProfileMenu({
  userId,
  profile,
  isSigningOut,
  onSignOut,
}: ProfileMenuProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const publicPagePath = getPublicPagePath(profile.displayName)

  async function copyPageLink() {
    try {
      await navigator.clipboard.writeText(
        new URL(publicPagePath, window.location.origin).toString()
      )
      toast.success("내 페이지 링크를 복사했습니다.")
    } catch {
      toast.error("링크를 복사하지 못했습니다.")
    }
  }

  return (
    <>
      <Menu>
        <MenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              className="h-11 gap-2 px-2 hover:bg-muted"
              aria-label="프로필 메뉴 열기"
            />
          }
        >
          <ProfileAvatar profile={profile} className="size-8 text-xs" />
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            size={14}
            className="text-muted-foreground"
          />
        </MenuTrigger>

        <MenuContent className="w-72">
          <div className="flex items-center gap-3 px-3 py-3">
            <ProfileAvatar profile={profile} className="size-10 text-xs" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{profile.userName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {profile.email}
              </p>
            </div>
          </div>

          <MenuSeparator />
          <MenuItem render={<Link href={publicPagePath} />}>
            <HugeiconsIcon icon={ArrowUpRight01Icon} />내 페이지로 이동
          </MenuItem>
          <MenuItem onClick={() => setIsPreviewOpen(true)}>
            <HugeiconsIcon icon={EyeIcon} />내 페이지 미리보기
          </MenuItem>
          <MenuItem onClick={() => void copyPageLink()}>
            <HugeiconsIcon icon={CopyLinkIcon} />내 페이지 링크 복사
          </MenuItem>
          <MenuSeparator />
          <MenuItem disabled={isSigningOut} onClick={() => void onSignOut()}>
            <HugeiconsIcon
              icon={isSigningOut ? Loading03Icon : Logout01Icon}
              className={isSigningOut ? "animate-spin" : undefined}
            />
            로그아웃
          </MenuItem>
        </MenuContent>
      </Menu>

      <PublicPagePreview
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        userId={userId}
        profile={profile}
      />
    </>
  )
}
