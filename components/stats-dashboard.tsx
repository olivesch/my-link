"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowUpRight01Icon,
  ChartBarLineIcon,
  ChartColumnIcon,
  Link02Icon,
  Loading03Icon,
  MouseLeftClick01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"

import { LinkFavicon } from "@/components/link-favicon"
import { ProfileMenu } from "@/components/profile-menu"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { auth, db } from "@/lib/firebase/client"
import { fetchLinks, getLinksQueryKey } from "@/lib/firebase/links"
import { getPublicPagePath } from "@/lib/public-page"

type StatsProfile = {
  email: string
  userName: string
  displayName: string
  photoURL: string
  bio: string
}

const chartConfig = {
  clickCount: {
    label: "클릭",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig

function formatNumber(value: number) {
  return value.toLocaleString("ko-KR")
}

function truncateTitle(title: string) {
  return title.length > 14 ? `${title.slice(0, 14)}...` : title
}

function getLinkHost(url: string) {
  return new URL(url).hostname.replace(/^www\./, "")
}

function getInitialDisplayName(user: User) {
  return user.email?.split("@")[0] || user.displayName || "creator"
}

function getFallbackProfile(user: User): StatsProfile {
  const displayName = getInitialDisplayName(user)

  return {
    email: user.email ?? "",
    userName: user.displayName?.trim() || displayName,
    displayName,
    photoURL: user.photoURL ?? "",
    bio: "한 줄 소개를 입력해주세요.",
  }
}

async function fetchStatsProfile(user: User) {
  const fallbackProfile = getFallbackProfile(user)
  const profileSnapshot = await getDoc(doc(db, "users", user.uid))
  const profileData = profileSnapshot.data()

  return {
    email:
      typeof profileData?.email === "string"
        ? profileData.email
        : fallbackProfile.email,
    userName:
      typeof profileData?.userName === "string" &&
      profileData.userName.trim().length > 0
        ? profileData.userName
        : fallbackProfile.userName,
    displayName:
      typeof profileData?.displayName === "string" &&
      profileData.displayName.trim().length > 0
        ? profileData.displayName
        : fallbackProfile.displayName,
    photoURL:
      typeof profileData?.photoURL === "string"
        ? profileData.photoURL
        : fallbackProfile.photoURL,
    bio:
      typeof profileData?.bio === "string"
        ? profileData.bio
        : fallbackProfile.bio,
  } satisfies StatsProfile
}

function StatsLoadingScreen() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-5 text-foreground">
      <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <HugeiconsIcon icon={Loading03Icon} className="animate-spin" />
        로그인 상태를 확인하고 있습니다.
      </p>
    </main>
  )
}

