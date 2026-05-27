import { PublicProfilePage } from "@/components/public-profile-page"

export default async function Page({
  params,
}: {
  params: Promise<{ displayName: string }>
}) {
  const { displayName } = await params

  return <PublicProfilePage displayName={displayName} />
}
