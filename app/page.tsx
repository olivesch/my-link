import { LinkManager } from "@/components/link-manager"
import { links } from "@/data/links"

const profile = {
  displayName: "dev_kim",
  role: "Frontend Developer",
  bio: "제품 경험과 콘텐츠를 연결하는 인터페이스를 설계하고 만듭니다.",
  initials: "DK",
}

export default function Page() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="h-1 bg-primary" />

      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
              M
            </span>
            <span className="text-sm font-semibold">MyLink</span>
          </div>
          <span className="truncate text-xs text-muted-foreground sm:text-sm">
            mylink.com/@{profile.displayName}
          </span>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-5xl gap-10 px-5 py-9 sm:px-8 sm:py-12 lg:grid-cols-[17.5rem_minmax(0,1fr)] lg:gap-16 lg:py-14">
        <aside className="flex flex-col lg:sticky lg:top-10 lg:self-start">
          <div className="flex items-start gap-5 lg:flex-col lg:gap-6">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-xl font-semibold text-primary sm:size-24 sm:text-2xl">
              {profile.initials}
            </div>

            <div className="min-w-0 pt-1 lg:pt-0">
              <p className="mb-2 inline-flex rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {profile.role}
              </p>
              <h1 className="truncate text-3xl font-semibold sm:text-4xl">
                {profile.displayName}
              </h1>
            </div>
          </div>

          <p className="mt-6 max-w-sm text-sm leading-7 text-muted-foreground">
            {profile.bio}
          </p>

          <div className="mt-7 flex flex-wrap gap-2">
            {["GitHub", "Blog", "Projects"].map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </aside>

        <LinkManager initialLinks={links} />
      </div>
    </main>
  )
}
