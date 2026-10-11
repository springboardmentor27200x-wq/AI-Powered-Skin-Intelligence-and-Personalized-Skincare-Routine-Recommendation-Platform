import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { scanFaceImage, applyScanResults } from "../services/api";

export default function FaceSkinScanner() {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [appliedMsg, setAppliedMsg] = useState("");
  const [applying, setApplying] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError("");
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("MediaDevices API not supported in this browser");
      }

      let stream;
      try {
        // Try user-facing camera first
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: false,
        });
      } catch (e1) {
        // Fallback to basic video without constraints (laptop webcams, virtual cams)
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      setImagePreview(null);
      setScanResult(null);
      setAppliedMsg("");
    } catch (err) {
      console.warn("Camera error:", err);
      const isBlocked = err.name === "NotAllowedError" || err.name === "PermissionDeniedError";
      const msg = isBlocked
        ? "🔒 Camera permission was denied in your browser. Click the lock/camera icon in your address bar to allow camera access, or upload a photo / use the demo face below!"
        : "📷 No webcam detected or camera is in use by another app. You can click 'Upload Photo' or 'Use Demo Face' below to test the AI scanner!";
      setCameraError(msg);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    stopCamera();
    setImagePreview(dataUrl);
    analyzeImage(dataUrl);
  };

  const handleUseDemoFace = () => {
    stopCamera();
    setCameraError("");
    const canvas = document.createElement("canvas");
    canvas.width = 480;
    canvas.height = 560;
    const ctx = canvas.getContext("2d");

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 480, 560);
    bg.addColorStop(0, "#e2e8f0");
    bg.addColorStop(1, "#cbd5e1");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 480, 560);

    // Face oval
    ctx.fillStyle = "#f3c7a6";
    ctx.beginPath();
    ctx.ellipse(240, 260, 140, 180, 0, 0, Math.PI * 2);
    ctx.fill();

    // Forehead highlight
    ctx.fillStyle = "#ebd0b5";
    ctx.beginPath();
    ctx.ellipse(240, 180, 110, 60, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyebrows
    ctx.fillStyle = "#5c4033";
    ctx.fillRect(170, 195, 45, 6);
    ctx.fillRect(265, 195, 45, 6);

    // Eyes
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(190, 220, 22, 12, 0, 0, Math.PI * 2);
    ctx.ellipse(290, 220, 22, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3b2f2f";
    ctx.beginPath();
    ctx.arc(190, 220, 9, 0, Math.PI * 2);
    ctx.arc(290, 220, 9, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = "#e0b08b";
    ctx.beginPath();
    ctx.moveTo(240, 230);
    ctx.lineTo(230, 290);
    ctx.lineTo(250, 290);
    ctx.closePath();
    ctx.fill();

    // Lips
    ctx.fillStyle = "#d87d7b";
    ctx.beginPath();
    ctx.ellipse(240, 340, 42, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Redness on cheeks
    ctx.fillStyle = "rgba(225, 90, 90, 0.22)";
    ctx.beginPath();
    ctx.ellipse(180, 290, 35, 25, 0, 0, Math.PI * 2);
    ctx.ellipse(300, 290, 35, 25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dark spots
    ctx.fillStyle = "rgba(110, 70, 50, 0.4)";
    ctx.beginPath();
    ctx.arc(210, 270, 5, 0, Math.PI * 2);
    ctx.arc(280, 310, 6, 0, Math.PI * 2);
    ctx.fill();

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setImagePreview(dataUrl);
    analyzeImage(dataUrl);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopCamera();
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setImagePreview(dataUrl);
      analyzeImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async (dataUrl) => {
    setScanning(true);
    setScanResult(null);
    setAppliedMsg("");
    setSelectedMarker(null);
    try {
      const res = await scanFaceImage(dataUrl);
      setScanResult(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to analyze image. Please try again with clear lighting.");
    } finally {
      setScanning(false);
    }
  };

  const handleApplyResults = async () => {
    if (!scanResult) return;
    setApplying(true);
    try {
      const concernNames = scanResult.detected_concerns
        .map((c) => c.concern)
        .filter((c) => c !== "Balanced Skin Condition");

      await applyScanResults({
        detected_concerns: concernNames,
        skin_score: scanResult.overall_skin_score,
      });
      setAppliedMsg("✅ AI Scan insights applied! Your Skin Profile & Routine have been automatically updated.");
    } catch (err) {
      alert("Failed to apply results to profile.");
    } finally {
      setApplying(false);
    }
  };

  const scoreColor = (score) => {
    if (score >= 75) return "#10b981";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ marginBottom: 24, textAlign: "center" }}>
        <p className="eyebrow">AI Face Vision Diagnostics</p>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 800, margin: "6px 0 10px", color: "#1e293b" }}>
          📸 AI Camera Skin Scanner
        </h1>
        <p style={{ color: "#64748b", maxWidth: 640, margin: "0 auto", fontSize: "1rem" }}>
          Use your live camera or upload a face selfie to detect dark spots, active blemishes, redness, fine lines, and texture problems using computer vision.
        </p>
      </div>

      {cameraError && (
        <div className="alert alert-error" style={{ marginBottom: 20, textAlign: "center" }}>
          {cameraError}
        </div>
      )}

      {/* Main Scanner Section */}
      <div style={{ display: "grid", gridTemplateColumns: scanResult ? "1fr 1fr" : "1fr", gap: 28 }}>
        
        {/* Left: Camera Feed / Image View */}
        <div className="card" style={{ padding: 24, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
          
          {/* Active Camera View */}
          {cameraActive && (
            <div style={{ position: "relative", width: "100%", maxWidth: 460, borderRadius: 16, overflow: "hidden", background: "#0f172a" }}>
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                style={{ width: "100%", height: "auto", display: "block", transform: "scaleX(-1)" }}
              />
              {/* Face Guide Oval */}
              <div style={{
                position: "absolute", top: "12%", left: "20%", right: "20%", bottom: "12%",
                border: "2px dashed rgba(255, 255, 255, 0.7)",
                borderRadius: "50%",
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.35)",
                pointerEvents: "none",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <span style={{ color: "white", fontSize: "0.8rem", background: "rgba(0,0,0,0.6)", padding: "4px 10px", borderRadius: 12 }}>
                  Align Face Inside Oval
                </span>
              </div>
              {/* Scanning Laser Animation */}
              <div className="scan-laser" />
            </div>
          )}

          {/* Captured Image Preview with Spot Markers */}
          {!cameraActive && imagePreview && (
            <div style={{ position: "relative", width: "100%", maxWidth: 460, borderRadius: 16, overflow: "hidden", border: "2px solid #e2e8f0" }}>
              <img
                src={imagePreview}
                alt="Captured Face"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
              
              {/* Overlay Spot Markers */}
              {scanResult?.spot_markers?.map((marker, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedMarker(marker)}
                  style={{
                    position: "absolute",
                    left: `${marker.x}%`,
                    top: `${marker.y}%`,
                    transform: "translate(-50%, -50%)",
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: marker.type === "dark_spot" ? "rgba(146, 64, 14, 0.85)" : "rgba(239, 68, 68, 0.85)",
                    border: "2px solid white",
                    boxShadow: "0 0 10px rgba(0,0,0,0.5)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    animation: "pulse 1.8s infinite",
                    zIndex: 10,
                  }}
                  title={marker.label}
                >
                  {marker.type === "dark_spot" ? "●" : "!"}
                </div>
              ))}

              {/* Selected Marker Popup */}
              {selectedMarker && (
                <div style={{
                  position: "absolute",
                  bottom: 12,
                  left: 12,
                  right: 12,
                  background: "rgba(15, 23, 42, 0.9)",
                  color: "white",
                  padding: "10px 14px",
                  borderRadius: 10,
                  fontSize: "0.85rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  zIndex: 20,
                }}>
                  <div>
                    <strong>{selectedMarker.label}</strong>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                      Target Coordinates: X {selectedMarker.x}%, Y {selectedMarker.y}%
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMarker(null)}
                    style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "1.1rem" }}
                  >✕</button>
                </div>
              )}
            </div>
          )}

          {/* Initial Placeholder state */}
          {!cameraActive && !imagePreview && (
            <div style={{
              width: "100%", maxWidth: 460, height: 280,
              background: "#f8fafc", borderRadius: 16, border: "2px dashed #cbd5e1",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              color: "#64748b", padding: 20,
            }}>
              <div style={{ fontSize: "3.5rem", marginBottom: 12 }}>📷</div>
              <p style={{ margin: 0, fontWeight: 600 }}>Enable Live Camera or Upload a Face Selfie</p>
              <span style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: 4 }}>
                Clear facial lighting without sunglasses produces best results
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap", justifyContent: "center" }}>
            {cameraActive ? (
              <>
                <button
                  onClick={capturePhoto}
                  style={{
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    color: "white", border: "none", padding: "12px 28px", borderRadius: 12,
                    fontWeight: 700, fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 8
                  }}
                >
                  📸 Capture & Scan Face
                </button>
                <button
                  onClick={stopCamera}
                  style={{
                    background: "#f1f5f9", color: "#475569", border: "none", padding: "12px 20px", borderRadius: 12,
                    fontWeight: 600, cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={startCamera}
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                    color: "white", border: "none", padding: "12px 24px", borderRadius: 12,
                    fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 8
                  }}
                >
                  📹 Start Live Camera
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: "#f8fafc", color: "#334155", border: "2px solid #cbd5e1", padding: "12px 20px", borderRadius: 12,
                    fontWeight: 600, fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 8
                  }}
                >
                  📁 Upload Photo
                </button>
                <button
                  onClick={handleUseDemoFace}
                  style={{
                    background: "linear-gradient(135deg, #0284c7, #0369a1)", color: "white", border: "none", padding: "12px 20px", borderRadius: 12,
                    fontWeight: 600, fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 8
                  }}
                  title="Test the AI Face Scanner immediately without a camera"
                >
                  🖼️ Try Demo Face
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
              </>
            )}
          </div>

          {scanning && (
            <div style={{ marginTop: 20, color: "#7c3aed", fontWeight: 600 }}>
              ⏳ Analyzing skin pigments, erythema redness, and texture edge maps...
            </div>
          )}
        </div>

        {/* Right: Analysis Report */}
        {scanResult && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            
            {/* Overall Score Card */}
            <div className="card" style={{
              background: `linear-gradient(135deg, ${scoreColor(scanResult.overall_skin_score)}, #1e293b)`,
              color: "white",
              padding: 24,
              borderRadius: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <span style={{ fontSize: "0.8rem", letterSpacing: 1.5, textTransform: "uppercase", opacity: 0.9, fontWeight: 700 }}>
                  AI Visual Skin Health Score
                </span>
                <h2 style={{ fontSize: "2.8rem", margin: "4px 0 0", color: "white", fontWeight: 800 }}>
                  {scanResult.overall_skin_score} <span style={{ fontSize: "1.2rem", fontWeight: 400 }}>/ 100</span>
                </h2>
                <div style={{ fontSize: "0.9rem", marginTop: 4, opacity: 0.95 }}>
                  Status: <strong>{scanResult.skin_health_rating}</strong>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ background: "rgba(255,255,255,0.2)", padding: "6px 14px", borderRadius: 20, fontSize: "0.85rem", fontWeight: 600 }}>
                  {scanResult.spot_markers?.length || 0} Target Spots Found
                </span>
              </div>
            </div>

            {/* Concerns Metrics Breakdown */}
            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>
                🔍 Computer Vision Concern Meters
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { label: "🟤 Dark Spots & Pigmentation", value: scanResult.metrics?.dark_spots_severity || 0, color: "#92400e" },
                  { label: "🔴 Acne & Blemishes", value: scanResult.metrics?.acne_blemishes_severity || 0, color: "#ef4444" },
                  { label: "🟡 Redness & Flushing", value: scanResult.metrics?.redness_sensitivity_severity || 0, color: "#f59e0b" },
                  { label: "🟣 Fine Lines & Texture", value: scanResult.metrics?.wrinkles_texture_severity || 0, color: "#8b5cf6" },
                  { label: "🔵 Sebum & Oiliness", value: scanResult.metrics?.oiliness_sebum_severity || 0, color: "#06b6d4" },
                ].map((m) => (
                  <div key={m.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: "#334155" }}>{m.label}</span>
                      <strong style={{ color: m.color }}>{m.value}%</strong>
                    </div>
                    <div style={{ width: "100%", height: 8, background: "#f1f5f9", borderRadius: 10, overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(100, m.value)}%`, height: "100%", background: m.color, borderRadius: 10, transition: "width 0.8s" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detected Concerns Details */}
            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ margin: "0 0 14px", fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>
                ⚠️ Active Problem Areas Detected
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {scanResult.detected_concerns?.map((c, i) => (
                  <div key={i} style={{ background: "#f8fafc", padding: 14, borderRadius: 12, borderLeft: "4px solid #7c3aed" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h4 style={{ margin: 0, color: "#1e293b", fontSize: "0.95rem" }}>{c.concern}</h4>
                      <span style={{
                        fontSize: "0.75rem", fontWeight: 700, padding: "3px 10px", borderRadius: 14,
                        background: c.level === "High" ? "#fee2e2" : c.level === "Moderate" ? "#fef3c7" : "#d1fae5",
                        color: c.level === "High" ? "#991b1b" : c.level === "Moderate" ? "#92400e" : "#065f46"
                      }}>
                        {c.level}
                      </span>
                    </div>
                    <p style={{ margin: "4px 0 8px", color: "#64748b", fontSize: "0.82rem" }}>{c.description}</p>
                    {c.recommended_actives && (
                      <div style={{ fontSize: "0.8rem" }}>
                        <span style={{ fontWeight: 600, color: "#7c3aed" }}>Active Rx: </span>
                        <span style={{ color: "#334155" }}>{c.recommended_actives.join(", ")}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Actives & Next Steps */}
            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>
                🧪 Recommended Active Ingredients
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
                {scanResult.recommended_ingredients?.map((ing) => (
                  <span key={ing} style={{ background: "#ede9fe", color: "#6d28d9", padding: "6px 14px", borderRadius: 20, fontSize: "0.85rem", fontWeight: 600 }}>
                    ✨ {ing}
                  </span>
                ))}
              </div>

              {appliedMsg ? (
                <div style={{ background: "#d1fae5", color: "#065f46", padding: "12px 16px", borderRadius: 10, fontSize: "0.9rem", fontWeight: 600 }}>
                  {appliedMsg}
                </div>
              ) : (
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    onClick={handleApplyResults}
                    disabled={applying}
                    style={{
                      flex: 1,
                      background: "linear-gradient(135deg, #10b981, #059669)",
                      color: "white", border: "none", padding: "12px", borderRadius: 10,
                      fontWeight: 700, fontSize: "0.95rem", cursor: "pointer"
                    }}
                  >
                    {applying ? "Applying..." : "💾 Apply Insights to My Routine & Profile"}
                  </button>
                  <Link
                    to="/routine"
                    className="secondary"
                    style={{ padding: "12px 18px", textDecoration: "none", borderRadius: 10, textAlign: "center" }}
                  >
                    View Routine →
                  </Link>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      <style>{`
        .scan-laser {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: #10b981;
          box-shadow: 0 0 14px 4px #10b981;
          animation: scanMove 2.5s ease-in-out infinite;
        }
        @keyframes scanMove {
          0% { top: 0%; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.25); }
          100% { transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </div>
  );
}
