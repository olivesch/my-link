import { CursorPointer01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { cn } from "@/lib/utils"

type LinkClickCountProps = {
  count: number
  className?: string
}

export function LinkClickCount({ count, className }: LinkClickCountProps) {
  const formattedCount = count.toLocaleString("ko-KR")

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums",
        className
      )}
      title={`조회수 ${formattedCount}회`}
      aria-label={`조회수 ${formattedCount}회`}
    >
      <HugeiconsIcon icon={CursorPointer01Icon} size={13} aria-hidden="true" />
      <span aria-hidden="true">{formattedCount}</span>
    </span>
  )
}
