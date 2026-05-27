"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowUpRight01Icon,
  Cancel01Icon,
  Delete02Icon,
  FloppyDiskIcon,
  Loading03Icon,
  PencilEdit01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore"
import { useForm } from "react-hook-form"

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
import { linkFormSchema, type LinkFormValues } from "@/lib/validations/link"

type EditableLinkCardProps = {
  index: number
  link: Link
  userId: string
  onRefresh: () => Promise<void>
}

function getDomain(url: string) {
  return new URL(url).hostname.replace(/^www\./, "")
}

function formatUpdatedAt(updatedAt: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(updatedAt)
}

function getLinkReference(userId: string, linkId: string) {
  return doc(db, "users", userId, "links", linkId)
}

export function EditableLinkCard({
  index,
  link,
  userId,
  onRefresh,
}: EditableLinkCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LinkFormValues>({
    resolver: zodResolver(linkFormSchema),
    defaultValues: {
      title: link.title,
      url: link.url,
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  })

  useEffect(() => {
    if (!isEditing) {
      reset({
        title: link.title,
        url: link.url,
      })
    }
  }, [isEditing, link.title, link.url, reset])

  function cancelEdit() {
    reset({
      title: link.title,
      url: link.url,
    })
    setIsEditing(false)
  }

  async function updateLink(values: LinkFormValues) {
    try {
      await updateDoc(getLinkReference(userId, link.id), {
        title: values.title,
        url: new URL(values.url).toString(),
        updatedAt: serverTimestamp(),
      })
      await onRefresh()
      setIsEditing(false)
    } catch {
      setError("root", {
        type: "server",
        message: "링크를 수정하지 못했습니다. 잠시 후 다시 시도해주세요.",
      })
    }
  }

  function handleDeleteOpenChange(open: boolean) {
    if (!isDeleting) {
      setIsDeleteOpen(open)
      setDeleteError("")
    }
  }

  async function deleteLink() {
    setIsDeleting(true)
    setDeleteError("")

    try {
      await deleteDoc(getLinkReference(userId, link.id))
      await onRefresh()
      setIsDeleteOpen(false)
    } catch {
      setDeleteError("링크를 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.")
    } finally {
      setIsDeleting(false)
    }
  }

  if (isEditing) {
    return (
      <Card className="py-0 ring-primary/35">
        <CardContent className="px-4 py-4 sm:px-5">
          <form
            className="flex items-start gap-3"
            noValidate
            onSubmit={handleSubmit(updateLink)}
          >
            <span className="mt-2.5 w-7 shrink-0 text-xs text-muted-foreground">
              {String(index + 1).padStart(2, "0")}
            </span>

            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-col gap-1.5">
                <Label className="sr-only" htmlFor={`edit-title-${link.id}`}>
                  버튼 제목
                </Label>
                <Input
                  id={`edit-title-${link.id}`}
                  {...register("title")}
                  aria-invalid={Boolean(errors.title)}
                  aria-describedby={
                    errors.title ? `edit-title-error-${link.id}` : undefined
                  }
                  autoFocus
                />
                {errors.title && (
                  <p
                    id={`edit-title-error-${link.id}`}
                    className="text-xs text-destructive"
                    role="alert"
                  >
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="sr-only" htmlFor={`edit-url-${link.id}`}>
                  URL
                </Label>
                <Input
                  id={`edit-url-${link.id}`}
                  type="url"
                  {...register("url")}
                  aria-invalid={Boolean(errors.url)}
                  aria-describedby={
                    errors.url ? `edit-url-error-${link.id}` : undefined
                  }
                />
                {errors.url && (
                  <p
                    id={`edit-url-error-${link.id}`}
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

            <div className="flex shrink-0 gap-1">
              <Button
                type="submit"
                size="icon-sm"
                disabled={isSubmitting}
                title="수정 저장"
                aria-label={`${link.title} 수정 저장`}
              >
                <HugeiconsIcon
                  icon={isSubmitting ? Loading03Icon : FloppyDiskIcon}
                  className={isSubmitting ? "animate-spin" : undefined}
                />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={isSubmitting}
                title="수정 취소"
                aria-label={`${link.title} 수정 취소`}
                onClick={cancelEdit}
              >
                <HugeiconsIcon icon={Cancel01Icon} />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="py-0 transition-[background-color,border-color] duration-200 hover:bg-accent/45">
      <CardContent className="flex min-h-20 items-center gap-3 px-4 py-3 sm:px-5">
        <span className="w-7 shrink-0 text-xs text-muted-foreground">
          {String(index + 1).padStart(2, "0")}
        </span>

        <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-background">
          <LinkFavicon url={link.url} />
        </span>

        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${link.title} 새 탭에서 열기`}
          className="min-w-0 flex-1 rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <span className="block truncate text-base font-medium">
            {link.title}
          </span>
          <span className="mt-0.5 block truncate text-sm text-muted-foreground">
            {getDomain(link.url)}
          </span>
          {link.updatedAt && (
            <time
              className="mt-1 block truncate text-xs text-muted-foreground"
              dateTime={link.updatedAt.toISOString()}
            >
              수정됨 {formatUpdatedAt(link.updatedAt)}
            </time>
          )}
        </a>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="수정"
            aria-label={`${link.title} 수정`}
            onClick={() => setIsEditing(true)}
          >
            <HugeiconsIcon icon={PencilEdit01Icon} />
          </Button>

          <Dialog open={isDeleteOpen} onOpenChange={handleDeleteOpenChange}>
            <DialogTrigger
              id={`delete-link-trigger-${link.id}`}
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  title="삭제"
                  aria-label={`${link.title} 삭제`}
                />
              }
            >
              <HugeiconsIcon icon={Delete02Icon} />
            </DialogTrigger>
            <DialogContent
              className="sm:max-w-sm"
              showCloseButton={!isDeleting}
            >
              <DialogHeader>
                <DialogTitle>정말 삭제하시겠습니까?</DialogTitle>
                <DialogDescription>
                  <span className="mt-2 block border border-border bg-muted/30 px-3 py-2 text-sm font-medium text-foreground">
                    {link.title}
                  </span>
                </DialogDescription>
              </DialogHeader>
              <p className="text-sm text-destructive" role="alert">
                이 작업은 되돌릴 수 없습니다
              </p>
              {deleteError && (
                <p className="text-xs text-destructive" role="alert">
                  {deleteError}
                </p>
              )}
              <DialogFooter>
                <DialogClose
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isDeleting}
                    />
                  }
                >
                  취소
                </DialogClose>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isDeleting}
                  aria-label={isDeleting ? "삭제 중" : undefined}
                  className="min-w-20"
                  onClick={deleteLink}
                >
                  {isDeleting ? (
                    <HugeiconsIcon
                      icon={Loading03Icon}
                      className="animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    "삭제하기"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            title="새 탭에서 열기"
            aria-label={`${link.title} 새 탭에서 열기`}
            className="flex size-7 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} />
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
