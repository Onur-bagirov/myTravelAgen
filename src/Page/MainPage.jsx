import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MainPage.css";

const destinations = [
  { id: 1, name: "Paris, France", price: "$1200", img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34", tag: "Romance" },
  { id: 2, name: "Bali, Indonesia", price: "$850", img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4", tag: "Nature" },
  { id: 3, name: "Rome, Italy", price: "$950", img: "https://images.unsplash.com/photo-1552832230-c0197dd311b5", tag: "History" },
];

export default function MainPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const checkUser = () => {
    const token = localStorage.getItem("userToken");
    const role = localStorage.getItem("userRole");
    const firstName = localStorage.getItem("userFirstName");
    const lastName = localStorage.getItem("userLastName");
    
    setUser(token && firstName ? { firstName, lastName } : null);
    setUserRole(role);
  };

  useEffect(() => {
    checkUser();
    window.addEventListener("storage", checkUser);
    return () => window.removeEventListener("storage", checkUser);
  }, []);

  const isAdmin = userRole === "Admin";
  const isCompany = userRole === "Company";

  return (
    <div className="main-page">
      <section className="hero-section">
        <div className="hero-overlay">
          <div className="main-content">
            <h1 className="hero-title">
              {user ? "Welcome Back," : "Explore the World"} 
              <span className="gradient-text"> {user ? user.firstName : "With Us"}</span>
            </h1>

            <p className="hero-subtitle">
              {user 
                ? "Your luxury adventure continues here. Are you ready to plan your next journey?" 
                : "Join TravelAgen for a premium travel experience and benefit from exclusive tours."}
            </p>

            <div className="hero-buttons">
              {user ? (
                <>
                  {isAdmin ? (
                    <button className="explore-btn" onClick={() => navigate("/create-executive")}>Add Company</button>
                  ) : isCompany ? (
                    <button className="explore-btn" onClick={() => navigate("/Select-Ticket")}>Add Ticket</button>
                  ) : (
                    <button className="explore-btn" onClick={() => navigate("/buy")}>Start Your Trip</button>
                  )}
                  
                  <button className="details-btn" onClick={() => navigate("/User-Profile")}>My Profile</button>
                </>
              ) : (
                <>
                  <button className="explore-btn" onClick={() => navigate("/register")}>Get Started</button>
                  <button className="details-btn" onClick={() => navigate('/about')}>Learn More</button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
      <section className="trending-section">
        <h2 className="section-title">Trending Destinations</h2>
        <div className="destinations-grid">
          {destinations.map((place) => (
            <div key={place.id} className="dest-card">
              <div className="card-image" style={{ backgroundImage: `url(${place.img})` }}>
                <div className="card-tag">{place.tag}</div>
              </div>
              <div className="card-info">
                <h3>{place.name}</h3>
                <p>Starting from <span>{place.price}</span></p>
                {user && (
                  <button className="book-now-btn" onClick={() => navigate("/buy")}>Book Now</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}