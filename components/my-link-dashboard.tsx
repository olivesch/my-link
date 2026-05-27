"use client"

import { useEffect, useRef, useState, type ChangeEvent } from "react"
import Image from "next/image"
import Link from "next/link"
import { useMutation } from "@tanstack/react-query"
import {
  ArrowUpRight01Icon,
  GoogleIcon,
  Loading03Icon,
  PencilEdit01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth"
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore"

import { EditableDisplayName } from "@/components/editable-display-name"
import { EditableUserName } from "@/components/editable-user-name"
import { LinkManager } from "@/components/link-manager"
import { ProfileMenu } from "@/components/profile-menu"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { auth, db, googleAuthProvider } from "@/lib/firebase/client"
import { getPublicPagePath } from "@/lib/public-page"

type UserProfile = {
  uid: string
  email: string
  userName: string
  displayName: string
  photoURL: string
  bio: string
}

const defaultBio = "한 줄 소개를 입력해주세요."
const legacyDefaultBio = "나의 작업물과 채널을 한 곳에서 공유합니다."
const maxBioLength = 80

function shouldUseDefaultBio(bio: unknown) {
  return (
    typeof bio !== "string" ||
    bio.trim().length === 0 ||
    bio === legacyDefaultBio
  )
}

function getStoredBioDefault(bio: unknown): string {
  if (
    typeof bio !== "string" ||
    bio.trim().length === 0 ||
    bio === legacyDefaultBio
  ) {
    return defaultBio
  }

  return bio
}

function getInitialDisplayName(user: User) {
  const emailName = user.email?.split("@")[0]

  if (emailName) {
    return emailName
  }

  return user.displayName?.replaceAll(" ", "").toLowerCase() || "creator"
}

function getInitialUserName(user: User) {
  return user.displayName?.trim() || getInitialDisplayName(user)
}

function getFallbackProfile(user: User): UserProfile {
  return {
    uid: user.uid,
    email: user.email ?? "",
    userName: getInitialUserName(user),
    displayName: getInitialDisplayName(user),
    photoURL: user.photoURL ?? "",
    bio: defaultBio,
  }
}

function getStoredUserName(userName: unknown, fallbackUserName: string) {
  return typeof userName === "string" && userName.trim().length > 0
    ? userName
    : fallbackUserName
}

async function reserveCurrentDisplayName(profile: UserProfile) {
  const displayNameReference = doc(db, "displayNames", profile.displayName)

  await runTransaction(db, async (transaction) => {
    const displayNameSnapshot = await transaction.get(displayNameReference)

    if (
      !displayNameSnapshot.exists() ||
      displayNameSnapshot.data().uid === profile.uid
    ) {
      transaction.set(
        displayNameReference,
        {
          uid: profile.uid,
          displayName: profile.displayName,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
    }
  })
}

async function getOrCreateUserProfile(user: User) {
  const profileReference = doc(db, "users", user.uid)
  const profileSnapshot = await getDoc(profileReference)
  const fallbackProfile = getFallbackProfile(user)
  const storedProfile = profileSnapshot.data()
  const storedDisplayName =
    typeof storedProfile?.displayName === "string"
      ? storedProfile.displayName
      : fallbackProfile.displayName
  const profile: UserProfile = {
    ...fallbackProfile,
    userName: getStoredUserName(
      storedProfile?.userName,
      fallbackProfile.userName
    ),
    displayName: storedDisplayName,
    bio: getStoredBioDefault(storedProfile?.bio),
  }

  if (profileSnapshot.exists()) {
    await setDoc(
      profileReference,
      {
        uid: profile.uid,
        email: profile.email,
        userName: profile.userName,
        displayName: profile.displayName,
        photoURL: profile.photoURL,
        ...(shouldUseDefaultBio(storedProfile?.bio)
          ? { bio: profile.bio }
          : {}),
      },
      { merge: true }
    )
  } else {
    await setDoc(profileReference, {
      ...profile,
      createdAt: serverTimestamp(),
    })
  }

  try {
    await reserveCurrentDisplayName(profile)
  } catch {
    // The profile can still load; the editor reports registry access errors.
  }

  return profile
}

function getInitials(displayName: string) {
  return displayName.slice(0, 2).toUpperCase()
}

type EditableBioProps = {
  userId: string
  bio: string
  onBioChange: (bio: string) => void
}

type BioSaveState = "idle" | "pending" | "saving" | "saved" | "error"

function EditableBio({ userId, bio, onBioChange }: EditableBioProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(bio)
  const [saveState, setSaveState] = useState<BioSaveState>("idle")
  const saveTimeoutRef = useRef<number | null>(null)
  const saveVersionRef = useRef(0)
  const savedBioRef = useRef(bio)
  const saveBioMutation = useMutation({
    mutationFn: async (nextBio: string) => {
      await setDoc(
        doc(db, "users", userId),
        { bio: nextBio, updatedAt: serverTimestamp() },
        { merge: true }
      )
    },
  })

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current !== null) {
        window.clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  async function saveBio(nextBio: string, version: number) {
    setSaveState("saving")

    try {
      await saveBioMutation.mutateAsync(nextBio)

      if (version === saveVersionRef.current) {
        savedBioRef.current = nextBio
        setSaveState("saved")
      }
    } catch {
      if (version === saveVersionRef.current) {
        setDraft(savedBioRef.current)
        onBioChange(savedBioRef.current)
        setSaveState("error")
      }
    }
  }

  function scheduleSave(nextBio: string) {
    if (saveTimeoutRef.current !== null) {
      window.clearTimeout(saveTimeoutRef.current)
    }

    const nextVersion = saveVersionRef.current + 1
    saveVersionRef.current = nextVersion
    setSaveState("pending")
    saveTimeoutRef.current = window.setTimeout(() => {
      saveTimeoutRef.current = null
      void saveBio(nextBio, nextVersion)
    }, 500)
  }

  function handleBioChange(event: ChangeEvent<HTMLInputElement>) {
    const nextBio = event.target.value

    setDraft(nextBio)
    onBioChange(nextBio)
    scheduleSave(nextBio)
  }

  function finishEditing() {
    if (saveTimeoutRef.current !== null) {
      window.clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
      void saveBio(draft, saveVersionRef.current)
    }

    setIsEditing(false)
  }

  return (
    <div className="mt-3 max-w-sm">
      {isEditing ? (
        <Input
          value={draft}
          maxLength={maxBioLength}
          placeholder={defaultBio}
          aria-label="한 줄 소개"
          className="h-9 text-sm"
          autoFocus
          onChange={handleBioChange}
          onBlur={finishEditing}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur()
            }
          }}
        />
      ) : (
        <button
          type="button"
          className="group flex max-w-full items-start gap-2 text-left text-sm leading-7 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:outline-none"
          aria-label="한 줄 소개 수정"
          onClick={() => setIsEditing(true)}
        >
          <span className={bio ? undefined : "text-muted-foreground/70"}>
            {bio || defaultBio}
          </span>
          <HugeiconsIcon
            icon={PencilEdit01Icon}
            size={14}
            className="mt-1.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
            aria-hidden="true"
          />
        </button>
      )}

      {(saveState === "pending" || saveState === "saving") && (
        <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <HugeiconsIcon icon={Loading03Icon} className="animate-spin" />
          저장 중
        </p>
      )}
      {saveState === "saved" && (
        <p className="mt-1.5 text-xs text-muted-foreground">저장됨</p>
      )}
      {saveState === "error" && (
        <p className="mt-1.5 text-xs text-destructive" role="alert">
          소개를 저장하지 못했습니다. 다시 입력해주세요.
        </p>
      )}
    </div>
  )
}

