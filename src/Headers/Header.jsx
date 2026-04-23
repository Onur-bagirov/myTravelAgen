import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Header.css";

const API_BASE = "http://localhost:5251/api";

const Header = () => {
  const [isOpen,     setIsOpen]     = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole,   setUserRole]   = useState(null);
  const [userData,   setUserData]   = useState({ firstName: "", lastName: "" });
  const [unread,     setUnread]     = useState(0);
  const navigate = useNavigate();

  const checkUser = () => {
    const token     = localStorage.getItem("userToken");
    const role      = localStorage.getItem("userRole");
    const firstName = localStorage.getItem("userFirstName");
    const lastName  = localStorage.getItem("userLastName");
    if (token) {
      setIsLoggedIn(true);
      setUserRole(role);
      setUserData({ firstName: firstName || "User", lastName: lastName || "" });
    } else {
      setIsLoggedIn(false);
      setUserRole(null);
      setUserData({ firstName: "", lastName: "" });
      setUnread(0);
    }
  };

  const fetchUnread = useCallback(async () => {
    const token = localStorage.getItem("userToken");
    const role  = localStorage.getItem("userRole");
    if (!token || !["Admin", "Company"].includes(role)) return;

    try {
      const isAdmin   = role === "Admin";
      const isCompany = role === "Company";
      const params    = new URLSearchParams({ Page: 1, Limit: 50 });
      if (isAdmin)   params.append("ForAdmin", "true");
      if (isCompany) params.append("ForAdmin", "false");

      const res = await fetch(`${API_BASE}/Message?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const json = await res.json();
      const data = json.data ?? [];

      let payload = {};
      try { payload = JSON.parse(atob(token.split(".")[1])); } catch {}
      const myId = parseInt(payload["uid"] ?? payload["sub"] ?? 0);

      const count = data.filter(
        (m) => !m.hasBeenRead && m.senderId !== myId
      ).length;

      setUnread(count);
    } catch {}
  }, []);

  useEffect(() => {
    checkUser();
    window.addEventListener("storage", checkUser);
    return () => window.removeEventListener("storage", checkUser);
  }, []);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  const handleNavigation = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleBuyNow = () => {
    if (isLoggedIn) navigate("/buy");
    else navigate("/register");
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setUserRole(null);
    setUnread(0);
    window.dispatchEvent(new Event("storage"));
    navigate("/");
  };

  const isCustomer = userRole === "Customer";
  const isCompany  = userRole === "Company";
  const isAdmin    = userRole === "Admin";

  return (
    <header className="header">
      <div className="logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
        <h1>Travel<span>Agen</span></h1>
      </div>

      <div className="menu-icon" onClick={() => setIsOpen(!isOpen)}>
        <div className={`bar ${isOpen ? "open" : ""}`} />
        <div className={`bar ${isOpen ? "open" : ""}`} />
        <div className={`bar ${isOpen ? "open" : ""}`} />
      </div>

      <nav className={`navbar ${isOpen ? "active" : ""}`}>
        <span onClick={() => handleNavigation("/")}      className="nav-link">Home</span>
        <span onClick={() => handleNavigation("/about")} className="nav-link">About</span>

        <div className="nav-buttons">
          {isLoggedIn ? (
            <>
              <button className="myprofile-btn myprofile-color" onClick={() => handleNavigation("/User-Profile")}>
                My Profile
              </button>

              {(isAdmin || isCompany) && (
                <button className="signin-btn create-exec-color" onClick={() => handleNavigation("/Show-Ticket")}>
                  Show Tickets
                </button>
              )}

              {(isAdmin || isCompany) && (
                <button
                  className="messages-btn"
                  onClick={() => { handleNavigation("/message"); setUnread(0); }}
                >
                  <span className="msg-btn-inner">
                    <svg
                      width="14" height="14"
                      viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.2"
                      strokeLinecap="round" strokeLinejoin="round"
                      style={{ flexShrink: 0 }}
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    Messages
                    {unread > 0 && (
                      <span className="msg-badge">{unread > 99 ? "99+" : unread}</span>
                    )}
                  </span>
                </button>
              )}

              {isCompany && (
                <button className="seatmap-btn" onClick={() => handleNavigation("/Select-Ticket")}>
                  Create Ticket
                </button>
              )}

              {isCustomer && (
                <>
                  <button className="MyTickets-btn" onClick={() => handleNavigation("/All-My-Tic")}>
                    My Tickets
                  </button>
                  <button className="buy-btn" onClick={handleBuyNow}>
                    Buy Now
                  </button>
                </>
              )}

              {isAdmin && (
                <button className="signin-btn create-exec-color" onClick={() => handleNavigation("/create-executive")}>
                  Create Company
                </button>
              )}
              {isAdmin && (
                <button className="signin-btn create-exec-color" onClick={() => handleNavigation("/Add-V")}>
                  Add Variant
                </button>
              )}
              {isAdmin && (
                <button className="signin-btn create-exec-color" onClick={() => handleNavigation("/Add-C-L")}>
                  Add Location
                </button>
              )}
            </>
          ) : (
            <>
              <button className="myprofile-btn myprofile-color" onClick={() => handleNavigation("/register")}>
                Sign Up
              </button>
              <button className="buy-btn" onClick={handleBuyNow}>
                Buy Now
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;