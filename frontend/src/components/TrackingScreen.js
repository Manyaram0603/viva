// src/components/TrackingScreen.js
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import webgazer from "webgazer";
import html2canvas from "html2canvas";
import "./TrackingScreen.css";

export default function TrackingScreen() {
  const { state: locState } = useLocation();
  const navigate = useNavigate();

  // preview state (from navigation state or sessionStorage fallback)
  const [preview, setPreview] = useState(() => {
    try {
      const s = sessionStorage.getItem("viva_preview");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  // if location state provided, prefer it and also persist it
  useEffect(() => {
    if (locState && (locState.src || locState.kind)) {
      setPreview(locState);
      try { sessionStorage.setItem("viva_preview", JSON.stringify(locState)); } catch {}
    }
    // otherwise the preview from sessionStorage (already loaded) will be used
  }, [locState]);

  // derive quick variables
  const kind = preview?.kind || "image";
  const src = preview?.src || "";
  const name = preview?.name || "";

  // use stroke color from preview, fallback to original default
  const strokeHex = preview?.stroke || "#EE4B3C";

  // helper: hex -> {r,g,b}
  const hexToRgb = (hex) => {
    if (!hex) return { r: 255, g: 23, b: 68 }; // fallback red
    const h = hex.replace("#", "");
    const normalized = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
    const bigint = parseInt(normalized, 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
    };
  };
  const rgb = hexToRgb(strokeHex);
  const rgba = (a = 1) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;

  // ---- tracking refs and logic ----
  const cursorRef = useRef(null);
  const trailCanvasRef = useRef(null);
  const heatmapCanvasRef = useRef(null);
  const videoRef = useRef(null);

  const buffer = useRef([]);
  const lastFixation = useRef(null);

  const [trackingStopped, setTrackingStopped] = useState(false);
  const [hideAll, setHideAll] = useState(false);
  const [fixations, setFixations] = useState([]);

  const trackingStoppedRef = useRef(false);
  const hideAllRef = useRef(false);
  const fadeActiveRef = useRef(true);

  useEffect(() => { trackingStoppedRef.current = trackingStopped; }, [trackingStopped]);
  useEffect(() => { hideAllRef.current = hideAll; }, [hideAll]);

  // apply stroke color to cursor element immediately when preview/stroke changes
  useEffect(() => {
    if (cursorRef.current) {
      cursorRef.current.style.backgroundColor = strokeHex;
      cursorRef.current.style.boxShadow = `0 0 15px ${rgba(0.75)}`;
      cursorRef.current.style.border = `2px solid rgba(255,255,255,0.15)`;
    }
    try { document.documentElement.style.setProperty("--viva-stroke", strokeHex); } catch (e) {}
    try { document.documentElement.style.setProperty("--viva-stroke-rgb", `${rgb.r}, ${rgb.g}, ${rgb.b}`); } catch (e) {}
  }, [strokeHex]); // eslint-disable-line

  useEffect(() => {
    const handleKeys = (e) => {
      if (e.code === "Space") {
        trackingStoppedRef.current = true;
        setTrackingStopped(true);
        fadeActiveRef.current = false;
        try { webgazer.pause(); } catch {}
      }
      if (e.code === "Enter") {
        hideAllRef.current = !hideAllRef.current;
        setHideAll(hideAllRef.current);
        if (hideAllRef.current) {
          fadeActiveRef.current = false;
          try { webgazer.pause(); } catch {}
        } else {
          fadeActiveRef.current = true;
          try { webgazer.resume(); } catch {}
        }
      }
    };
    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, []);

  const handleSaveImage = () => {
    const container = document.querySelector(".tracking-container");
    document.querySelectorAll(".ui-element").forEach((el) => (el.style.opacity = 0));
    html2canvas(container, { scale: 2 }).then((canvas) => {
      const link = document.createElement("a");
      link.download = "eye_tracking_result.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      document.querySelectorAll(".ui-element").forEach((el) => (el.style.opacity = 1));
    });
  };

  const handleFixation = useCallback((x, y, drawLine, drawHeat) => {
    if (trackingStoppedRef.current || hideAllRef.current) return;
    const now = Date.now();
    const small = 50, large = 100;
    if (!lastFixation.current) {
      lastFixation.current = { x, y, start: now };
      drawHeat(x, y);
      return;
    }
    const dist = Math.hypot(x - lastFixation.current.x, y - lastFixation.current.y);
    if (dist < small) return;
    if (dist >= large) {
      const prev = lastFixation.current;
      const dwell = Math.floor((now - prev.start) / 1000);
      setFixations((f) => [...f, { x: prev.x, y: prev.y, time: dwell }]);
      drawLine(prev.x, prev.y, x, y);
      drawHeat(x, y);
      lastFixation.current = { x, y, start: now };
    }
  }, []);

  useEffect(() => {
    // camera preview
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (videoRef.current) videoRef.current.srcObject = stream;
    }).catch(() => {});

    const trailCanvas = trailCanvasRef.current;
    const heatmapCanvas = heatmapCanvasRef.current;
    if (!trailCanvas || !heatmapCanvas) return;

    const trailCtx = trailCanvas.getContext("2d");
    const heatCtx = heatmapCanvas.getContext("2d");

    const resize = () => {
      trailCanvas.width = window.innerWidth;
      trailCanvas.height = window.innerHeight;
      heatmapCanvas.width = window.innerWidth;
      heatmapCanvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const drawLine = (x1, y1, x2, y2) => {
      if (trackingStoppedRef.current || hideAllRef.current) return;
      trailCtx.beginPath();
      trailCtx.moveTo(x1, y1);
      trailCtx.lineTo(x2, y2);
      trailCtx.strokeStyle = rgba(0.95);
      trailCtx.lineWidth = 6;
      trailCtx.lineCap = "round";
      trailCtx.shadowColor = rgba(0.6);
      trailCtx.shadowBlur = 10;
      trailCtx.stroke();
    };

    const drawHeat = (x, y) => {
      if (trackingStoppedRef.current || hideAllRef.current) return;
      const radius = 20;
      const gradient = heatCtx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, rgba(0.6));
      gradient.addColorStop(0.5, rgba(0.3));
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      heatCtx.fillStyle = gradient;
      heatCtx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    };

    // fadeHeatmap: erase (destination-out) small alpha each frame to fade without tinting
    const fadeHeatmap = () => {
      if (!fadeActiveRef.current) return;
      if (trackingStoppedRef.current) return;
      if (hideAllRef.current) return;

      try {
        const prevComp = heatCtx.globalCompositeOperation;
        heatCtx.globalCompositeOperation = "destination-out";
        heatCtx.fillStyle = "rgba(0,0,0,0.02)"; // tiny erase step
        heatCtx.fillRect(0, 0, heatmapCanvas.width, heatmapCanvas.height);
        heatCtx.globalCompositeOperation = prevComp;
      } catch (err) {
        // fallback: gently reduce alpha via globalAlpha if composite op unsupported
        heatCtx.save();
        heatCtx.globalAlpha = 0.02;
        heatCtx.fillStyle = "black";
        heatCtx.fillRect(0, 0, heatmapCanvas.width, heatmapCanvas.height);
        heatCtx.restore();
      }

      requestAnimationFrame(fadeHeatmap);
    };
    requestAnimationFrame(fadeHeatmap);

    // WebGazer
    try {
      webgazer
        .setRegression("ridge")
        .applyKalmanFilter(true)
        .showVideoPreview(false)
        .showPredictionPoints(false)
        .setGazeListener((data) => {
          if (!data) return;
          if (trackingStoppedRef.current || hideAllRef.current) return;
          const { x, y } = data;
          buffer.current.push({ x, y });
          if (buffer.current.length > 8) buffer.current.shift();
          const avgX = buffer.current.reduce((s, p) => s + p.x, 0) / buffer.current.length;
          const avgY = buffer.current.reduce((s, p) => s + p.y, 0) / buffer.current.length;
          if (cursorRef.current && !hideAllRef.current) {
            cursorRef.current.style.left = `${avgX}px`;
            cursorRef.current.style.top = `${avgY}px`;
          }
          handleFixation(avgX, avgY, drawLine, drawHeat);
        })
        .begin();
    } catch (e) { console.warn("webgazer start error", e); }

    return () => {
      try { webgazer.pause(); } catch {}
      window.removeEventListener("resize", resize);
    };
  }, [handleFixation, strokeHex]); // re-run if stroke color changes so canvases use new color

  // formatting helper
  const format = (t) => `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;

  // Render — show bg image OR iframe (URL)
  return (
    <div className="tracking-container" role="main">
      {kind === "image" && src ? (
        <img className="tracking-bg" src={src} alt={name || "Preview"} />
      ) : kind === "url" && src ? (
        <iframe className="tracking-bg-iframe" src={src} title={name || "Preview URL"} />
      ) : null}

      <canvas ref={heatmapCanvasRef} className={`heatmap-canvas ${hideAll ? "invisible" : ""}`} />
      <canvas ref={trailCanvasRef} className={`trail-canvas ${hideAll ? "invisible" : ""}`} />
      <div
        ref={cursorRef}
        className={`eye-cursor ui-element ${hideAll ? "invisible" : ""}`}
        style={{ backgroundColor: strokeHex, boxShadow: `0 0 15px ${rgba(0.75)}` }}
      />
      {!hideAll && fixations.map((f, i) => (
        <div
          key={i}
          className="timer-bubble"
          style={{ top: f.y, left: f.x, backgroundColor: strokeHex }}
        >
          {format(f.time)}
        </div>
      ))}
      <div className={`camera-preview-box ui-element ${hideAll ? "invisible" : ""}`}>
        <video ref={videoRef} autoPlay muted playsInline className="camera-feed" />
      </div>
      <div className={`tracking-text ui-element ${hideAll ? "invisible" : ""}`}>
        {trackingStopped ? "⛔ Tracking Stopped" : "👁️ Eye Tracking Active"}
      </div>
      <button
        className={`recalibrate-btn ui-element ${hideAll ? "invisible" : ""}`}
        onClick={() => navigate("/calibration", { state: { kind, src, name, stroke: strokeHex } })}
        style={{ borderColor: "#fff", color: strokeHex }}
      >
        Recalibrate
      </button>
      <button className="save-image-btn ui-element" onClick={handleSaveImage}>Save Image</button>
    </div>
  );
}