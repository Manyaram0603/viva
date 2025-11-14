import React, { useState } from "react";
import { useLocation, useNavigate  } from "react-router-dom";
import "./preview.css";

export default function Preview() {
  const [collapsed, setCollapsed] = useState(false);
  const { state } = useLocation(); // { kind: 'image'|'url', src: string }
  const getPersistedPreview = () => {
  try {
    const raw = sessionStorage.getItem("viva_preview");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const persisted = getPersistedPreview();
  const navigate = useNavigate();
  const kind = state?.kind ?? persisted?.kind ?? "";
const src  = state?.src  ?? persisted?.src  ?? "";
const name = state?.name ?? persisted?.name ?? "";
const file = state?.file ?? null;
   const handleContinue = () => {
    navigate("/vivasection", {
      state: {
        kind,
        src,
        name,
        file,
      },
    });
  };
  

  return (
    <div className="preview-page">
      <div className={`preview-frame ${collapsed ? "collapsed" : ""}`}>
        {/* Header */}
        <header className="preview-topbar">
          <div className="pv-brand">Viva</div>

          <div className="pv-middle">
            <div className="pv-pill">Check the Preview&nbsp;before calibration</div>
            <button
  className="pv-continue"
  type="button"
  onClick={handleContinue}  // ✅ redirect to VivaSection.js
>
  Continue
</button>
          </div>

          <button className="pv-foldTab" onClick={() => setCollapsed(true)} aria-label="Collapse toolbar" />
        </header>

        <button className="pv-foldTabFloating" onClick={() => setCollapsed(false)} aria-label="Expand toolbar" />

        {/* Content area fits screen; adjusts when header is folded */}
        <main className="preview-stage">
          {kind === "image" && src && (
            <img className="pv-full" src={src} alt="Preview" />
          )}
          {kind === "url" && src && (
            <iframe className="pv-full" src={src} title="URL Preview" />
          )}
          {!src && (
            <div className="pv-placeholder">No preview data. Go back and add an image or URL.</div>
          )}
        </main>
      </div>
    </div>
  );
}
