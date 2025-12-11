// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Booking from "./pages/Booking";

export default function App(){
  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="header">
          <div className="brand">
            <div className="logo">DA</div>
            <div>
              <div className="title">Doctor Appointments</div>
              <div className="subtitle">Simple & safe booking — demo</div>
            </div>
          </div>

          <div className="controls">
            <Link to="/" className="btn">Home</Link>
            <Link to="/admin" className="btn">Admin</Link>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/booking/:id" element={<Booking />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
