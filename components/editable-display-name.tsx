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
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { db } from "@/lib/firebase/client"
import {
  displayNameFormSchema,
  type DisplayNameFormValues,
} from "@/lib/validations/profile"

type EditableDisplayNameProps = {
  userId: string
  displayName: string
  onDisplayNameChange: (displayName: string) => void
}

type AvailabilityState = "idle" | "checking" | "available" | "taken" | "error"

class DisplayNameTakenError extends Error {}

export function EditableDisplayName({
  userId,
  displayName,
  onDisplayNameChange,
}: EditableDisplayNameProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [availability, setAvailability] = useState<AvailabilityState>("idle")
  const [checkedDisplayName, setCheckedDisplayName] = useState("")
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    setError,
    clearErrors,
    trigger,
    formState: { errors },
  } = useForm<DisplayNameFormValues>({
    resolver: zodResolver(displayNameFormSchema),
    defaultValues: { displayName },
    mode: "onSubmit",
    reValidateMode: "onChange",
  })
  const updateDisplayNameMutation = useMutation({
    mutationFn: async ({
      previousDisplayName,
      nextDisplayName,
    }: {
      previousDisplayName: string
      nextDisplayName: string
    }) => {
      const currentReference = doc(db, "displayNames", previousDisplayName)
      const nextReference = doc(db, "displayNames", nextDisplayName)
      const profileReference = doc(db, "users", userId)

      await runTransaction(db, async (transaction) => {
        const nextSnapshot = await transaction.get(nextReference)
        const currentSnapshot = await transaction.get(currentReference)

        if (nextSnapshot.exists() && nextSnapshot.data().uid !== userId) {
          throw new DisplayNameTakenError()
        }

        transaction.set(
          nextReference,
          {
            uid: userId,
            displayName: nextDisplayName,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
        transaction.set(
          profileReference,
          {
            displayName: nextDisplayName,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )

        if (currentSnapshot.exists() && currentSnapshot.data().uid === userId) {
          transaction.delete(currentReference)
        }
      })
    },
    onMutate: ({ previousDisplayName, nextDisplayName }) => {
      onDisplayNameChange(nextDisplayName)
      setAvailability("idle")
      setCheckedDisplayName("")
      setIsEditing(false)

      return { previousDisplayName, nextDisplayName }
    },
    onError: (error, _variables, context) => {
      if (!context) {
        return
      }

      onDisplayNameChange(context.previousDisplayName)
      reset({ displayName: context.nextDisplayName })
      setIsEditing(true)

      if (error instanceof DisplayNameTakenError) {
        setAvailability("taken")
        setError("displayName", {
          type: "duplicate",
          message: "방금 다른 사용자가 사용하기 시작한 주소 아이디입니다.",
        })
        return
      }

      setError("root", {
        type: "server",
        message:
          "주소 아이디를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.",
      })
    },
  })

  useEffect(() => {
    if (!isEditing) {
      reset({ displayName })
    }
  }, [displayName, isEditing, reset])

  function beginEditing() {
    clearErrors()
    reset({ displayName })
    setAvailability("idle")
    setCheckedDisplayName("")
    setIsEditing(true)
  }

  function cancelEditing() {
    clearErrors()
    reset({ displayName })
    setAvailability("idle")
    setCheckedDisplayName("")
    setIsEditing(false)
  }

  function invalidateAvailability() {
    clearErrors("displayName")
    clearErrors("root")
    setAvailability("idle")
    setCheckedDisplayName("")
  }

  async function checkAvailability() {
    clearErrors()

    if (!(await trigger("displayName"))) {
      return
    }

    const nextDisplayName = getValues("displayName").trim()

    setAvailability("checking")

    try {
      const reservationSnapshot = await getDoc(
        doc(db, "displayNames", nextDisplayName)
      )
      const isOwnedByAnotherUser =
        reservationSnapshot.exists() &&
        reservationSnapshot.data().uid !== userId

      if (isOwnedByAnotherUser) {
        setAvailability("taken")
        setCheckedDisplayName("")
        setError("displayName", {
          type: "duplicate",
          message: "이미 사용 중인 주소 아이디입니다.",
        })
        return
      }

      setAvailability("available")
      setCheckedDisplayName(nextDisplayName)
    } catch {
      setAvailability("error")
      setCheckedDisplayName("")
      setError("root", {
        type: "server",
        message: "중복 확인을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.",
      })
    }
  }

  function saveDisplayName(values: DisplayNameFormValues) {
    const nextDisplayName = values.displayName.trim()

    if (nextDisplayName === displayName) {
      setIsEditing(false)
      return
    }

    if (
      availability !== "available" ||
      checkedDisplayName !== nextDisplayName
    ) {
      setError("displayName", {
        type: "duplicate",
        message: "저장 전에 중복 확인을 해주세요.",
      })
      return
    }

    updateDisplayNameMutation.mutate({
      previousDisplayName: displayName,
      nextDisplayName,
    })
  }

  if (!isEditing) {
    return (
      <div>
        <button
          type="button"
          disabled={updateDisplayNameMutation.isPending}
          className="group mt-1 flex max-w-full items-center gap-2 text-left text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-70"
          aria-label="주소 아이디 수정"
          onClick={beginEditing}
        >
          <span className="min-w-0 truncate">@{displayName}</span>
          <HugeiconsIcon
            icon={PencilEdit01Icon}
            size={14}
            className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
            aria-hidden="true"
          />
        </button>
        {updateDisplayNameMutation.isPending && (
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
      className="mt-2 max-w-xs space-y-2.5"
      noValidate
      onSubmit={handleSubmit(saveDisplayName)}
    >
      <Label className="sr-only" htmlFor="display-name">
        주소 아이디
      </Label>
      <div className="flex items-start gap-1.5">
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-xs text-muted-foreground">
            @
          </span>
          <Input
            id="display-name"
            className="pl-6"
            maxLength={30}
            autoComplete="off"
            autoFocus
            {...register("displayName", {
              onChange: invalidateAvailability,
            })}
            aria-invalid={Boolean(errors.displayName)}
            aria-describedby={
              errors.displayName ? "display-name-error" : undefined
            }
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={
            updateDisplayNameMutation.isPending || availability === "checking"
          }
          onClick={() => void checkAvailability()}
        >
          {availability === "checking" && (
            <HugeiconsIcon
              icon={Loading03Icon}
              className="animate-spin"
              data-icon="inline-start"
            />
          )}
          중복 확인
        </Button>
        <Button
          type="submit"
          size="icon-sm"
          disabled={
            updateDisplayNameMutation.isPending || availability === "checking"
          }
          title="주소 아이디 저장"
          aria-label="주소 아이디 저장"
        >
          <HugeiconsIcon
            icon={
              updateDisplayNameMutation.isPending
                ? Loading03Icon
                : FloppyDiskIcon
            }
            className={
              updateDisplayNameMutation.isPending ? "animate-spin" : undefined
            }
          />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={updateDisplayNameMutation.isPending}
          title="수정 취소"
          aria-label="주소 아이디 수정 취소"
          onClick={cancelEditing}
        >
          <HugeiconsIcon icon={Cancel01Icon} />
        </Button>
      </div>

      {availability === "available" && !errors.displayName && (
        <p className="text-xs text-primary">사용 가능한 주소 아이디입니다.</p>
      )}
      {errors.displayName && (
        <p
          id="display-name-error"
          className="text-xs text-destructive"
          role="alert"
        >
          {errors.displayName.message}
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
