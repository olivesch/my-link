export type Link = {
  id: string
  title: string
  url: string
  icon?: string
  updatedAt?: Date
}

export const links: Link[] = [
  {
    id: "instagram",
    title: "인스타그램",
    url: "https://www.instagram.com/",
    icon: "instagram",
  },
  {
    id: "youtube",
    title: "유튜브",
    url: "https://www.youtube.com/",
    icon: "youtube",
  },
  {
    id: "blog",
    title: "블로그",
    url: "https://blog.example.com/",
    icon: "blog",
  },
  {
    id: "github",
    title: "GitHub",
    url: "https://github.com/",
    icon: "github",
  },
  {
    id: "portfolio",
    title: "포트폴리오",
    url: "https://portfolio.example.com/",
  },
]
