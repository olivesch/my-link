import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
  type DocumentData,
} from "firebase/firestore"

import { db } from "@/lib/firebase/client"

export type PublicProfile = {
  uid: string
  userName: string
  displayName: string
  photoURL: string
  bio: string
}

export function getPublicProfileQueryKey(displayName: string) {
  return ["public-profile", normalizeDisplayName(displayName)] as const
}

function normalizeDisplayName(displayName: string) {
  return displayName.trim().replace(/^@/, "").toLowerCase()
}

function getPublicProfileFromData(
  uid: string,
  data: DocumentData | undefined,
  fallbackDisplayName: string
) {
  if (!data) {
    return null
  }

  if (typeof data.userName !== "string" || data.userName.trim().length === 0) {
    return null
  }

  return {
    uid,
    userName: data.userName,
    displayName:
      typeof data.displayName === "string"
        ? data.displayName
        : fallbackDisplayName,
    photoURL: typeof data.photoURL === "string" ? data.photoURL : "",
    bio: typeof data.bio === "string" ? data.bio : "",
  } satisfies PublicProfile
}

export async function fetchPublicProfile(displayName: string) {
  const normalizedDisplayName = normalizeDisplayName(displayName)
  const reservationSnapshot = await getDoc(
    doc(db, "displayNames", normalizedDisplayName)
  )
  const reservedUserId = reservationSnapshot.data()?.uid

  if (typeof reservedUserId === "string" && reservedUserId.length > 0) {
    const profileSnapshot = await getDoc(doc(db, "users", reservedUserId))
    const profile = getPublicProfileFromData(
      profileSnapshot.id,
      profileSnapshot.data(),
      normalizedDisplayName
    )

    if (profile) {
      return profile
    }
  }

  const snapshot = await getDocs(
    query(
      collection(db, "users"),
      where("displayName", "==", normalizedDisplayName),
      limit(1)
    )
  )
  const profileDocument = snapshot.docs[0]

  if (!profileDocument) {
    return null
  }

  return getPublicProfileFromData(
    profileDocument.id,
    profileDocument.data(),
    normalizedDisplayName
  )
}
