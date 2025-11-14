import React from "react";
import { useNavigate } from "react-router-dom";
import "./VivaLanding.css";


function VivaLanding() {
    const navigate = useNavigate();
  return (
    <div className="viva-root">
      <div className="viva-canvas">

        {/* Top Nav */}
        <header className="viva-top-pill">
          <div className="viva-pill-inner">
            <div className="viva-brand">
              <img
                src={require("./assets/Viva.png")}
                alt="Viva logo"
                className="viva-logo"
              />
            </div>

            <div className="viva-spacer"></div>
            <nav className="viva-links">
              <span>Gave feed back</span>
              <span>About us</span>
            </nav>
            <button className="viva-contact">
              Contact us
              <span className="arrow">
                <svg

xmlns="http://www.w3.org/2000/svg"

viewBox="0 0 24 24"

width="22"

height="22"

fill="none"

stroke="currentColor"

strokeWidth="2"

strokeLinecap="round"

strokeLinejoin="round"

>

{/* Main chat bubble */}

<path d="M21 11.5c0 4.97-4.03 9-9 9h-2L6 22v-2.5c-2.33-1.5-4-4.16-4-7 0-4.97 4.03-9 9-9s9 4.03 9 9z" />

{/* Message lines */}

<line x1="8" y1="11" x2="16" y2="11" />

<line x1="8" y1="15" x2="12" y2="15" />

</svg>



              </span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="viva-main">
          <section className="viva-left">
            <h1 className="viva-hero">
              DON'T GUESS.
              <br />
              KNOW.
            </h1>
            <p className="viva-sub">
              Stop wondering if your designs work. VIVA's effortless gaze-tracking
              shows you exactly where your users look, so you can build experiences
              that are impossible to misunderstand.
            </p>
            <div className="viva-cta-wrap">
              <button className="viva-cta" onClick={() => navigate("/home")} >
                Start Your First Scan <span className="cta-bold">(It's Free)</span>
                <span className="cta-arrow">↗</span>
              </button>
            </div>
          </section>

          <aside className="viva-right">
            <div className="viva-card1"></div>
          </aside>
        </main>

      </div>
    </div>
  );
}

export default VivaLanding;