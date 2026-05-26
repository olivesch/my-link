"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Add01Icon, ArrowUpRight01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { LinkFavicon } from "@/components/link-favicon"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Link } from "@/data/links"
import { db } from "@/lib/firebase/client"

type LinkManagerProps = {
  initialLinks: Link[]
}

const linkFormSchema = z
  .object({
    title: z.string().trim().min(1, "링크 제목을 입력해주세요."),
    url: z.string().trim().min(1, "URL을 입력해주세요."),
  })
  .superRefine(({ url }, context) => {
    if (!url) {
      return
    }

    let parsedUrl: URL

    try {
      parsedUrl = new URL(url)
    } catch {
      context.addIssue({
        code: "custom",
        message: "https://로 시작하는 올바른 URL을 입력해주세요.",
        path: ["url"],
      })
      return
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      context.addIssue({
        code: "custom",
        message: "웹 주소는 http 또는 https 형식만 등록할 수 있습니다.",
        path: ["url"],
      })
    }
  })

type LinkFormValues = z.infer<typeof linkFormSchema>

const anonymousLinksCollection = collection(db, "users", "anonymous", "links")

function getDomain(url: string) {
  return new URL(url).hostname.replace(/^www\./, "")
}

export function LinkManager({ initialLinks }: LinkManagerProps) {
  const [storedLinks, setStoredLinks] = useState<Link[]>([])
  const [isLoadingLinks, setIsLoadingLinks] = useState(true)
  const [listError, setListError] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LinkFormValues>({
    resolver: zodResolver(linkFormSchema),
    defaultValues: {
      title: "",
      url: "",
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  })
  const linkItems = [...initialLinks, ...storedLinks]

  useEffect(() => {
    const storedLinksQuery = query(
      anonymousLinksCollection,
      orderBy("createdAt", "asc")
    )

    return onSnapshot(
      storedLinksQuery,
      (snapshot) => {
        const nextLinks = snapshot.docs.flatMap((document) => {
          const data = document.data()

          if (typeof data.title !== "string" || typeof data.url !== "string") {
            return []
          }

          try {
            new URL(data.url)
          } catch {
            return []
          }

          return [
            {
              id: document.id,
              title: data.title,
              url: data.url,
            },
          ]
        })

        setStoredLinks(nextLinks)
        setListError("")
        setIsLoadingLinks(false)
      },
      () => {
        setListError(
          "저장된 링크를 불러오지 못했습니다. Firestore 권한을 확인해주세요."
        )
        setIsLoadingLinks(false)
      }
    )
  }, [])

  function resetForm() {
    reset()
  }

  function handleOpenChange(open: boolean) {
    setIsOpen(open)

    if (open) {
      clearErrors()
    }

    if (!open) {
      resetForm()
    }
  }

  async function addLink(values: LinkFormValues) {
    const normalizedUrl = new URL(values.url)

    try {
      await addDoc(anonymousLinksCollection, {
        title: values.title,
        url: normalizedUrl.toString(),
        createdAt: serverTimestamp(),
      })
      setIsOpen(false)
      resetForm()
    } catch {
      setError("root", {
        type: "server",
        message: "링크를 저장하지 못했습니다. Firestore 권한을 확인해주세요.",
      })
    }
  }

  return (
    <section aria-labelledby="links-heading" className="min-w-0">
      <div className="mb-7 flex items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="mb-2 text-xs font-semibold text-primary">LINKS</p>
          <h2 id="links-heading" className="text-2xl font-semibold">
            작업과 채널
          </h2>
        </div>
        <span className="text-sm text-muted-foreground">
          {String(linkItems.length).padStart(2, "0")}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger
            id="add-link-dialog-trigger"
            render={
              <Button
                variant="ghost"
                className="group/add h-20 w-full justify-start gap-4 rounded-none bg-primary px-4 text-left text-primary-foreground shadow-sm ring-1 ring-primary transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:bg-primary/85 hover:text-primary-foreground hover:shadow-md sm:px-5"
              />
            }
          >
            <span className="w-7 shrink-0 text-xs text-primary-foreground/75">
              NEW
            </span>
            <span className="flex size-10 shrink-0 items-center justify-center border border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground">
              <HugeiconsIcon icon={Add01Icon} size={20} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-medium text-primary-foreground">
                새 링크 추가
              </span>
              <span className="mt-0.5 block truncate text-sm font-normal text-primary-foreground/75">
                새로운 작업 또는 채널 연결
              </span>
            </span>
            <span className="flex size-9 shrink-0 items-center justify-center border border-primary-foreground/15 bg-primary-foreground/10 text-primary-foreground transition-colors group-hover/add:bg-primary-foreground/20">
              <HugeiconsIcon icon={Add01Icon} size={18} aria-hidden="true" />
            </span>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form
              className="flex flex-col gap-5"
              noValidate
              onSubmit={handleSubmit(addLink)}
            >
              <DialogHeader>
                <DialogTitle>새 링크 추가</DialogTitle>
                <DialogDescription>
                  공개 프로필에 표시할 제목과 URL을 입력하세요. 아이콘은
                  URL에서 자동으로 불러옵니다.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="link-title">버튼 제목</Label>
                  <Input
                    id="link-title"
                    {...register("title")}
                    placeholder="예: 오픈소스 프로젝트"
                    aria-invalid={Boolean(errors.title)}
                    aria-describedby={
                      errors.title ? "link-title-error" : undefined
                    }
                    autoFocus
                  />
                  {errors.title && (
                    <p
                      id="link-title-error"
                      className="text-xs text-destructive"
                      role="alert"
                    >
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="link-url">URL</Label>
                  <Input
                    id="link-url"
                    type="url"
                    {...register("url")}
                    placeholder="https://github.com/dev_kim/project"
                    aria-invalid={Boolean(errors.url)}
                    aria-describedby={errors.url ? "link-url-error" : undefined}
                  />
                  {errors.url && (
                    <p
                      id="link-url-error"
                      className="text-xs text-destructive"
                      role="alert"
                    >
                      {errors.url.message}
                    </p>
                  )}
                </div>

                {errors.root?.message && (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.root.message}
                  </p>
                )}
              </div>

              <DialogFooter>
                <DialogClose
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}
                    />
                  }
                >
                  취소
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  <HugeiconsIcon icon={Add01Icon} data-icon="inline-start" />
                  {isSubmitting ? "저장 중..." : "링크 추가"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {linkItems.map((link, index) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${link.title} 새 탭에서 열기`}
            className="group/link block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Card className="py-0 transition-[background-color,border-color,transform] duration-200 group-hover/link:-translate-y-px group-hover/link:border-primary/25 group-hover/link:bg-accent/45">
              <CardContent className="flex min-h-20 items-center gap-4 px-4 py-3 sm:px-5">
                <span className="w-7 shrink-0 text-xs text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                  <LinkFavicon url={link.url} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-medium">
                    {link.title}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                    {getDomain(link.url)}
                  </span>
                </span>

                <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors group-hover/link:border-border group-hover/link:bg-background group-hover/link:text-foreground">
                  <HugeiconsIcon
                    icon={ArrowUpRight01Icon}
                    size={18}
                    aria-hidden="true"
                  />
                </span>
              </CardContent>
            </Card>
          </a>
        ))}

        {isLoadingLinks && (
          <p className="py-3 text-center text-sm text-muted-foreground">
            저장된 링크를 불러오는 중입니다.
          </p>
        )}

        {listError && (
          <p className="border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {listError}
          </p>
        )}
      </div>

      <p className="mt-7 text-sm text-muted-foreground">
        링크를 선택하면 새 탭에서 콘텐츠를 확인할 수 있습니다.
      </p>
    </section>
  )
}
