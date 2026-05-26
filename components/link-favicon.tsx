"use client"

import { useState } from "react"
import Image from "next/image"
import { Link01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

type LinkFaviconProps = {
  url: string
}

function getFaviconUrl(url: string) {
  const hostname = new URL(url).hostname

  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`
}

export function LinkFavicon({ url }: LinkFaviconProps) {
  const [failed, setFailed] = useState(false)
  const isPlaceholderUrl = new URL(url).hostname.endsWith(".example.com")

  if (failed || isPlaceholderUrl) {
    return (
      <HugeiconsIcon
        icon={Link01Icon}
        className="text-muted-foreground"
        size={20}
        aria-hidden="true"
      />
    )
  }

  return (
    <Image
      src={getFaviconUrl(url)}
      alt=""
      width={24}
      height={24}
      aria-hidden="true"
      onError={() => setFailed(true)}
    />
  )
}
