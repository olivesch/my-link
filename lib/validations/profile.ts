import { z } from "zod"

export const userNameFormSchema = z.object({
  userName: z
    .string()
    .trim()
    .min(1, "표시 이름을 입력해주세요.")
    .max(40, "표시 이름은 40자 이하여야 합니다."),
})

export type UserNameFormValues = z.infer<typeof userNameFormSchema>

export const displayNameFormSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "주소 아이디를 입력해주세요.")
    .max(30, "주소 아이디는 30자 이하여야 합니다.")
    .regex(
      /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/,
      "영문 소문자, 숫자, ., _, -만 사용할 수 있습니다."
    ),
})

export type DisplayNameFormValues = z.infer<typeof displayNameFormSchema>
