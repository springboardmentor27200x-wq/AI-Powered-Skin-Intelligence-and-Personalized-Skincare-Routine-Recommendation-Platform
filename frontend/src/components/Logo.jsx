import logoImg from "C:/Users/adithraj/.gemini/antigravity/brain/c7c9ea52-5ccf-4bbf-8771-9df71db4b9d0/.user_uploaded/media_1791389955903_9705277c.jpg";

export default function Logo({
  size = 42,
  style = {},
  showText = false,
  textSubtitle = "Science. Nature. You.",
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, ...style }}>
      <img
        src={logoImg}
        alt="AI Skin Intelligence Logo"
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          border: "2px solid #a7f3d0",
          boxShadow: "0 3px 10px rgba(27,67,50,0.12)",
          flexShrink: 0,
          background: "white",
        }}
      />
      {showText && (
        <div>
          <div style={{ fontWeight: 750, fontSize: 15, color: "#1b4332", letterSpacing: "-0.2px" }}>
            Skin Intelligence
          </div>
          {textSubtitle && (
            <div style={{ fontSize: 11, color: "#6b7280" }}>{textSubtitle}</div>
          )}
        </div>
      )}
    </div>
  );
}

export { logoImg };