export function MyLinkDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [isAuthPending, setIsAuthPending] = useState(false)
  const [authError, setAuthError] = useState("")

  useEffect(() => {
    let isActive = true
    let profileRequestId = 0

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      const currentRequestId = ++profileRequestId

      if (!isActive) {
        return
      }

      setUser(nextUser)
      setProfile(null)
      setIsAuthReady(true)
      setAuthError("")

      if (!nextUser) {
        return
      }

      void getOrCreateUserProfile(nextUser).then(
        (nextProfile) => {
          if (isActive && currentRequestId === profileRequestId) {
            setProfile(nextProfile)
          }
        },
        () => {
          if (isActive && currentRequestId === profileRequestId) {
            setProfile(getFallbackProfile(nextUser))
            setAuthError(
              "프로필 정보를 저장하지 못했습니다. Firestore 권한을 확인해주세요."
            )
          }
        }
      )
    })

    return () => {
      isActive = false
      unsubscribe()
    }
  }, [])

  async function handleGoogleSignIn() {
    setIsAuthPending(true)
    setAuthError("")

    try {
      await signInWithPopup(auth, googleAuthProvider)
    } catch {
      setAuthError("Google 로그인에 실패했습니다. 다시 시도해주세요.")
    } finally {
      setIsAuthPending(false)
    }
  }

  async function handleSignOut() {
    setIsAuthPending(true)
    setAuthError("")

    try {
      await firebaseSignOut(auth)
    } catch {
      setAuthError("로그아웃하지 못했습니다. 다시 시도해주세요.")
    } finally {
      setIsAuthPending(false)
    }
  }

  function handleBioChange(nextBio: string) {
    setProfile((currentProfile) =>
      currentProfile ? { ...currentProfile, bio: nextBio } : currentProfile
    )
  }

  function handleUserNameChange(nextUserName: string) {
    setProfile((currentProfile) =>
      currentProfile
        ? { ...currentProfile, userName: nextUserName }
        : currentProfile
    )
  }

  function handleDisplayNameChange(nextDisplayName: string) {
    setProfile((currentProfile) =>
      currentProfile
        ? { ...currentProfile, displayName: nextDisplayName }
        : currentProfile
    )
  }

  const isProfileLoading = Boolean(user && !profile)

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

          {!isAuthReady || isProfileLoading ? (
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <HugeiconsIcon icon={Loading03Icon} className="animate-spin" />
              계정 확인 중
            </span>
          ) : profile ? (
            <div className="flex items-center gap-2">
              <Link
                href={getPublicPagePath(profile.displayName)}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                내 페이지로 바로가기
                <HugeiconsIcon
                  icon={ArrowUpRight01Icon}
                  size={14}
                  aria-hidden="true"
                />
              </Link>
              <ProfileMenu
                userId={profile.uid}
                profile={profile}
                isSigningOut={isAuthPending}
                onSignOut={handleSignOut}
              />
            </div>
          ) : (
            <Button
              type="button"
              disabled={isAuthPending}
              onClick={handleGoogleSignIn}
            >
              <HugeiconsIcon
                icon={isAuthPending ? Loading03Icon : GoogleIcon}
                className={isAuthPending ? "animate-spin" : undefined}
                data-icon="inline-start"
              />
              Google 로그인
            </Button>
          )}
        </div>
      </header>

      {!isAuthReady || isProfileLoading ? (
        <section className="mx-auto flex min-h-[calc(100svh-5rem)] w-full max-w-5xl items-center justify-center px-5 sm:px-8">
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <HugeiconsIcon icon={Loading03Icon} className="animate-spin" />내
            링크 페이지를 준비하고 있습니다.
          </p>
        </section>
      ) : profile && user ? (
        <div className="mx-auto grid w-full max-w-5xl gap-10 px-5 py-9 sm:px-8 sm:py-12 lg:grid-cols-[17.5rem_minmax(0,1fr)] lg:gap-16 lg:py-14">
          <aside className="flex flex-col lg:sticky lg:top-10 lg:self-start">
            <div className="flex items-start gap-5 lg:flex-col lg:gap-6">
              <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/20 bg-primary/10 text-xl font-semibold text-primary sm:size-24 sm:text-2xl">
                {profile.photoURL ? (
                  <Image
                    src={profile.photoURL}
                    alt={`${profile.userName} 프로필 사진`}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  getInitials(profile.userName)
                )}
              </div>

              <div className="min-w-0 pt-1 lg:pt-0">
                <p className="mb-2 inline-flex rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  Google 계정
                </p>
                <EditableUserName
                  userId={user.uid}
                  userName={profile.userName}
                  onUserNameChange={handleUserNameChange}
                />
                <EditableDisplayName
                  userId={user.uid}
                  displayName={profile.displayName}
                  onDisplayNameChange={handleDisplayNameChange}
                />
              </div>
            </div>

            <p className="mt-6 truncate text-sm text-muted-foreground">
              {profile.email}
            </p>
            <EditableBio
              userId={user.uid}
              bio={profile.bio}
              onBioChange={handleBioChange}
            />

            {authError && (
              <p className="mt-5 border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {authError}
              </p>
            )}
          </aside>

          <LinkManager key={user.uid} userId={user.uid} />
        </div>
      ) : (
        <section className="mx-auto flex min-h-[calc(100svh-5rem)] w-full max-w-5xl items-center px-5 py-12 sm:px-8">
          <div className="max-w-lg">
            <p className="mb-4 text-xs font-semibold text-primary">MYLINK</p>
            <h1 className="text-3xl leading-tight font-semibold sm:text-5xl">
              Development in One Link.
            </h1>
            <p className="mt-6 max-w-md text-sm leading-7 text-muted-foreground sm:text-base">
              Github, 블로그, 포트폴리오까지 개발자의 정보를 한 페이지로
              요약해보세요.
            </p>
            <Button
              type="button"
              size="lg"
              disabled={isAuthPending}
              className="mt-8"
              onClick={handleGoogleSignIn}
            >
              <HugeiconsIcon
                icon={isAuthPending ? Loading03Icon : GoogleIcon}
                className={isAuthPending ? "animate-spin" : undefined}
                data-icon="inline-start"
              />
              Google로 시작하기
            </Button>
            {authError && (
              <p className="mt-5 text-sm text-destructive" role="alert">
                {authError}
              </p>
            )}
          </div>
        </section>
      )}
    </main>
  )
}
