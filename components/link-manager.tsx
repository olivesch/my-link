"use client"

import { useCallback, useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Add01Icon, Loading03Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore"
import { useForm } from "react-hook-form"

import { EditableLinkCard } from "@/components/editable-link-card"
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
import { linkFormSchema, type LinkFormValues } from "@/lib/validations/link"

const anonymousLinksCollection = collection(db, "users", "anonymous", "links")
const storedLinksQuery = query(
  anonymousLinksCollection,
  orderBy("createdAt", "desc")
)
const linksLoadError =
  "저장된 링크를 불러오지 못했습니다. Firestore 권한을 확인해주세요."

function getLinkFromDocument(
  document: QueryDocumentSnapshot<DocumentData>
): Link | null {
  const data = document.data()

  if (typeof data.title !== "string" || typeof data.url !== "string") {
    return null
  }

  try {
    new URL(data.url)
  } catch {
    return null
  }

  return {
    id: document.id,
    title: data.title,
    url: data.url,
  }
}

function getLinksFromDocuments(
  documents: QueryDocumentSnapshot<DocumentData>[]
) {
  return documents.flatMap((document) => {
    const link = getLinkFromDocument(document)

    return link ? [link] : []
  })
}

async function fetchStoredLinks() {
  const snapshot = await getDocs(storedLinksQuery)

  return getLinksFromDocuments(snapshot.docs)
}

export function LinkManager() {
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
  const linkItems = storedLinks

  const refreshLinkList = useCallback(async () => {
    try {
      const nextLinks = await fetchStoredLinks()
      setStoredLinks(nextLinks)
      setListError("")
    } catch {
      setListError(linksLoadError)
    }
  }, [])

  useEffect(() => {
    let hasReceivedInitialLinks = false

    return onSnapshot(
      storedLinksQuery,
      (snapshot) => {
        if (!hasReceivedInitialLinks) {
          setStoredLinks(getLinksFromDocuments(snapshot.docs))
          setListError("")
          setIsLoadingLinks(false)
          hasReceivedInitialLinks = true
          return
        }

        const addedLinkIds = new Set(
          snapshot
            .docChanges()
            .filter((change) => change.type === "added")
            .map((change) => change.doc.id)
        )

        if (addedLinkIds.size === 0) {
          return
        }

        const addedLinks = getLinksFromDocuments(snapshot.docs).filter((link) =>
          addedLinkIds.has(link.id)
        )

        setStoredLinks((currentLinks) => [
          ...addedLinks,
          ...currentLinks.filter((link) => !addedLinkIds.has(link.id)),
        ])
        setListError("")
      },
      () => {
        setListError(linksLoadError)
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

    setIsOpen(false)

    try {
      await addDoc(anonymousLinksCollection, {
        title: values.title,
        url: normalizedUrl.toString(),
        createdAt: serverTimestamp(),
      })
      resetForm()
    } catch {
      await refreshLinkList()
      setIsOpen(true)
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
                disabled={isSubmitting}
                className="h-14 w-full justify-center gap-3 rounded-none bg-primary px-4 text-primary-foreground shadow-sm ring-1 ring-primary transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:bg-primary/85 hover:text-primary-foreground hover:shadow-md"
              />
            }
          >
            <HugeiconsIcon
              icon={isSubmitting ? Loading03Icon : Add01Icon}
              className={isSubmitting ? "animate-spin" : undefined}
              size={18}
              aria-hidden="true"
            />
            <span
              className="text-base font-medium text-primary-foreground"
              role={isSubmitting ? "status" : undefined}
            >
              {isSubmitting ? "추가 중..." : "새로운 링크 추가하기"}
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
                  링크 추가
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {linkItems.map((link, index) => (
          <EditableLinkCard
            key={link.id}
            index={index}
            link={link}
            onRefresh={refreshLinkList}
          />
        ))}

        {isLoadingLinks && (
          <Card className="py-0 bg-card/60">
            <CardContent className="flex min-h-20 items-center justify-center gap-2 text-sm text-muted-foreground">
              <HugeiconsIcon
                icon={Loading03Icon}
                className="animate-spin"
                size={18}
                aria-hidden="true"
              />
              저장된 링크를 불러오는 중입니다.
            </CardContent>
          </Card>
        )}

        {!isLoadingLinks && !listError && linkItems.length === 0 && (
          <p className="border border-dashed border-border px-4 py-7 text-center text-sm text-muted-foreground">
            저장된 링크가 없습니다. 첫 링크를 추가해보세요.
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
