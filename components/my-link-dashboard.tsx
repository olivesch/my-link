"use client"

import { useEffect, useRef, useState, type ChangeEvent } from "react"
import Image from "next/image"
import Link from "next/link"
import { useMutation } from "@tanstack/react-query"
import {
  ArrowUpRight01Icon,
  ChartColumnIcon,
  CodeCircleIcon,
  CopyLinkIcon,
  GithubIcon,
  GoogleIcon,
  InstagramIcon,
  Link02Icon,
  Loading03Icon,
  PencilEdit01Icon,
  Rocket01Icon,
  ShareKnowledgeIcon,
  SparklesIcon,
  YoutubeIcon,
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

type LandingPageProps = {
  authError: string
  isAuthPending: boolean
  onGoogleSignIn: () => void
}

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

function LandingPage({
  authError,
  isAuthPending,
  onGoogleSignIn,
}: LandingPageProps) {
  const previewLinks = [
    {
      title: "GitHub",
      caption: "최근 커밋과 오픈소스",
      icon: GithubIcon,
    },
    {
      title: "Tech Blog",
      caption: "기록해둔 문제 해결 과정",
      icon: CodeCircleIcon,
    },
    {
      title: "Portfolio",
      caption: "프로젝트 데모와 결과물",
      icon: Rocket01Icon,
    },
  ]
  const workflowItems = [
    {
      title: "프로필",
      description: "Google 계정 기반으로 이름, 소개, 공개 주소를 정리합니다.",
      icon: SparklesIcon,
    },
    {
      title: "링크",
      description:
        "GitHub, 블로그, 포트폴리오 링크를 하나의 목록으로 모읍니다.",
      icon: Link02Icon,
    },
    {
      title: "클릭",
      description: "어떤 링크가 더 많이 눌렸는지 통계 페이지에서 확인합니다.",
      icon: ChartColumnIcon,
    },
  ]

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <section className="grid min-h-[calc(100svh-8rem)] gap-10 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-center lg:gap-16">
        <div className="max-w-2xl">
          <p className="mb-4 inline-flex items-center gap-2 border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <HugeiconsIcon icon={SparklesIcon} size={14} aria-hidden="true" />
            MYLINK FOR DEVELOPERS
          </p>
          <h1 className="text-4xl leading-tight font-semibold sm:text-6xl">
            Development in One Link.
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
            Github, 블로그, 포트폴리오까지 개발자의 정보를 한 페이지로
            요약해보세요. 흩어진 작업물을 하나의 공개 페이지로 묶고, 클릭
            흐름까지 가볍게 확인할 수 있습니다.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="button"
              size="lg"
              disabled={isAuthPending}
              className="h-11 px-4"
              onClick={onGoogleSignIn}
            >
              <HugeiconsIcon
                icon={isAuthPending ? Loading03Icon : GoogleIcon}
                className={isAuthPending ? "animate-spin" : undefined}
                data-icon="inline-start"
              />
              Google로 시작하기
            </Button>
            <a
              href="#preview"
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className: "h-11 px-4",
              })}
            >
              공개 페이지 미리보기
              <HugeiconsIcon
                icon={ArrowUpRight01Icon}
                size={15}
                aria-hidden="true"
              />
            </a>
          </div>

          {authError && (
            <p className="mt-5 text-sm text-destructive" role="alert">
              {authError}
            </p>
          )}

          <div className="mt-9 grid max-w-xl grid-cols-3 border border-border bg-card">
            <div className="border-r border-border px-4 py-3">
              <p className="font-mono text-2xl font-semibold tabular-nums">3</p>
              <p className="mt-1 text-xs text-muted-foreground">핵심 링크</p>
            </div>
            <div className="border-r border-border px-4 py-3">
              <p className="font-mono text-2xl font-semibold tabular-nums">1</p>
              <p className="mt-1 text-xs text-muted-foreground">공개 주소</p>
            </div>
            <div className="px-4 py-3">
              <p className="font-mono text-2xl font-semibold tabular-nums">∞</p>
              <p className="mt-1 text-xs text-muted-foreground">공유 가능</p>
            </div>
          </div>
        </div>

        <div id="preview" className="lg:justify-self-end">
          <div className="border border-border bg-card shadow-[8px_8px_0_var(--foreground)]">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="size-2 bg-primary" />
                <span className="size-2 bg-muted-foreground/40" />
                <span className="size-2 bg-muted-foreground/20" />
              </div>
              <code className="text-xs text-muted-foreground">
                mylink.dev/@developer
              </code>
            </div>

            <div className="px-5 py-6">
              <div className="flex items-start gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center border border-primary/20 bg-primary/10 text-lg font-semibold text-primary">
                  SC
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-semibold">MyLink Creator</p>
                  <p className="text-sm text-muted-foreground">@developer</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    프로젝트와 채널을 한 곳에 정리하는 개발자입니다.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2">
                {previewLinks.map((item) => (
                  <div
                    key={item.title}
                    className="flex min-h-14 items-center gap-3 border border-border bg-background px-4"
                  >
                    <HugeiconsIcon
                      icon={item.icon}
                      size={20}
                      className="text-primary"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {item.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.caption}
                      </p>
                    </div>
                    <HugeiconsIcon
                      icon={ArrowUpRight01Icon}
                      size={16}
                      className="text-muted-foreground"
                      aria-hidden="true"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <div className="border border-border bg-primary/5 p-3">
                  <p className="text-xs text-muted-foreground">이번 주 클릭</p>
                  <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
                    128
                  </p>
                </div>
                <div className="border border-border p-3">
                  <p className="text-xs text-muted-foreground">상위 링크</p>
                  <p className="mt-1 truncate text-sm font-medium">GitHub</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border py-10 sm:py-14">
        <div className="border border-border bg-card shadow-[8px_8px_0_var(--foreground)]">
          <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="size-2 bg-primary" />
              <span className="size-2 bg-muted-foreground/40" />
              <span className="size-2 bg-muted-foreground/20" />
              <code className="ml-2 text-xs text-muted-foreground">
                setup.flow
              </code>
            </div>
            <span className="w-fit border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary">
              3 STEP
            </span>
          </div>

          <div className="grid divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
            {workflowItems.map((item, index) => (
              <div key={item.title} className="p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">
                    0{index + 1}
                  </span>
                  <span className="flex size-9 items-center justify-center border border-primary/20 bg-primary/5 text-primary">
                    <HugeiconsIcon
                      icon={item.icon}
                      size={20}
                      aria-hidden="true"
                    />
                  </span>
                </div>
                <h2 className="mt-5 text-lg font-semibold">{item.title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-4 sm:pb-6">
        <div className="grid gap-0 border border-border bg-card shadow-[8px_8px_0_var(--foreground)] md:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="border-b border-border px-5 py-6 sm:px-6 md:border-r md:border-b-0">
            <p className="mb-3 inline-flex items-center gap-2 border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary">
              <HugeiconsIcon icon={ShareKnowledgeIcon} size={14} />
              SHARE STACK
            </p>
            <h2 className="text-2xl leading-tight font-semibold">
              작업물을 보러 오는 사람에게 필요한 링크만 남깁니다.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
              GitHub, Instagram, YouTube, 블로그처럼 성격이 다른 채널도 하나의
              흐름으로 보여줄 수 있습니다. 방문자는 고민 없이 눌러보고, 소유자는
              통계로 반응을 확인합니다.
            </p>
          </div>

          <div className="p-5 sm:p-6">
            <div className="grid grid-cols-4 gap-2 md:grid-cols-2">
              <span className="flex aspect-square items-center justify-center border border-border bg-background">
                <HugeiconsIcon icon={GithubIcon} size={20} aria-hidden="true" />
              </span>
              <span className="flex aspect-square items-center justify-center border border-border bg-background">
                <HugeiconsIcon
                  icon={InstagramIcon}
                  size={20}
                  aria-hidden="true"
                />
              </span>
              <span className="flex aspect-square items-center justify-center border border-border bg-background">
                <HugeiconsIcon
                  icon={YoutubeIcon}
                  size={20}
                  aria-hidden="true"
                />
              </span>
              <span className="flex aspect-square items-center justify-center border border-border bg-primary text-primary-foreground">
                <HugeiconsIcon
                  icon={CopyLinkIcon}
                  size={20}
                  aria-hidden="true"
                />
              </span>
            </div>
            <div className="mt-4 border border-border bg-background p-3">
              <p className="font-mono text-xs text-muted-foreground">
                /github + /blog + /portfolio
              </p>
              <p className="mt-1 text-sm font-medium">하나의 MyLink로 공유</p>
            </div>
          </div>
        </div>
      </section>
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
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
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
        <LandingPage
          authError={authError}
          isAuthPending={isAuthPending}
          onGoogleSignIn={handleGoogleSignIn}
        />
      )}
    </main>
  )
}
