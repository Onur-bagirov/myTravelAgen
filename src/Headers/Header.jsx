import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Header.css";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null); // Role-u saxlamaq üçün state
  const [userData, setUserData] = useState({ firstName: "", lastName: "" });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole"); // Role-u götürürük
    const firstName = localStorage.getItem("userFirstName");
    const lastName = localStorage.getItem("userLastName");

    if (token) {
      setIsLoggedIn(true);
      setUserRole(role); // State-ə yazırıq
      setUserData({
        firstName: firstName || "User",
        lastName: lastName || ""
      });
    }
  }, []);

  const handleNavigation = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleLogout = () => {
    localStorage.clear(); // Bütün datanı təmizləmək daha rahatdır
    setIsLoggedIn(false);
    setUserRole(null);
    navigate("/");
    window.location.reload();
  };

  return (
    <header className="header">
      <div className="logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
        <h1>Travel<span>Agen</span></h1>
      </div>

      <div className="menu-icon" onClick={() => setIsOpen(!isOpen)}>
        <div className={`bar ${isOpen ? "open" : ""}`}></div>
        <div className={`bar ${isOpen ? "open" : ""}`}></div>
        <div className={`bar ${isOpen ? "open" : ""}`}></div>
      </div>

      <nav className={`navbar ${isOpen ? "active" : ""}`}>
        
        {/* 🔥 YALNIZ ADMİN VƏ ŞİRKƏTLƏR GÖRSÜN */}
        {isLoggedIn && (userRole === "Admin" || userRole === "Company") && (
          <span onClick={() => handleNavigation("/create-ticket")} className="nav-link create-ticket-link">
            Create Ticket
          </span>
        )}
        
        <span onClick={() => handleNavigation("/")} className="nav-link">
          Home
        </span>
        
        <span onClick={() => handleNavigation("/about")} className="nav-link">
          About
        </span>
        
        <div className="nav-buttons">
          {isLoggedIn ? (
            <>
              <button className="user-profile-btn" onClick={() => handleNavigation("/User-Profile")}>
                My Profile
              </button>
              <button className="signin-btn logout-color" onClick={handleLogout}>
                Log Out
              </button>
            </>
          ) : (
            <button 
              className="signin-btn" 
              onClick={() => handleNavigation("/register")}
            >
              Sign Up
            </button>
          )}
          <button 
            className="seatmap-btn"
            onClick={() => handleNavigation("/buy-seats")}
          >
            Test Seat Map
          </button>
          <button
            className="MyTickets-btn"
            onClick={() => handleNavigation("/MyTickets")}
          >
            My Tickets
          </button>
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