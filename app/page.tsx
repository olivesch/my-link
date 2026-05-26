import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Card, CardContent } from "@/components/ui/card"
import { links } from "@/data/links"

export default function Page() {
  return (
    <main className="flex min-h-svh justify-center bg-muted/30 px-4 py-14 sm:py-20">
      <section className="flex w-full max-w-md flex-col items-center">
        <header className="mb-9 flex flex-col items-center text-center">
          <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-primary text-3xl font-semibold text-primary-foreground">
            M
          </div>
          <h1 className="text-2xl font-semibold tracking-normal">마이링크</h1>
          <p className="mt-2 text-sm text-muted-foreground">@mylink</p>
        </header>

        <div className="flex w-full flex-col gap-3">
          {links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${link.title} 새 탭에서 열기`}
              className="block focus-visible:outline-none focus-visible:[&_[data-slot=card]]:ring-2 focus-visible:[&_[data-slot=card]]:ring-ring"
            >
              <Card className="transition-colors hover:bg-accent">
                <CardContent className="flex min-h-14 items-center justify-between gap-4">
                  <span className="text-base font-medium">{link.title}</span>
                  <HugeiconsIcon
                    icon={ArrowUpRight01Icon}
                    className="shrink-0 text-muted-foreground"
                    size={18}
                    aria-hidden="true"
                  />
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </section>
    </main>
  )
}
