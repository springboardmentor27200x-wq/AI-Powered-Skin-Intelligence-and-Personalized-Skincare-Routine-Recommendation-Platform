import React, { useState, useEffect, useRef } from 'react';
import { api } from './api';

export default function SkinTextureAnalyzer({ onProfileUpdated }) {
  const [captureMode, setCaptureMode] = useState('multi'); // 'multi' | 'single'
  const [currentStep, setCurrentStep] = useState('front'); // 'front' | 'left' | 'right'

  // Multi-angle captured images
  const [angles, setAngles] = useState({
    front: null,
    left: null,
    right: null,
  });

  const [previewUrl, setPreviewUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [activeOverlayTab, setActiveOverlayTab] = useState('original');
  const [history, setHistory] = useState([]);
  const [syncStatus, setSyncStatus] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    loadScanHistory();
    return () => {
      stopCamera();
    };
  }, []);

  const loadScanHistory = async () => {
    try {
      if (typeof api.getTextureHistory === 'function') {
        const pastScans = await api.getTextureHistory(6);
        setHistory(pastScans || []);
      }
    } catch (err) {
      console.warn('Could not load texture history:', err);
    }
  };

  useEffect(() => {
    if (isCameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(err => console.warn('Video play error:', err));
    }
  }, [isCameraActive]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const handleStartCamera = async (targetAngle = null) => {
    setErrorMsg('');
    if (targetAngle) {
      setCurrentStep(targetAngle);
    }
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.warn('Play error:', e));
        }
      }, 50);
    } catch (err) {
      console.error('Camera access error:', err);
      setErrorMsg('Unable to access camera. Please check browser permissions or upload an image file.');
      setIsCameraActive(false);
    }
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const vid = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const vw = vid.videoWidth || 640;
    const vh = vid.videoHeight || 480;
    const minDim = Math.min(vw, vh);
    const sx = (vw - minDim) / 2;
    const sy = (vh - minDim) / 2;

    ctx.drawImage(vid, sx, sy, minDim, minDim, 0, 0, 512, 512);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    if (captureMode === 'multi') {
      const updated = { ...angles, [currentStep]: dataUrl };
      setAngles(updated);
      setPreviewUrl(dataUrl);

      // Auto-switch to next angle or stop camera
      if (currentStep === 'front' && !updated.left) {
        setCurrentStep('left');
      } else if (currentStep === 'left' && !updated.right) {
        setCurrentStep('right');
      } else {
        stopCamera();
      }
    } else {
      setAngles({ front: dataUrl, left: null, right: null });
      setPreviewUrl(dataUrl);
      stopCamera();
    }
  };

  const handleRecaptureAngle = (angleKey) => {
    setCurrentStep(angleKey);
    handleStartCamera(angleKey);
  };

  const handleClearAngle = (angleKey, e) => {
    e.stopPropagation();
    setAngles(prev => ({ ...prev, [angleKey]: null }));
    if (previewUrl === angles[angleKey]) {
      setPreviewUrl('');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setErrorMsg('');
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        if (captureMode === 'multi') {
          setAngles(prev => ({ ...prev, [currentStep]: dataUrl }));
          setPreviewUrl(dataUrl);
          if (currentStep === 'front' && !angles.left) setCurrentStep('left');
          else if (currentStep === 'left' && !angles.right) setCurrentStep('right');
        } else {
          setAngles({ front: dataUrl, left: null, right: null });
          setPreviewUrl(dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunAnalysis = async () => {
    setErrorMsg('');
    setSyncStatus('');
    setIsAnalyzing(true);

    try {
      if (captureMode === 'multi') {
        const frontImg = angles.front || angles.left || angles.right || previewUrl;
        const leftImg = angles.left || frontImg;
        const rightImg = angles.right || frontImg;

        if (!frontImg) {
          setErrorMsg('Please capture at least one angle to begin analysis.');
          setIsAnalyzing(false);
          return;
        }

        const payload = {
          front: frontImg,
          left: leftImg,
          right: rightImg,
        };

        const result = await api.analyzeMultiAngleTexture(payload);
        setAnalysisResult(result);
        setActiveOverlayTab('roughness');
        loadScanHistory();
      } else {
        const singleImg = angles.front || previewUrl;
        if (!singleImg) {
          setErrorMsg('Please upload or capture a photo first.');
          setIsAnalyzing(false);
          return;
        }
        const result = await api.analyzeTextureImage(singleImg);
        setAnalysisResult(result);
        setActiveOverlayTab('roughness');
        loadScanHistory();
      }
    } catch (err) {
      console.error('Skin Analysis error:', err);
      setErrorMsg(err.message || 'Analysis failed. Please check network connection.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSyncProfile = async () => {
    if (!analysisResult?.id) return;
    try {
      setSyncStatus('syncing');
      await api.syncTextureWithProfile(analysisResult.id);
      setSyncStatus('success');
      if (onProfileUpdated) onProfileUpdated();
    } catch (err) {
      setSyncStatus('error');
    }
  };

  const getActiveImageSrc = () => {
    if (!analysisResult) return previewUrl || angles[currentStep] || angles.front;
    if (activeOverlayTab === 'roughness' && analysisResult.overlays?.roughness_heatmap) {
      return analysisResult.overlays.roughness_heatmap;
    }
    if (activeOverlayTab === 'pores' && analysisResult.overlays?.pore_map) {
      return analysisResult.overlays.pore_map;
    }
    if (activeOverlayTab === 'redness' && analysisResult.overlays?.redness_heatmap) {
      return analysisResult.overlays.redness_heatmap;
    }
    return previewUrl || angles[currentStep] || angles.front;
  };

  const getAngleInstructions = () => {
    if (currentStep === 'front') return 'Look directly at camera (Center Front)';
    if (currentStep === 'left') return 'Turn head 45° to your Right (Showing Left Cheek)';
    return 'Turn head 45° to your Left (Showing Right Cheek)';
  };

  const hasAnyImage = Boolean(angles.front || angles.left || angles.right || previewUrl);
  const isAllCaptured = Boolean(angles.front && angles.left && angles.right);

  return (
    <div className="texture-analyzer-container" style={{ animation: 'fadeIn 0.4s ease-out' }}>

      {/* ── TOP HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white/90 backdrop-blur-md rounded-2xl border border-rose-100 shadow-sm mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 rounded-full">
              3-Angle Vision Intelligence
            </span>
            <span className="text-xs text-slate-400">Front • Left Turn • Right Turn</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 m-0">Skin Texture & Clinical Vision Scanner</h1>
          <p className="text-sm text-slate-500 m-0 mt-1">
            Capture 3 facial angles to identify skin texture, micro-pore density, sebum shine, and observed dermatological findings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Top Run Analysis CTA */}
          {hasAnyImage && (
            <button
              type="button"
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              style={{
                background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
                color: '#FFFFFF',
                boxShadow: '0 4px 14px rgba(225, 29, 72, 0.35)',
              }}
              className="px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 hover:opacity-90 active:scale-95 cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <span className="animate-spin">⚙</span>
                  <span>Analyzing Skin...</span>
                </>
              ) : (
                <>
                  <span>✦</span>
                  <span>Analyze Skin Now</span>
                </>
              )}
            </button>
          )}

          {/* Scan Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => { setCaptureMode('multi'); setCurrentStep('front'); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${captureMode === 'multi' ? 'bg-white shadow-sm text-rose-700' : 'text-slate-600'}`}
            >
              3-Angle Scan
            </button>
            <button
              type="button"
              onClick={() => { setCaptureMode('single'); setCurrentStep('front'); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${captureMode === 'single' ? 'bg-white shadow-sm text-rose-700' : 'text-slate-600'}`}
            >
              Single Photo
            </button>
          </div>

          {analysisResult && (
            <button
              type="button"
              onClick={handleSyncProfile}
              disabled={syncStatus === 'syncing' || syncStatus === 'success'}
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#FFFFFF',
              }}
              className="px-4 py-2 text-xs font-semibold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {syncStatus === 'syncing' && '⟳ Syncing...'}
              {syncStatus === 'success' && '✓ Profile Updated'}
              {!syncStatus && '✦ Sync Profile'}
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 mb-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-xs font-bold text-red-500 hover:text-red-700 cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* ── 3-ANGLE PROGRESS STEPPER ── */}
      {captureMode === 'multi' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {[
              { key: 'front', label: '1. Front View', icon: '👤', desc: 'T-Zone & Forehead' },
              { key: 'left', label: '2. Left Turn', icon: '◀️', desc: 'Left Cheek & Jawline' },
              { key: 'right', label: '3. Right Turn', icon: '▶️', desc: 'Right Cheek & Temple' },
            ].map(step => (
              <div
                key={step.key}
                onClick={() => {
                  setCurrentStep(step.key);
                  if (angles[step.key]) setPreviewUrl(angles[step.key]);
                }}
                className={`flex-1 p-3 rounded-xl border transition-all cursor-pointer relative group flex items-center gap-3 ${currentStep === step.key
                  ? 'border-rose-400 bg-rose-50/50 shadow-sm ring-2 ring-rose-200'
                  : angles[step.key]
                    ? 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-300'
                    : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                  }`}
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-200 shrink-0 flex items-center justify-center border border-slate-200 relative">
                  {angles[step.key] ? (
                    <img src={angles[step.key]} alt={step.label} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl">{step.icon}</span>
                  )}
                  {angles[step.key] && (
                    <span className="absolute bottom-0.5 right-0.5 bg-emerald-500 text-white rounded-full text-[9px] w-3.5 h-3.5 flex items-center justify-center font-bold">
                      ✓
                    </span>
                  )}
                </div>

                {/* Info & Re-capture Action */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{step.label}</span>
                    {angles[step.key] ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleRecaptureAngle(step.key); }}
                          className="text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded border border-rose-200 transition-colors cursor-pointer"
                          title="Retake this angle"
                        >
                          🔄 Retake
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleClearAngle(step.key, e)}
                          className="text-[10px] text-slate-400 hover:text-red-500 p-0.5 cursor-pointer"
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] font-semibold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">
                        {currentStep === step.key ? 'Active' : 'Pending'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 m-0 truncate mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MAIN WORKSPACE GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── LEFT COLUMN: CAMERA / CAPTURE VIEW ── */}
        <div className="lg:col-span-5 flex flex-col gap-5">

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-pulse"></span>
                {captureMode === 'multi' ? `Current View: ${currentStep.toUpperCase()} ANGLE` : 'Visual Diagnostic Lens'}
              </span>
              {captureMode === 'multi' && (
                <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  {getAngleInstructions()}
                </span>
              )}
            </div>

            {/* Video or Image Canvas */}
            <div
              className="relative w-full aspect-square bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200 shadow-inner group"
              style={{ minHeight: 320 }}
            >
              {isCameraActive ? (
                <div className="w-full h-full relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    onLoadedMetadata={() => {
                      if (videoRef.current) {
                        videoRef.current.play().catch(e => console.warn('Play error:', e));
                      }
                    }}
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  <div className="absolute inset-0 border-2 border-dashed border-rose-400/60 m-6 rounded-2xl pointer-events-none flex flex-col items-center justify-between p-4">
                    <span className="text-xs font-bold text-white bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                      {getAngleInstructions()}
                    </span>
                    <span className="text-[11px] text-white/80 bg-black/50 px-2 py-0.5 rounded">
                      Keep face centered in frame
                    </span>
                  </div>
                </div>
              ) : getActiveImageSrc() ? (
                <div className="w-full h-full relative">
                  <img
                    src={getActiveImageSrc()}
                    alt="Skin preview"
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                  {analysisResult && activeOverlayTab !== 'original' && (
                    <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-white/20 shadow-md">
                      {activeOverlayTab === 'roughness' && '🔥 Texture & Gradient Heatmap'}
                      {activeOverlayTab === 'pores' && '🎯 Micro-Pore Coordinate Map'}
                      {activeOverlayTab === 'redness' && '❤️ Erythema / Redness Thermal'}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
                  <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-2xl text-rose-400 mb-3 shadow-sm">
                    📷
                  </div>
                  <p className="text-sm font-medium text-slate-700 m-0 mb-1">Camera Ready</p>
                  <p className="text-xs text-slate-400 m-0 max-w-xs">
                    Click Live Camera below to capture your Front, Left, and Right turns.
                  </p>
                </div>
              )}
            </div>

            {/* Diagnostic Overlay Selector */}
            {analysisResult && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Overlay Visual Filter:</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { key: 'original', label: 'Photo' },
                    { key: 'roughness', label: 'Roughness' },
                    { key: 'pores', label: 'Pore Map' },
                    { key: 'redness', label: 'Redness' },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveOverlayTab(tab.key)}
                      className={`px-2 py-1.5 text-xs font-semibold rounded-lg transition-all text-center cursor-pointer ${activeOverlayTab === tab.key
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Camera / Action Toolbar */}
            <div className="mt-4 flex items-center gap-2">
              {isCameraActive ? (
                <>
                  <button
                    type="button"
                    onClick={handleCapturePhoto}
                    style={{
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      color: '#FFFFFF',
                    }}
                    className="flex-1 py-3 text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:opacity-90"
                  >
                    <span>📸</span> Capture {currentStep.toUpperCase()} Angle
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-4 py-3 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleStartCamera(currentStep)}
                    className="flex-1 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <span>📹</span> {angles[currentStep] ? `Retake ${currentStep.toUpperCase()}` : `Open Camera (${currentStep.toUpperCase()})`}
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-2.5 px-4 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>📁</span> Upload
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </>
              )}
            </div>

            {/* ── BIG PROMINENT ANALYZE SKIN BUTTON ON LEFT CARD ── */}
            {hasAnyImage && !isCameraActive && (
              <button
                type="button"
                onClick={handleRunAnalysis}
                disabled={isAnalyzing}
                style={{
                  background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 18px rgba(225, 29, 72, 0.4)',
                }}
                className="w-full mt-4 py-3.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 hover:opacity-90 active:scale-98 cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <span className="animate-spin text-base">⚙</span>
                    <span>Analyzing 3 Angles & Synthesizing Observed Findings...</span>
                  </>
                ) : (
                  <>
                    <span className="text-base">✦</span>
                    <span>{isAllCaptured ? 'Run AI 3-Angle Skin Diagnostics' : 'Analyze Captured Angles Now'}</span>
                  </>
                )}
              </button>
            )}
          </div>

        </div>

        {/* ── RIGHT COLUMN: CLINICAL OBSERVATIONS & DIAGNOSTICS ── */}
        <div className="lg:col-span-7 flex flex-col gap-5">

          {analysisResult ? (
            <>
              {/* Overall Score & Type Banner */}
              <div className="bg-white rounded-2xl border border-rose-100 p-6 shadow-sm relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200 inline-block mb-2">
                      {analysisResult.texture_type}
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 m-0">
                      Skin Texture Diagnostics & Observations
                    </h2>
                    <p className="text-xs text-slate-500 m-0 mt-1 max-w-md">
                      {analysisResult.analysis_summary}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-start md:self-center bg-rose-50/80 border border-rose-100 px-5 py-3.5 rounded-2xl">
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Health Index</div>
                      <div className="text-xs text-slate-500">Overall Score</div>
                    </div>
                    <div className="text-3xl font-extrabold text-rose-600 tracking-tight">
                      {analysisResult.overall_texture_score}
                      <span className="text-sm font-normal text-rose-400">/100</span>
                    </div>
                  </div>
                </div>

                {analysisResult.primary_concern && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-700">
                    <span className="font-bold text-slate-900">Primary Observed Target:</span>
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                      ⚠ {analysisResult.primary_concern}
                    </span>
                  </div>
                )}
              </div>

              {/* ── CLINICAL OBSERVATIONS LIST (What was observed on the skin) ── */}
              {analysisResult.diagnostics?.observations?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider m-0 flex items-center gap-2">
                      <span>🔍 Observed Skin Findings & Topography</span>
                    </h3>
                    <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                      {analysisResult.diagnostics.observations.length} Zones Analyzed
                    </span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {analysisResult.diagnostics.observations.map((obs, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 hover:bg-white hover:border-rose-200 hover:shadow-xs transition-all"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{obs.icon}</span>
                            <strong className="text-xs text-slate-900 font-bold">{obs.zone}</strong>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${obs.severity === 'High'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : obs.severity === 'Moderate'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                          >
                            {obs.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 m-0 leading-relaxed pl-6">
                          {obs.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5-Factor Metric Breakdown */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center justify-between">
                  <span>Micro-Texture Metric Indices</span>
                  <span className="text-[10px] text-slate-400">0 to 100 Scale</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-slate-700">✨ Skin Smoothness</span>
                      <span className="text-xs font-extrabold text-emerald-600">{analysisResult.smoothness_score}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full" style={{ width: `${analysisResult.smoothness_score}%` }}></div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-slate-700">🎯 Pore Visibility</span>
                      <span className="text-xs font-extrabold text-indigo-600">{analysisResult.pore_visibility_score}/100</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-400 to-indigo-600 h-full rounded-full" style={{ width: `${analysisResult.pore_visibility_score}%` }}></div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-slate-700">💧 Oiliness & Shine</span>
                      <span className="text-xs font-extrabold text-cyan-600">{analysisResult.oiliness_shine_score}/100</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full" style={{ width: `${analysisResult.oiliness_shine_score}%` }}></div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-slate-700">🩸 Redness / Erythema</span>
                      <span className="text-xs font-extrabold text-rose-600">{analysisResult.redness_erythema_score}/100</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-rose-400 to-rose-600 h-full rounded-full" style={{ width: `${analysisResult.redness_erythema_score}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>



            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm flex flex-col items-center justify-center text-center h-full min-h-[420px]">
              <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-2xl text-rose-500 mb-4 shadow-sm animate-pulse">
                ✦
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">
                {isAllCaptured ? '🎉 All 3 Angles Captured!' : 'Facial Angles Ready'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mb-6">
                {isAllCaptured
                  ? 'Your Front, Left, and Right angles are successfully locked in. Click the button below to generate your multi-zone skin texture diagnostics and observed findings.'
                  : 'Capture your photos or click below to analyze the captured angles now.'}
              </p>

              {hasAnyImage && (
                <button
                  type="button"
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing}
                  style={{
                    background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
                    color: '#FFFFFF',
                    boxShadow: '0 6px 20px rgba(225, 29, 72, 0.45)',
                  }}
                  className="px-8 py-4 text-sm font-extrabold rounded-2xl shadow-xl transition-all flex items-center gap-2 hover:opacity-90 active:scale-95 cursor-pointer"
                >
                  {isAnalyzing ? (
                    <>
                      <span className="animate-spin text-base">⚙</span>
                      <span>Processing Vision Diagnostics...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-base">✦</span>
                      <span>Run AI 3-Angle Diagnostics Now</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

        </div>

      </div>

      {/* ── PAST SCANS HISTORY ── */}
      {history.length > 0 && (
        <div className="mt-8 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 m-0">Recent Texture Scans & Progress History</h3>
            <span className="text-xs text-slate-400">{history.length} scans logged</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {history.map((scan, i) => (
              <div
                key={scan.id || i}
                onClick={() => setAnalysisResult(scan)}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-rose-200 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">{scan.texture_type}</span>
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                    {scan.overall_texture_score}/100
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 mb-2">
                  <span>Smoothness: <strong>{scan.smoothness_score}%</strong></span>
                  <span>Pores: <strong>{scan.pore_visibility_score}%</strong></span>
                </div>
                <div className="text-[10px] text-slate-400">
                  {scan.created_at ? new Date(scan.created_at).toLocaleDateString() : 'Previous Scan'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
