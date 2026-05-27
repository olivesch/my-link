import { collection, getDocs, limit, query, where } from "firebase/firestore"

import { db } from "@/lib/firebase/client"

export type PublicProfile = {
  uid: string
  userName: string
  displayName: string
  photoURL: string
  bio: string
}

export function getPublicProfileQueryKey(displayName: string) {
  return ["public-profile", displayName] as const
}

export async function fetchPublicProfile(displayName: string) {
  const snapshot = await getDocs(
    query(
      collection(db, "users"),
      where("displayName", "==", displayName),
      limit(1)
    )
  )
  const profileDocument = snapshot.docs[0]

  if (!profileDocument) {
    return null
  }

  const data = profileDocument.data()

  if (typeof data.userName !== "string" || data.userName.trim().length === 0) {
    return null
  }

  return {
    uid: profileDocument.id,
    userName: data.userName,
    displayName:
      typeof data.displayName === "string" ? data.displayName : displayName,
    photoURL: typeof data.photoURL === "string" ? data.photoURL : "",
    bio: typeof data.bio === "string" ? data.bio : "",
  } satisfies PublicProfile
}
