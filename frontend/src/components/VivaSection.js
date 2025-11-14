import React from "react";
import { useLocation, useNavigate } from "react-router-dom"; // 👈 import navigation hook
import "./VivaSection.css";

const VivaSection = () => {
    const { state } = useLocation();
  const navigate = useNavigate(); // 👈 initialize navigation
const kind = state?.kind;
  const src = state?.src;
  const name = state?.name;
  const file = state?.file; 
  // Function called when "Continue" button is clicked
  const handleContinue = () => {
    navigate("/calibration", {state:{kind , src, name,file }}); // 👈 move to Calibration page
  };

  return (
    <div className="viva-container">
      <div className="viva-overlay"></div>

      <div className="viva-cards">
        <div className="viva-card"></div>
        <div className="viva-card"></div>
        <div className="viva-card"></div>
      </div>

      <button className="viva-button" onClick={handleContinue}>
        Continue
      </button>
    </div>
  );
};

export default VivaSection;