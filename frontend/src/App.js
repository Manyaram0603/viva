// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import VivaLanding from "./components/VivaLanding";
import Home from "./components/home";
import Preview from "./components/preview";
import VivaSection from "./components/VivaSection";
import Calibration from "./components/Calibration";
import ActiveModeBar from "./components/ActiveModeBar";
import TrackingScreen from "./components/TrackingScreen";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<VivaLanding />} />
        <Route path="/home" element={<Home />} />
        <Route path="/preview" element={<Preview />} />
        <Route path="/vivaSection" element={<VivaSection />} />
        <Route path="/calibration" element={<Calibration />} />
        <Route path="/activemode" element={<ActiveModeBar />} />
        <Route path="/trackingScreen" element={<TrackingScreen />} />
      </Routes>
    </BrowserRouter>
  );
}
