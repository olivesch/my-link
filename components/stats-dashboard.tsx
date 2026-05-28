"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowLeft01Icon,
  BarChartHorizontalIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"

import { Button, buttonVariants } from "@/components/ui/button"
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
import { auth } from "@/lib/firebase/client"
import { fetchLinks, getLinksQueryKey } from "@/lib/firebase/links"

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
  return title.length > 12 ? `${title.slice(0, 12)}...` : title
}

export function StatsDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isAuthReady, setIsAuthReady] = useState(false)

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
    queryFn: () => fetchLinks(user?.uid ?? ""),
    enabled: Boolean(user),
  })

  const totalClickCount = links.reduce(
    (total, link) => total + link.clickCount,
    0
  )
  const chartData = links
    .map((link) => ({
      id: link.id,
      title: link.title,
      shortTitle: truncateTitle(link.title),
      clickCount: link.clickCount,
    }))
    .sort((a, b) => b.clickCount - a.clickCount)

  if (!isAuthReady || (isAuthReady && !user)) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background px-5 text-foreground">
        <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <HugeiconsIcon icon={Loading03Icon} className="animate-spin" />
          로그인 상태를 확인하고 있습니다.
        </p>
      </main>
    )
  }

  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="h-1 bg-primary" />
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
              M
            </span>
            <span className="text-sm font-semibold">MyLink 통계</span>
          </div>
          <Link
            href="/"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={14}
              aria-hidden="true"
            />
            대시보드
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-7">
          <p className="text-xs font-semibold text-primary">STATS</p>
          <h1 className="mt-3 text-3xl font-semibold">클릭 통계</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
            내 링크들이 얼마나 눌렸는지 확인합니다. 공개 페이지에는 조회수를
            보여주지 않고, 이 화면에서만 합산과 링크별 분포를 확인합니다.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <Card className="py-0">
            <CardHeader className="border-b border-border py-4">
              <CardTitle>총 클릭 수</CardTitle>
              <CardDescription>모든 링크 클릭 합산</CardDescription>
            </CardHeader>
            <CardContent className="py-6">
              {isLoadingLinks ? (
                <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <HugeiconsIcon
                    icon={Loading03Icon}
                    className="animate-spin"
                  />
                  불러오는 중
                </p>
              ) : hasLinksError ? (
                <p className="text-sm text-destructive">
                  클릭 수를 불러오지 못했습니다.
                </p>
              ) : (
                <div>
                  <p className="font-mono text-5xl font-semibold tracking-normal tabular-nums">
                    {formatNumber(totalClickCount)}
                  </p>
                  <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <HugeiconsIcon
                      icon={BarChartHorizontalIcon}
                      size={16}
                      aria-hidden="true"
                    />
                    {formatNumber(links.length)}개 링크 기준
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="py-0">
            <CardHeader className="border-b border-border py-4">
              <CardTitle>링크별 클릭 수</CardTitle>
              <CardDescription>클릭 수가 높은 링크부터 표시</CardDescription>
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
              ) : chartData.length === 0 ? (
                <div className="flex min-h-72 items-center justify-center border border-dashed border-border px-4 text-center text-sm text-muted-foreground">
                  아직 등록된 링크가 없습니다.
                </div>
              ) : (
                <ChartContainer
                  config={chartConfig}
                  className="min-h-72 w-full"
                  initialDimension={{ width: 640, height: 288 }}
                >
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 8, right: 28, bottom: 8, left: 8 }}
                    accessibilityLayer
                  >
                    <CartesianGrid horizontal={false} />
                    <XAxis
                      type="number"
                      dataKey="clickCount"
                      hide
                      allowDecimals={false}
                    />
                    <YAxis
                      dataKey="shortTitle"
                      type="category"
                      tickLine={false}
                      axisLine={false}
                      width={92}
                      tickMargin={8}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          hideLabel
                          formatter={(value, _name, item) => (
                            <div className="flex min-w-36 items-center justify-between gap-3">
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
                      fill="var(--color-clickCount)"
                      radius={4}
                    >
                      <LabelList
                        dataKey="clickCount"
                        position="right"
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
        </div>

        <Button render={<Link href="/" />} variant="ghost" className="mt-6">
          <HugeiconsIcon icon={ArrowLeft01Icon} data-icon="inline-start" />
          링크 관리로 돌아가기
        </Button>
      </section>
    </main>
  )
}