export function StatsDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setIsAuthReady(true)

      if (!nextUser) {
        router.replace("/")
      }
    })

    return unsubscribe
  }, [router])

  const linksQueryKey = useMemo(
    () => (user ? getLinksQueryKey(user.uid) : ["links", "stats-disabled"]),
    [user]
  )
  const {
    data: links = [],
    isPending: isLoadingLinks,
    isError: hasLinksError,
  } = useQuery({
    queryKey: linksQueryKey,
    queryFn: () => {
      if (!user) {
        return Promise.resolve([])
      }

      return fetchLinks(user.uid)
    },
    enabled: Boolean(user),
  })
  const { data: profile, isPending: isLoadingProfile } = useQuery({
    queryKey: user
      ? ["stats-profile", user.uid]
      : ["stats-profile", "disabled"],
    queryFn: () => {
      if (!user) {
        throw new Error("로그인이 필요합니다.")
      }

      return fetchStatsProfile(user)
    },
    enabled: Boolean(user),
  })

  const rankedLinks = useMemo(
    () =>
      [...links]
        .map((link) => ({
          ...link,
          shortTitle: truncateTitle(link.title),
        }))
        .sort((a, b) => b.clickCount - a.clickCount),
    [links]
  )
  const totalClickCount = useMemo(
    () => links.reduce((total, link) => total + link.clickCount, 0),
    [links]
  )
  const activeLinkCount = links.length
  const topLink = rankedLinks[0]
  const publicPagePath = profile ? getPublicPagePath(profile.displayName) : "/"

  async function handleSignOut() {
    setIsSigningOut(true)

    try {
      await firebaseSignOut(auth)
      router.replace("/")
    } finally {
      setIsSigningOut(false)
    }
  }

  if (!isAuthReady || !user) {
    return <StatsLoadingScreen />
  }

  const currentUser = user

  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="h-1 bg-primary" />
      <header className="border-b border-border bg-background/95">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-sm font-semibold transition-colors hover:text-primary focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
              M
            </span>
            <span>MyLink</span>
          </Link>

          {isLoadingProfile || !profile ? (
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <HugeiconsIcon icon={Loading03Icon} className="animate-spin" />
              계정 확인 중
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href={publicPagePath}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                내 페이지로 바로가기
                <HugeiconsIcon
                  icon={ArrowUpRight01Icon}
                  size={14}
                  aria-hidden="true"
                />
              </Link>
              <ProfileMenu
                userId={currentUser.uid}
                profile={profile}
                isSigningOut={isSigningOut}
                onSignOut={handleSignOut}
              />
            </div>
          )}
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="flex flex-col gap-6 border-b border-border pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-primary">
              STATS
            </p>
            <h1 className="mt-3 text-3xl leading-tight font-semibold sm:text-5xl">
              링크 클릭 흐름을 한눈에 확인하세요.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              방문자가 어떤 링크에 반응하는지 확인하고, 개발자 프로필에서 강조할
              채널의 우선순위를 정리할 수 있습니다.
            </p>
          </div>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            링크 관리로 이동
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Card className="border-primary/20 bg-primary/5 py-0">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-muted-foreground">
                  총 클릭 수
                </p>
                <HugeiconsIcon
                  icon={MouseLeftClick01Icon}
                  size={18}
                  className="text-primary"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-4 font-mono text-4xl font-semibold tracking-normal tabular-nums sm:text-5xl">
                {isLoadingLinks ? "-" : formatNumber(totalClickCount)}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                모든 링크 클릭을 합산한 값입니다.
              </p>
            </CardContent>
          </Card>

          <Card className="py-0">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-muted-foreground">
                  상위 링크
                </p>
                <HugeiconsIcon
                  icon={ChartBarLineIcon}
                  size={18}
                  className="text-primary"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-4 truncate text-2xl leading-tight font-semibold sm:text-3xl">
                {isLoadingLinks ? "-" : (topLink?.title ?? "-")}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                {topLink
                  ? `${formatNumber(topLink.clickCount)}회 클릭된 링크입니다.`
                  : "아직 클릭 데이터가 없습니다."}
              </p>
            </CardContent>
          </Card>

          <Card className="py-0">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-muted-foreground">
                  활성 링크 수
                </p>
                <HugeiconsIcon
                  icon={Link02Icon}
                  size={18}
                  className="text-primary"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-4 font-mono text-4xl font-semibold tracking-normal tabular-nums">
                {isLoadingLinks ? "-" : formatNumber(activeLinkCount)}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                현재 공개 페이지에 표시되는 링크 수입니다.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Card className="py-0">
            <CardHeader className="border-b border-border py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>링크별 클릭 수</CardTitle>
                  <CardDescription>
                    많이 클릭된 링크부터 순서대로 표시합니다.
                  </CardDescription>
                </div>
                <span className="inline-flex items-center gap-1.5 border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary">
                  <HugeiconsIcon
                    icon={ChartColumnIcon}
                    size={14}
                    aria-hidden="true"
                  />
                  Chart
                </span>
              </div>
            </CardHeader>
            <CardContent className="py-5">
              {isLoadingLinks ? (
                <div className="flex min-h-72 items-center justify-center gap-2 text-sm text-muted-foreground">
                  <HugeiconsIcon
                    icon={Loading03Icon}
                    className="animate-spin"
                  />
                  차트를 불러오는 중
                </div>
              ) : hasLinksError ? (
                <div className="flex min-h-72 items-center justify-center border border-destructive/30 bg-destructive/10 px-4 text-sm text-destructive">
                  링크 통계를 불러오지 못했습니다. Firestore 권한을
                  확인해주세요.
                </div>
              ) : rankedLinks.length === 0 ? (
                <div className="flex min-h-72 items-center justify-center border border-dashed border-border px-4 text-center text-sm text-muted-foreground">
                  아직 등록된 링크가 없습니다. 링크를 추가하면 통계가 이곳에
                  표시됩니다.
                </div>
              ) : (
                <ChartContainer
                  config={chartConfig}
                  className="min-h-72 w-full"
                  initialDimension={{ width: 880, height: 280 }}
                >
                  <BarChart
                    data={rankedLinks}
                    margin={{ top: 24, right: 16, bottom: 0, left: 0 }}
                    accessibilityLayer
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="shortTitle"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                    />
                    <YAxis
                      type="number"
                      dataKey="clickCount"
                      hide
                      allowDecimals={false}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          hideLabel
                          formatter={(value, _name, item) => (
                            <div className="flex min-w-44 items-center justify-between gap-3">
                              <span className="truncate text-muted-foreground">
                                {item.payload.title}
                              </span>
                              <span className="font-mono font-medium text-foreground tabular-nums">
                                {Number(value).toLocaleString("ko-KR")}
                              </span>
                            </div>
                          )}
                        />
                      }
                    />
                    <Bar
                      dataKey="clickCount"
                      barSize={14}
                      fill="var(--color-clickCount)"
                      radius={0}
                    >
                      <LabelList
                        dataKey="clickCount"
                        position="top"
                        offset={8}
                        className="fill-foreground font-mono text-xs tabular-nums"
                        formatter={(value) =>
                          typeof value === "number"
                            ? value.toLocaleString("ko-KR")
                            : String(value ?? "")
                        }
                      />
                    </Bar>
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card className="mt-4 py-0">
            <CardHeader className="border-b border-border py-4">
              <CardTitle>클릭 순위</CardTitle>
              <CardDescription>
                클릭 수 기준으로 정렬된 링크 목록입니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingLinks ? (
                <div className="flex min-h-24 items-center justify-center gap-2 text-sm text-muted-foreground">
                  <HugeiconsIcon
                    icon={Loading03Icon}
                    className="animate-spin"
                  />
                  순위를 불러오는 중
                </div>
              ) : hasLinksError ? (
                <p className="border border-destructive/30 bg-destructive/10 px-4 py-4 text-sm text-destructive">
                  링크 순위를 불러오지 못했습니다.
                </p>
              ) : rankedLinks.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  아직 순위에 표시할 링크가 없습니다.
                </p>
              ) : (
                <ol className="divide-y divide-border">
                  {rankedLinks.map((link, index) => (
                    <li
                      key={link.id}
                      className="grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[2.5rem_1.75rem_minmax(0,1fr)_auto]"
                    >
                      <span
                        className={
                          index === 0
                            ? "flex size-8 items-center justify-center bg-primary font-mono text-xs font-semibold text-primary-foreground tabular-nums"
                            : "flex size-8 items-center justify-center bg-muted font-mono text-xs font-medium text-muted-foreground tabular-nums"
                        }
                      >
                        {index + 1}
                      </span>
                      <span className="hidden sm:flex sm:justify-center">
                        <LinkFavicon url={link.url} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {link.title}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {getLinkHost(link.url)}
                        </p>
                      </div>
                      <span className="font-mono text-sm font-semibold tabular-nums">
                        {formatNumber(link.clickCount)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
