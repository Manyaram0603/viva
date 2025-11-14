// ActiveModeBar.js
import React, { useRef, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ActiveModeBar.css";

export default function ActiveModeBar() {
  const { state } = useLocation();
  const persisted = (() => {
    try {
      const raw = sessionStorage.getItem("viva_preview");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const srcFromState = state?.src || persisted?.src || "";
  const kind = state?.kind || persisted?.kind || "image";
  const nameFromState = state?.name || persisted?.name || "";
  const originalFile = state?.file || null;

  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const iframeRef = useRef(null);

  // local state to allow re-rendering the image src (cache-busting or recreated blob)
  const [liveSrc, setLiveSrc] = useState(srcFromState);
  useEffect(() => setLiveSrc(srcFromState), [srcFromState]);

  // stroke colors
  const strokeColors = [
    { id: "red", hex: "#EE4B3C" },
    { id: "purple", hex: "#6E2BB7" },
    { id: "black", hex: "#222222" },
    { id: "blue", hex: "#2B9BFF" },
    { id: "green", hex: "#19C07A" }
  ];

  // initialize selected stroke from state or persisted preview if available
  const initialStroke = state?.stroke || persisted?.stroke || strokeColors[0].hex;
  const [selectedStroke, setSelectedStroke] = useState(initialStroke);

  // dropdown state + refs for click-outside
  const [pickerOpen, setPickerOpen] = useState(false);
  const pillRef = useRef(null);
  const pickerRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (
        pickerOpen &&
        pickerRef.current &&
        !pickerRef.current.contains(e.target) &&
        pillRef.current &&
        !pillRef.current.contains(e.target)
      ) {
        setPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [pickerOpen]);

  // derive display name
  const computeDisplayName = () => {
    if (nameFromState) return nameFromState;
    if (kind === "url" && srcFromState) {
      try { return new URL(srcFromState).hostname.replace("www.", ""); }
      catch (e) { return srcFromState; }
    }
    return "Uploaded image";
  };
  const displayName = computeDisplayName();

  const handleReload = () => {
    if (kind === "url" && iframeRef.current) {
      try {
        iframeRef.current.contentWindow.location.reload();
      } catch (err) {
        try {
          const base = srcFromState.split("?")[0];
          iframeRef.current.src = `${base}?t=${Date.now()}`;
        } catch (e) {
          console.warn("Reload failed for iframe:", e);
        }
      }
      return;
    }

    if (kind === "image") {
      if (originalFile instanceof File) {
        try {
          if (liveSrc && liveSrc.startsWith("blob:")) {
            try { URL.revokeObjectURL(liveSrc); } catch (e) {}
          }
          const newBlob = URL.createObjectURL(originalFile);
          setLiveSrc(newBlob);
          return;
        } catch (e) {
          console.warn("Could not recreate blob URL:", e);
        }
      }
      if (typeof srcFromState === "string" && /^https?:\/\//.test(srcFromState)) {
        const base = srcFromState.split("?")[0];
        setLiveSrc(`${base}?t=${Date.now()}`);
        return;
      }
      console.warn("Reload not possible: no original File provided and src appears to be blob URL.");
      return;
    }
  };

  const handleRecalibration = () => {
    navigate("/calibration", { state: { kind, src: srcFromState, name: nameFromState, file: originalFile, stroke: selectedStroke } });
  };

  const fileToDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  };

  const handleStart = async () => {
    // Build payload (start with what's available)
    const payload = {
      kind,
      src: liveSrc || srcFromState || "",
      name: nameFromState || "",
      timestamp: Date.now(),
      stroke: selectedStroke // include chosen stroke color
    };

    if (originalFile instanceof File) {
      try {
        const dataUrl = await fileToDataURL(originalFile);
        payload.src = dataUrl; // replace blob: with base64 data URL so it survives reload
        payload.fileStoredAs = "dataURL";
      } catch (err) {
        console.warn("Failed to convert file to data URL:", err);
      }
    }

    // Persist preview payload to sessionStorage (so other pages can read it)
    try {
      sessionStorage.setItem("viva_preview", JSON.stringify(payload));
    } catch (e) {
      console.warn("Could not persist preview to sessionStorage", e);
    }

    // Navigate to tracking route and pass payload in state too
    navigate("/trackingScreen", { state: payload });
  };

  const onSelectColor = (hex) => {
    setSelectedStroke(hex);
    setPickerOpen(false);

    // persist chosen stroke immediately so other pages (or refresh) see it
    try {
      const curRaw = sessionStorage.getItem("viva_preview");
      const cur = curRaw ? JSON.parse(curRaw) : {};
      cur.stroke = hex;
      sessionStorage.setItem("viva_preview", JSON.stringify(cur));
    } catch (e) {
      // ignore persistence failures
    }
  };

  return (
    <div className="amb-page">
      <div className={`amb-frame ${collapsed ? "collapsed" : ""}`}>
        <header className="amb-topbar">
          <div className="amb-brand">Viva</div>

          <div className="amb-middle">
            <div className="amb-urlPill">
              <span className="amb-urlIcon" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#515151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1"/>
                  <path d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 1 1-7-7l1-1"/>
                </svg>
              </span>

              <input
                className="amb-urlField"
                value={displayName}
                readOnly
                placeholder="Uploaded image"
                aria-label="Preview source"
              />
            </div>

            <button className="amb-btn amb-reload" onClick={handleReload}>Reload</button>
            <button className="amb-btn amb-recal" onClick={handleRecalibration}>Recalibration</button>

            {/* stroke pill */}
            <div className="amb-stroke" ref={pillRef}>
              <div
                className="amb-strokePill"
                role="button"
                tabIndex={0}
                onClick={() => setPickerOpen((s) => !s)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setPickerOpen((s) => !s); }}
                aria-expanded={pickerOpen}
              >
                <span className="amb-strokeLabel">Stroke</span>

                {/* big caret */}
                <svg className="amb-caret" width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                  <path fill="#4b2a70" d="M7 10l5 5 5-5z" />
                </svg>

                <div
                  className="amb-colorBox"
                  title="Selected stroke color"
                  style={{ background: selectedStroke, borderColor: "#fff" }}
                  aria-hidden
                  onClick={(e) => {
                    // clicking color box also toggles the picker; stop event to avoid double toggle from parent
                    e.stopPropagation();
                    setPickerOpen((s) => !s);
                  }}
                />
              </div>

              {/* picker popover */}
              {pickerOpen && (
                <div className="amb-pickerPop" ref={pickerRef} role="dialog" aria-label="Stroke colors">
                  <div className="amb-pickerInner">
                    {strokeColors.map((c) => (
                      <button
                        key={c.id}
                        className={`amb-pickerSwatch ${selectedStroke === c.hex ? "selected" : ""}`}
                        style={{ background: c.hex }}
                        onClick={() => onSelectColor(c.hex)}
                        aria-label={`Select ${c.id}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            className="amb-foldTab"
            aria-label="Collapse toolbar"
            onClick={() => setCollapsed(true)}
          />
        </header>

        <button
          className="amb-foldTabFloating"
          aria-label="Expand toolbar"
          onClick={() => setCollapsed(false)}
        />

        <main className="amb-stage">
          {kind === "image" && liveSrc ? (
            <img className="amb-bg" src={liveSrc} alt="Active preview" />
          ) : kind === "url" && srcFromState ? (
            <iframe ref={iframeRef} className="amb-bg" src={srcFromState} title="Active preview" />
          ) : (
            <div className="amb-empty">No preview available</div>
          )}

          <div className="amb-bottomOverlay">
            <button className="amb-cta" onClick={handleStart}>Start viva</button>
            <p className="amb-caption">
              Watch a second-by-second replay of the user's gaze. Understand their reading patterns,
              see what they skip, and pinpoint the exact moment they get stuck or distracted.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}