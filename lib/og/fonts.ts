const regularFontUrl =
  "https://unpkg.com/pretendard@1.3.9/dist/web/static/woff/Pretendard-Regular.woff"
const boldFontUrl =
  "https://unpkg.com/pretendard@1.3.9/dist/web/static/woff/Pretendard-Bold.woff"

let regularFontPromise: Promise<ArrayBuffer | null> | null = null
let boldFontPromise: Promise<ArrayBuffer | null> | null = null

type OgFont = {
  name: string
  data: ArrayBuffer
  weight: 400 | 700
  style: "normal"
}

async function loadFont(url: string) {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      return null
    }

    return response.arrayBuffer()
  } catch {
    return null
  }
}

async function loadLocalFont(candidates: string[]) {
  const fs = await import("node:fs/promises")

  for (const candidate of candidates) {
    try {
      const buffer = await fs.readFile(candidate)

      return buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
      )
    } catch {
      // Try the next local fallback.
    }
  }

  return null
}

async function loadRegularFont() {
  const path = await import("node:path")

  return (
    (await loadFont(regularFontUrl)) ??
    (await loadLocalFont([
      "C:\\Windows\\Fonts\\malgun.ttf",
      path.join(
        process.cwd(),
        "node_modules",
        "next",
        "dist",
        "compiled",
        "@vercel",
        "og",
        "noto-sans-v27-latin-regular.ttf"
      ),
    ]))
  )
}

async function loadBoldFont() {
  const path = await import("node:path")

  return (
    (await loadFont(boldFontUrl)) ??
    (await loadLocalFont([
      "C:\\Windows\\Fonts\\malgunbd.ttf",
      "C:\\Windows\\Fonts\\malgun.ttf",
      path.join(
        process.cwd(),
        "node_modules",
        "next",
        "dist",
        "compiled",
        "@vercel",
        "og",
        "noto-sans-v27-latin-regular.ttf"
      ),
    ]))
  )
}

export async function getOgFonts() {
  regularFontPromise ??= loadRegularFont()
  boldFontPromise ??= loadBoldFont()

  const [regularFont, boldFont] = await Promise.all([
    regularFontPromise,
    boldFontPromise,
  ])
  const fonts: OgFont[] = []

  if (regularFont) {
    fonts.push({
      name: "Pretendard",
      data: regularFont,
      weight: 400,
      style: "normal",
    })
  }

  if (boldFont) {
    fonts.push({
      name: "Pretendard",
      data: boldFont,
      weight: 700,
      style: "normal",
    })
  }

  return fonts
}
