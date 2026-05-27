"use client"

import { useCallback, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { Add01Icon, Loading03Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
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
import { db } from "@/lib/firebase/client"
import { fetchLinks, getLinksQueryKey } from "@/lib/firebase/links"
import { linkFormSchema, type LinkFormValues } from "@/lib/validations/link"

const linksLoadError =
  "저장된 링크를 불러오지 못했습니다. Firestore 권한을 확인해주세요."

type LinkManagerProps = {
  userId: string
}

export function LinkManager({ userId }: LinkManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
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
  const linksCollection = useMemo(
    () => collection(db, "users", userId, "links"),
    [userId]
  )
  const linksQueryKey = useMemo(() => getLinksQueryKey(userId), [userId])
  const {
    data: linkItems = [],
    isPending: isLoadingLinks,
    isError: hasListError,
  } = useQuery({
    queryKey: linksQueryKey,
    queryFn: () => fetchLinks(userId),
  })

  const refreshLinkList = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: linksQueryKey })
  }, [linksQueryKey, queryClient])

  const addLinkMutation = useMutation({
    mutationFn: async (values: LinkFormValues) => {
      const normalizedUrl = new URL(values.url)

      await addDoc(linksCollection, {
        title: values.title,
        url: normalizedUrl.toString(),
        createdAt: serverTimestamp(),
      })
    },
    onSuccess: refreshLinkList,
  })

  function resetForm() {
    reset()
  }

  function handleOpenChange(open: boolean) {
    if (isSubmitting && !open) {
      return
    }

    setIsOpen(open)

    if (open) {
      clearErrors()
    }

    if (!open) {
      resetForm()
    }
  }

  async function addLink(values: LinkFormValues) {
    try {
      await addLinkMutation.mutateAsync(values)
      resetForm()
      setIsOpen(false)
    } catch {
      setError("root", {
        type: "server",
        message: "링크를 저장하지 못했습니다. Firestore 권한을 확인해주세요.",
      })
    }
  }

  return (
    <section aria-label="링크 목록" className="min-w-0">
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
            <HugeiconsIcon icon={Add01Icon} size={18} aria-hidden="true" />
            <span className="text-base font-medium text-primary-foreground">
              새로운 링크 추가하기
            </span>
          </DialogTrigger>
          <DialogContent
            className="sm:max-w-md"
            showCloseButton={!isSubmitting}
          >
            <form
              className="flex flex-col gap-5"
              noValidate
              onSubmit={handleSubmit(addLink)}
            >
              <DialogHeader>
                <DialogTitle>새 링크 추가</DialogTitle>
                <DialogDescription>
                  공개 프로필에 표시할 제목과 URL을 입력하세요. 아이콘은 URL에서
                  자동으로 불러옵니다.
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
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  aria-label={isSubmitting ? "링크 추가 중" : undefined}
                  className="min-w-24"
                >
                  {isSubmitting ? (
                    <HugeiconsIcon
                      icon={Loading03Icon}
                      className="animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <>
                      <HugeiconsIcon
                        icon={Add01Icon}
                        data-icon="inline-start"
                      />
                      링크 추가
                    </>
                  )}
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
            userId={userId}
            onRefresh={refreshLinkList}
          />
        ))}

        {isLoadingLinks && (
          <Card className="bg-card/60 py-0">
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

        {!isLoadingLinks && !hasListError && linkItems.length === 0 && (
          <p className="border border-dashed border-border px-4 py-7 text-center text-sm text-muted-foreground">
            저장된 링크가 없습니다. 첫 링크를 추가해보세요.
          </p>
        )}

        {hasListError && (
          <p className="border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {linksLoadError}
          </p>
        )}
      </div>

      <p className="mt-7 text-sm text-muted-foreground">
        링크를 선택하면 새 탭에서 콘텐츠를 확인할 수 있습니다.
      </p>
    </section>
  )
}
