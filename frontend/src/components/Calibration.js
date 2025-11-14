// src/components/Calibration.js
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Calibration.css";

const Calibration = () => {
  const totalClicks = 5; // clicks needed per dot
  const dotPositions = [
    { top: "15%", left: "10%" },
    { top: "15%", left: "48%" },
    { top: "15%", left: "87%" },
    { top: "48%", left: "10%" },
    { top: "48%", left: "48%" },
    { top: "48%", left: "87%" },
    { top: "80%", left: "10%" },
    { top: "80%", left: "48%" },
    { top: "80%", left: "87%" },
  ];

  const [clickCounts, setClickCounts] = useState(
    new Array(dotPositions.length).fill(0)
  );
  const navigate = useNavigate();
  const { state } = useLocation();
  const persisted = (() => {
  try {
    const raw = sessionStorage.getItem("viva_preview");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
})();
  const kind = state?.kind ?? persisted?.kind ?? "";
const src  = state?.src  ?? persisted?.src  ?? "";
const name = state?.name ?? persisted?.name ?? "";
const file = state?.file ?? null;


  const handleDotClick = (index) => {
    setClickCounts((prev) => {
      const newCounts = [...prev];
      if (newCounts[index] < totalClicks) {
        newCounts[index] += 1;
      }
      return newCounts;
    });
  };

  // Automatically navigate when all dots are calibrated
  useEffect(() => {
    const allCalibrated = clickCounts.every((count) => count >= totalClicks);
    if (allCalibrated) {
      setTimeout(() => {
        // pass the same state along to ActiveModeBar
        navigate("/activemode", { state: { kind, src, name, file } });
      }, 800);
    }
  }, [clickCounts, navigate, kind, src, name, file]); // include file & name to satisfy eslint

  return (
    <div className="calibration-container">
      {/* background area: either image (for uploaded image) OR iframe (for url) */}
      <div className="background-overlay">
        {kind === "image" && src && (
          <div
            className="background-image"
            style={{
              backgroundImage: `url(${src})`,
            }}
          />
        )}

        {kind === "url" && src && (
          <iframe
            className="background-iframe"
            src={src}
            title={name || "URL Preview"}
            sandbox="" /* optional: remove sandbox if you want full interaction */
          />
        )}

        {/* purple tint overlay sits above the background but below dots/text */}
        <div className="purple-overlay" />
      </div>

      <h2 className="calibration-title">Instructions Text</h2>

      {dotPositions.map((pos, index) => (
        <div
          key={index}
          className={`calibration-dot ${
            clickCounts[index] >= totalClicks ? "calibrated" : ""
          }`}
          style={{ top: pos.top, left: pos.left }}
          onClick={() => handleDotClick(index)}
        >
          <span className="dot-count">
            {clickCounts[index] >= totalClicks
              ? "✔"
              : clickCounts[index] > 0
              ? clickCounts[index]
              : ""}
          </span>
        </div>
      ))}
    </div>
  );
};

export default Calibration;
