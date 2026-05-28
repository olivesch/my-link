import {
  collection,
  doc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore"

import type { Link } from "@/data/links"
import { db } from "@/lib/firebase/client"

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
    clickCount:
      typeof data.clickCount === "number" && Number.isFinite(data.clickCount)
        ? data.clickCount
        : 0,
    updatedAt:
      data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined,
  }
}

export function getLinksQueryKey(userId: string) {
  return ["links", userId] as const
}

export async function fetchLinks(userId: string) {
  const snapshot = await getDocs(
    query(
      collection(db, "users", userId, "links"),
      orderBy("createdAt", "desc")
    )
  )

  return snapshot.docs.flatMap((document) => {
    const link = getLinkFromDocument(document)

    return link ? [link] : []
  })
}

export async function recordLinkClick(userId: string, linkId: string) {
  await updateDoc(doc(db, "users", userId, "links", linkId), {
    clickCount: increment(1),
    lastClickedAt: serverTimestamp(),
  })
}
