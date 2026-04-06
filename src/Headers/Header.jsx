import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Header.css";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState({ firstName: "", lastName: "" });
  const navigate = useNavigate();

  const checkUser = () => {
    const token = localStorage.getItem("userToken");
    const role = localStorage.getItem("userRole");
    const firstName = localStorage.getItem("userFirstName");
    const lastName = localStorage.getItem("userLastName");

    if (token) {
      setIsLoggedIn(true);
      setUserRole(role);
      setUserData({ firstName: firstName || "User", lastName: lastName || "" });
    } else {
      setIsLoggedIn(false);
      setUserRole(null);
      setUserData({ firstName: "", lastName: "" });
    }
  };

  useEffect(() => {
    checkUser();
    window.addEventListener("storage", checkUser);
    return () => window.removeEventListener("storage", checkUser);
  }, []);

  const handleNavigation = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleBuyNow = () => {
    if (isLoggedIn) {
      navigate("/buy");
    } else {
      navigate("/register");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setUserRole(null);
    window.dispatchEvent(new Event("storage")); // ← düzəliş bu sətirdir
    navigate("/");
  };

  return (
    <header className="header">
      {/* Logo */}
      <div className="logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
        <h1>Travel<span>Agen</span></h1>
      </div>

      {/* Mobile Menu Icon */}
      <div className="menu-icon" onClick={() => setIsOpen(!isOpen)}>
        <div className={`bar ${isOpen ? "open" : ""}`}></div>
        <div className={`bar ${isOpen ? "open" : ""}`}></div>
        <div className={`bar ${isOpen ? "open" : ""}`}></div>
      </div>

      {/* Navbar */}
      <nav className={`navbar ${isOpen ? "active" : ""}`}>
        {/* Admin / Company link */}
        {isLoggedIn && (userRole === "Admin" || userRole === "Company") && (
          <span
            onClick={() => handleNavigation("/create-ticket")}
            className="nav-link create-ticket-link"
          >
            Create Ticket
          </span>
        )}

        <span onClick={() => handleNavigation("/")} className="nav-link">Home</span>
        <span onClick={() => handleNavigation("/about")} className="nav-link">About</span>

        {/* Buttons */}
        <div className="nav-buttons">
          {isLoggedIn ? (
            <>
              <button className="signin-btn logout-color" onClick={() => handleNavigation("/User-Profile")}>
                My Profile
              </button>
              <button className="signin-btn logout-color" onClick={handleLogout}>
                Log Out
              </button>
              <button className="seatmap-btn" onClick={() => handleNavigation("/buy-seats")}>
                Test Seat Map
              </button>
              <button className="MyTickets-btn" onClick={() => handleNavigation("/MyTickets")}>
                My Tickets
              </button>
              <button className="buy-btn" onClick={handleBuyNow}>Buy Now</button>
            </>
          ) : (
            <>
              <button className="signin-btn" onClick={() => handleNavigation("/register")}>Sign Up</button>
              <button className="buy-btn" onClick={handleBuyNow}>Buy Now</button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;