import { z } from "zod"

export const linkFormSchema = z
  .object({
    title: z.string().trim().min(1, "링크 제목을 입력해주세요."),
    url: z.string().trim().min(1, "URL을 입력해주세요."),
  })
  .superRefine(({ url }, context) => {
    if (!url) {
      return
    }

    let parsedUrl: URL

    try {
      parsedUrl = new URL(url)
    } catch {
      context.addIssue({
        code: "custom",
        message: "https://로 시작하는 올바른 URL을 입력해주세요.",
        path: ["url"],
      })
      return
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      context.addIssue({
        code: "custom",
        message: "웹 주소는 http 또는 https 형식만 등록할 수 있습니다.",
        path: ["url"],
      })
    }
  })

export type LinkFormValues = z.infer<typeof linkFormSchema>
