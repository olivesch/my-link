import { ImageResponse } from "next/og"

import { getOgFonts } from "@/lib/og/fonts"

export const alt = "MyLink - Development in One Link"
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

export default async function Image() {
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
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 676,
            padding: "58px 56px 46px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                color: colors.primary,
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: colors.primary,
                  color: colors.primaryForeground,
                  fontSize: 26,
                  fontWeight: 700,
                }}
              >
                M
              </div>
              MyLink
            </div>

            <div
              style={{
                marginTop: 34,
                display: "flex",
                width: 520,
                fontSize: 72,
                lineHeight: 1.04,
                letterSpacing: 0,
                fontWeight: 700,
              }}
            >
              Development in One Link.
            </div>

            <div
              style={{
                marginTop: 28,
                display: "flex",
                width: 540,
                color: colors.mutedForeground,
                fontSize: 28,
                lineHeight: 1.45,
              }}
            >
              GitHub, blog, portfolio, and social channels in one clean
              developer profile.
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            {["Profile", "Links", "Stats"].map((item) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  border: `1px solid ${colors.border}`,
                  background:
                    item === "Links" ? colors.primarySoft : colors.muted,
                  color:
                    item === "Links" ? colors.primary : colors.mutedForeground,
                  padding: "12px 18px",
                  fontSize: 22,
                  fontWeight: 700,
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingRight: 48,
          }}
        >
          <div
            style={{
              width: 360,
              display: "flex",
              flexDirection: "column",
              border: `2px solid ${colors.foreground}`,
              background: colors.background,
              boxShadow: `12px 12px 0 ${colors.foreground}`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: `1px solid ${colors.border}`,
                padding: "16px 18px",
              }}
            >
              <div style={{ display: "flex", gap: 8 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    background: colors.primary,
                  }}
                />
                <span
                  style={{
                    width: 10,
                    height: 10,
                    background: colors.border,
                  }}
                />
                <span
                  style={{
                    width: 10,
                    height: 10,
                    background: colors.border,
                  }}
                />
              </div>
              <div style={{ color: colors.mutedForeground, fontSize: 16 }}>
                mylink.app
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                padding: 24,
                gap: 12,
              }}
            >
              {["GitHub", "Tech Blog", "Portfolio"].map((item, index) => (
                <div
                  key={item}
                  style={{
                    height: 58,
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    border: `1px solid ${colors.border}`,
                    background:
                      index === 0 ? colors.primarySoft : colors.background,
                    padding: "0 16px",
                    fontSize: 22,
                    fontWeight: 700,
                  }}
                >
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      background: index === 0 ? colors.primary : colors.border,
                    }}
                  />
                  {item}
                </div>
              ))}
            </div>
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
