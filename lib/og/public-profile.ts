type FirestoreValue = {
  stringValue?: string
}

type FirestoreDocument = {
  name: string
  fields?: Record<string, FirestoreValue>
}

export type OgPublicProfile = {
  uid: string
  userName: string
  displayName: string
  photoURL: string
  bio: string
}

function normalizeDisplayName(displayName: string) {
  return displayName.trim().replace(/^@/, "").toLowerCase()
}

function getStringField(document: FirestoreDocument | null, field: string) {
  return document?.fields?.[field]?.stringValue
}

function getDocumentId(documentName: string) {
  return documentName.split("/").at(-1) ?? ""
}

function getFirestoreBaseUrl() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

  if (!projectId) {
    return null
  }

  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`
}

function getFirebaseApiKeyQuery() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY

  return apiKey ? `?key=${encodeURIComponent(apiKey)}` : ""
}

async function fetchFirestoreDocument(path: string) {
  const baseUrl = getFirestoreBaseUrl()

  if (!baseUrl) {
    return null
  }

  const response = await fetch(
    `${baseUrl}/${path}${getFirebaseApiKeyQuery()}`,
    { cache: "no-store" }
  )

  if (!response.ok) {
    return null
  }

  return (await response.json()) as FirestoreDocument
}

function getProfileFromDocument(
  document: FirestoreDocument | null,
  fallbackDisplayName: string
) {
  if (!document) {
    return null
  }

  const userName = getStringField(document, "userName")

  if (!userName || userName.trim().length === 0) {
    return null
  }

  return {
    uid: getDocumentId(document.name),
    userName,
    displayName: getStringField(document, "displayName") ?? fallbackDisplayName,
    photoURL: getStringField(document, "photoURL") ?? "",
    bio: getStringField(document, "bio") ?? "",
  } satisfies OgPublicProfile
}

async function queryUserByDisplayName(displayName: string) {
  const baseUrl = getFirestoreBaseUrl()

  if (!baseUrl) {
    return null
  }

  const response = await fetch(
    `${baseUrl}:runQuery${getFirebaseApiKeyQuery()}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "users" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "displayName" },
              op: "EQUAL",
              value: { stringValue: displayName },
            },
          },
          limit: 1,
        },
      }),
      cache: "no-store",
    }
  )

  if (!response.ok) {
    return null
  }

  const results = (await response.json()) as Array<{
    document?: FirestoreDocument
  }>

  return results.find((item) => item.document)?.document ?? null
}

export async function fetchOgPublicProfile(displayName: string) {
  const normalizedDisplayName = normalizeDisplayName(displayName)
  const reservation = await fetchFirestoreDocument(
    `displayNames/${encodeURIComponent(normalizedDisplayName)}`
  )
  const reservedUserId = getStringField(reservation, "uid")

  if (reservedUserId) {
    const profileDocument = await fetchFirestoreDocument(
      `users/${encodeURIComponent(reservedUserId)}`
    )
    const profile = getProfileFromDocument(
      profileDocument,
      normalizedDisplayName
    )

    if (profile) {
      return profile
    }
  }

  return getProfileFromDocument(
    await queryUserByDisplayName(normalizedDisplayName),
    normalizedDisplayName
  )
}
