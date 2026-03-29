import React from "react";
import { useNavigate } from "react-router-dom";
import "./MainPage.css";

// Gələcəkdə bura API-dan məlumat gələcək
const destinations = [
  { id: 1, name: "Paris, France", price: "$1200", img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34" },
  { id: 2, name: "Bali, Indonesia", price: "$850", img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4" },
  { id: 3, name: "Rome, Italy", price: "$950", img: "https://images.unsplash.com/photo-1552832230-c0197dd311b5" },
];

export default function MainPage() {
  const navigate = useNavigate();

  return (
    <div className="main-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="main-content">
          <h1 className="hero-title">
            Explore the World <span>With Us</span>
          </h1>
          <p className="hero-subtitle">
            Turning your travel dreams into reality. Experience luxury, 
            adventure, and unforgettable memories with TravelAgen’s 
            exclusive tour packages.
          </p>
          <div className="hero-buttons">
            <button className="explore-btn" onClick={() => navigate("/register")}>
              Get Started
            </button>
            <button className="details-btn" onClick={() => navigate('/about')}> Learn More </button>
          </div>
        </div>
      </section>

      {/* Trending Destinations Section */}
      <section className="trending-section">
        <h2 className="section-title">Trending Destinations</h2>
        <div className="destinations-grid">
          {destinations.map((place) => (
            <div key={place.id} className="dest-card">
              <div 
                className="card-image" 
                style={{ backgroundImage: `url(${place.img})` }}
              ></div>
              <div className="card-info">
                <h3>{place.name}</h3>
                <p>Starting from <span>{place.price}</span></p>
                <button className="book-now-btn">Book Now</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}