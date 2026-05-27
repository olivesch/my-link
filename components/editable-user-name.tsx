"use client"

import { useEffect, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Cancel01Icon,
  FloppyDiskIcon,
  Loading03Icon,
  PencilEdit01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { doc, serverTimestamp, setDoc } from "firebase/firestore"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { db } from "@/lib/firebase/client"
import {
  userNameFormSchema,
  type UserNameFormValues,
} from "@/lib/validations/profile"

type EditableUserNameProps = {
  userId: string
  userName: string
  onUserNameChange: (userName: string) => void
}

export function EditableUserName({
  userId,
  userName,
  onUserNameChange,
}: EditableUserNameProps) {
  const [isEditing, setIsEditing] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<UserNameFormValues>({
    resolver: zodResolver(userNameFormSchema),
    defaultValues: { userName },
    mode: "onSubmit",
    reValidateMode: "onChange",
  })
  const updateUserNameMutation = useMutation({
    mutationFn: async (nextUserName: string) => {
      await setDoc(
        doc(db, "users", userId),
        { userName: nextUserName, updatedAt: serverTimestamp() },
        { merge: true }
      )
    },
    onMutate: (nextUserName) => {
      onUserNameChange(nextUserName)
      setIsEditing(false)

      return { previousUserName: userName }
    },
    onError: (_error, nextUserName, context) => {
      if (context) {
        onUserNameChange(context.previousUserName)
      }

      reset({ userName: nextUserName })
      setIsEditing(true)
      setError("root", {
        type: "server",
        message: "표시 이름을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.",
      })
    },
  })

  useEffect(() => {
    if (!isEditing) {
      reset({ userName })
    }
  }, [isEditing, reset, userName])

  function beginEditing() {
    clearErrors()
    reset({ userName })
    setIsEditing(true)
  }

  function cancelEditing() {
    clearErrors()
    reset({ userName })
    setIsEditing(false)
  }

  function saveUserName(values: UserNameFormValues) {
    const nextUserName = values.userName.trim()

    if (nextUserName === userName) {
      setIsEditing(false)
      return
    }

    updateUserNameMutation.mutate(nextUserName)
  }

  if (!isEditing) {
    return (
      <div>
        <button
          type="button"
          disabled={updateUserNameMutation.isPending}
          className="group flex max-w-full items-center gap-2 text-left text-3xl font-semibold transition-colors hover:text-primary focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-70 sm:text-4xl"
          aria-label="표시 이름 수정"
          onClick={beginEditing}
        >
          <span className="min-w-0 truncate">{userName}</span>
          <HugeiconsIcon
            icon={PencilEdit01Icon}
            size={18}
            className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
            aria-hidden="true"
          />
        </button>
        {updateUserNameMutation.isPending && (
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <HugeiconsIcon icon={Loading03Icon} className="animate-spin" />
            저장 중
          </p>
        )}
      </div>
    )
  }

  return (
    <form
      className="max-w-xs space-y-2"
      noValidate
      onSubmit={handleSubmit(saveUserName)}
    >
      <Label className="sr-only" htmlFor="user-name">
        표시 이름
      </Label>
      <div className="flex items-start gap-1.5">
        <Input
          id="user-name"
          className="h-10 text-base font-semibold sm:text-lg"
          maxLength={40}
          autoComplete="name"
          autoFocus
          {...register("userName", {
            onChange: () => clearErrors("root"),
          })}
          aria-invalid={Boolean(errors.userName)}
          aria-describedby={errors.userName ? "user-name-error" : undefined}
        />
        <Button
          type="submit"
          size="icon-lg"
          disabled={updateUserNameMutation.isPending}
          title="표시 이름 저장"
          aria-label="표시 이름 저장"
        >
          <HugeiconsIcon
            icon={
              updateUserNameMutation.isPending ? Loading03Icon : FloppyDiskIcon
            }
            className={
              updateUserNameMutation.isPending ? "animate-spin" : undefined
            }
          />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          disabled={updateUserNameMutation.isPending}
          title="수정 취소"
          aria-label="표시 이름 수정 취소"
          onClick={cancelEditing}
        >
          <HugeiconsIcon icon={Cancel01Icon} />
        </Button>
      </div>

      {errors.userName && (
        <p
          id="user-name-error"
          className="text-xs text-destructive"
          role="alert"
        >
          {errors.userName.message}
        </p>
      )}
      {errors.root?.message && (
        <p className="text-xs text-destructive" role="alert">
          {errors.root.message}
        </p>
      )}
    </form>
  )
}
