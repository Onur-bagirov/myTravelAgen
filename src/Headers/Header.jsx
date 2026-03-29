import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Header.css";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Marşrutlar arası keçid üçün funksiya
  const handleNavigation = (path) => {
    navigate(path);
    setIsOpen(false); // Mobil menyunu klikdən sonra bağlayır
  };

  return (
    <header className="header">
      {/* Logo-ya basanda Ana Səhifəyə ("/") gedir */}
      <div className="logo" onClick={() => navigate("/")} style={{cursor: "pointer"}}>
        <h1>Travel<span>Agen</span></h1>
      </div>

      {/* Hamburger İkonu (Mobil üçün) */}
      <div className="menu-icon" onClick={() => setIsOpen(!isOpen)}>
        <div className={`bar ${isOpen ? "open" : ""}`}></div>
        <div className={`bar ${isOpen ? "open" : ""}`}></div>
        <div className={`bar ${isOpen ? "open" : ""}`}></div>
      </div>

      <nav className={`navbar ${isOpen ? "active" : ""}`}>
        {/* Naviqasiya Linkləri */}
        <span onClick={() => handleNavigation("/")} className="nav-link">
          Home
        </span>
        
        <span onClick={() => handleNavigation("/about")} className="nav-link">
          About
        </span>
        
        <div className="nav-buttons">
          {/* Sign In düyməsi qeydiyyata aparır */}
          <button 
            className="signin-btn" 
            onClick={() => handleNavigation("/register")}
          >
            Sign Up
          </button>

          {/* Buy Now düyməsi bilet seçiminə (/buy) aparır */}
          <button 
            className="buy-btn"
            onClick={() => handleNavigation("/buy")}
          >
            Buy Now
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Header;