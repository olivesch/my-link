import { ImageResponse } from "next/og"

import { getOgFonts } from "@/lib/og/fonts"
import { fetchOgPublicProfile } from "@/lib/og/public-profile"

export const alt = "MyLink public profile"
export const runtime = "nodejs"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

const colors = {
  background: "#ffffff",
  foreground: "#25231f",
  muted: "#f5f3ed",
  mutedForeground: "#746f66",
  border: "#dedbd2",
  primary: "#16856e",
  primarySoft: "#e8f6f0",
  primaryForeground: "#f4fff9",
}

function getInitials(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || "M"
}

function getSafeText(value: string, fallback: string) {
  return value.trim().length > 0 ? value.trim() : fallback
}

export default async function Image({
  params,
}: {
  params: Promise<{ displayName: string }>
}) {
  const { displayName } = await params
  const profile = await fetchOgPublicProfile(displayName)
  const normalizedDisplayName = displayName.trim().replace(/^@/, "")
  const userName = getSafeText(profile?.userName ?? "", "MyLink Creator")
  const publicName = getSafeText(
    profile?.displayName ?? normalizedDisplayName,
    "developer"
  )
  const bio = getSafeText(
    profile?.bio ?? "",
    "프로젝트, 포트폴리오, 채널을 하나의 링크로 공유합니다."
  )
  const fonts = await getOgFonts()

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: colors.background,
        color: colors.foreground,
        fontFamily: "Pretendard",
        padding: 48,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          border: `2px solid ${colors.border}`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 10,
            background: colors.primary,
          }}
        />

        <div
          style={{
            position: "absolute",
            left: 72,
            top: 72,
            right: 72,
            height: 72,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            border: `1px solid ${colors.border}`,
            background: colors.background,
            padding: "0 24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: colors.primary,
                color: colors.primaryForeground,
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              M
            </div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>MyLink</div>
          </div>
          <div style={{ color: colors.mutedForeground, fontSize: 20 }}>
            {`/${publicName}`}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 92,
            bottom: 72,
            width: 648,
            height: 340,
            background: colors.foreground,
          }}
        />

        <div
          style={{
            margin: "176px 0 0 72px",
            width: 648,
            height: 340,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            border: `2px solid ${colors.foreground}`,
            background: colors.background,
            padding: 36,
          }}
        >
          <div style={{ display: "flex", gap: 26 }}>
            <div
              style={{
                width: 112,
                height: 112,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `2px solid ${colors.primary}`,
                background: colors.primarySoft,
                color: colors.primary,
                fontSize: 42,
                fontWeight: 700,
              }}
            >
              {getInitials(userName)}
            </div>
            <div
              style={{
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                flex: 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 48,
                  lineHeight: 1.1,
                  fontWeight: 700,
                }}
              >
                {userName}
              </div>
              <div
                style={{
                  marginTop: 10,
                  color: colors.primary,
                  fontSize: 24,
                  fontWeight: 700,
                }}
              >
                {`@${publicName}`}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              color: colors.mutedForeground,
              fontSize: 26,
              lineHeight: 1.45,
            }}
          >
            {bio}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "flex-end",
            padding: "0 72px 72px 24px",
          }}
        >
          <div
            style={{
              width: 310,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {["Projects", "Blog", "Portfolio"].map((item, index) => (
              <div
                key={item}
                style={{
                  height: 62,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  border: `1px solid ${colors.border}`,
                  background: index === 0 ? colors.primarySoft : colors.muted,
                  color: index === 0 ? colors.primary : colors.mutedForeground,
                  padding: "0 18px",
                  fontSize: 24,
                  fontWeight: 700,
                }}
              >
                {item}
                <span style={{ fontSize: 24 }}>↗</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts,
    }
  )
}
