import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#070708",
        }}
      >
        <div
          style={{
            width: 360,
            height: 360,
            borderRadius: "50%",
            background: "#1a1a1a",
            border: "12px solid #2a2a2a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#f5e6c8",
            fontSize: 120,
            fontWeight: 800,
          }}
        >
          20
        </div>
      </div>
    ),
    size,
  );
}
