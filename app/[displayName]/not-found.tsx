import Link from "next/link"

export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-5 text-foreground">
      <div className="max-w-sm text-center">
        <p className="text-xs font-semibold text-primary">404</p>
        <h1 className="mt-4 text-2xl font-semibold">
          페이지를 찾을 수 없습니다.
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          존재하지 않거나 공개할 수 없는 사용자 페이지입니다.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex h-9 items-center justify-center bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          MyLink 홈으로 이동
        </Link>
      </div>
    </main>
  )
}
