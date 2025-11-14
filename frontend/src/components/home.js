import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./home.css";

export default function Home(){
 const navigate = useNavigate();   
  const fileRef = useRef(null);
  const [url, setUrl] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("");
const [imagePreview, setImagePreview] = useState(""); // blob url for uploaded image

  const onUploadClick = () => fileRef.current?.click();

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setSelectedFile(f);
    setFileName(f.name || "Uploaded image");
     // Read as data URL (base64)
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result; // string like "data:image/png;base64,...."
    setImagePreview(dataUrl);
    // persist so a full browser reload can still read it
    try {
      const payload = {
        kind: "image",
        src: dataUrl,
        name: f.name || "Uploaded image",
      };
      sessionStorage.setItem("viva_preview", JSON.stringify(payload));
    } catch (err) {
      console.warn("Could not save preview to sessionStorage:", err);
    }
  };
  reader.onerror = (err) => {
    console.warn("FileReader error", err);
    setImagePreview("");
  };
  reader.readAsDataURL(f);
};

  const canProceed = url.trim().length > 0 || imagePreview;

  const goPreview = () => {
    if (imagePreview) {
      const payload = {
        kind: "image",
        src: imagePreview,   // blob: URL
        name: fileName,
        file: selectedFile,  // original File — important for reload
      };
      navigate("/preview", { state: payload });
      return;
    }
  if (url.trim()) {
      const payload = {
        kind: "url",
        src: url.trim(),
        name: url.trim(),
      };
      navigate("/preview", { state: payload });
      return;
    }

    // nothing to do
  };
  return (
    <div className="page">
      <div className={`frame ${collapsed ? "collapsed" : ""}`}>
        {/* ===== NAVBAR (unchanged) ===== */}
        <header className="topbar simple">
          <div className="brand">
            <span className="brandWord">Viva</span>
          </div>

          <div className="middle" role="group" aria-label="Input controls">
            <div className="urlPill">
              <span className="urlIcon" aria-hidden>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#515151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1"/>
                  <path d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 1 1-7-7l1-1"/>
                </svg>
              </span>
              <input
                className="urlField"
                placeholder="Paste the URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <span className="orTxt">(OR)</span>

            <button className="btn import" type="button" onClick={onUploadClick}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#515151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v12"/><path d="M6 9l6 6 6-6"/><path d="M5 21h14"/>
              </svg>
              {fileName ? `Image: ${fileName}` : "Upload Image"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} hidden/>

            <button className="btn proceed" type="button" disabled={!canProceed}  onClick={goPreview}// ⬅ redirect to preview
  >
              Proceed
            </button>
          </div>

          {/* Fold tab */}
          <button
            className="foldTab"
            aria-label="Collapse toolbar"
            onClick={() => setCollapsed(true)}
            title="Collapse"
          />
        </header>

        {/* Floating tab when collapsed */}
        <button
          className="foldTabFloating"
          aria-label="Expand toolbar"
          onClick={() => setCollapsed(false)}
          title="Expand"
        />

        {/* ===== WATERMARK (behind content) ===== */}
        <div className="wm">
          <svg className="wm-svg" viewBox="0 0 1600 700" preserveAspectRatio="xMidYMid slice" aria-hidden>
            <defs>
              {/* Gradient: 0% -> #D58DF4 ; 100% -> #7C528E ; opacity 34% applied via .wm-svg */}
              <linearGradient id="vivaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#D58DF4"/>
                <stop offset="100%" stopColor="#7C528E"/>
              </linearGradient>
            </defs>
            <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" fontFamily="Satoshi Variable, Poppins, system-ui, sans-serif" fontWeight="900" fontSize="520" fill="url(#vivaGrad)">
              Viva
            </text>
          </svg>
        </div>

        {/* ===== CONTENT (headline + 4 cards) ===== */}
        <main className="stage" role="presentation">
          <div className="stageInner">
            <h1 className="headline">
              VIVA is the "why" you’ve been missing. In less than 60 seconds,
            </h1>

            <div className="grid4">
              <article className="card">
                <p className="cardText">you can paste a URL or upload an image</p>
              </article>
              <article className="card">
                <p className="cardText">and see a real-time visualization of your user’s attention.</p>
              </article>
              <article className="card">
                <p className="cardText">We translate complex gaze patterns into a simple, shareable story.</p>
              </article>
              <article className="card">
                <p className="cardText">showing you the exact path a user’s eyes take as they interact with your design.</p>
              </article>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
