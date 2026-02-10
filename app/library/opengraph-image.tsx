import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Trey Goff - Library";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #05060A 0%, #0A0F1C 60%, #10192C 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          color: "#F6F5F2",
          position: "relative",
          fontFamily: "ui-sans-serif, system-ui",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(245, 162, 90, 0.35), transparent 70%)",
            top: -140,
            left: -120,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 420,
            height: 420,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(62, 214, 200, 0.3), transparent 70%)",
            bottom: -160,
            right: -80,
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              marginBottom: 20,
            }}
          >
            Library
          </div>
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.4,
              maxWidth: 860,
              color: "rgba(255, 255, 255, 0.72)",
            }}
          >
            Governance, acceleration zones, and institutional innovation for a faster future.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            color: "rgba(255, 255, 255, 0.6)",
            position: "relative",
            zIndex: 1,
          }}
        >
          <span style={{ letterSpacing: "0.4em", textTransform: "uppercase" }}>trey.world</span>
          <span style={{ color: "#F5A25A", fontWeight: 600 }}>Open Channel</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
