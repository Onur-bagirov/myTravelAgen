import React from 'react';
import { useNavigate } from "react-router-dom"; // Naviqasiya üçün mütləqdir
import './about.css';

const About = () => {
  const navigate = useNavigate(); // Hook-u çağırırıq

  const handleStartTrip = () => {
    navigate("/buy"); // Düyməyə basanda 'Buy' səhifəsinə uçur
  };

  const stats = [
    { label: 'Happy Travelers', value: '50K+' },
    { label: 'Destinations', value: '120+' },
    { label: 'Support', value: '24/7' },
  ];

  return (
    <div className="about-page-wrapper">
      <div className="about-container">
        
        {/* HERO SECTION */}
        <section className="about-hero">
          <span className="badge-text">Since 2026</span>
          <h1 className="about-title">We Redefine the <br /> <span>Journey Experience.</span></h1>
          <p className="about-lead">
            TravelAgen is not just a booking platform. It's a bridge between you and your next unforgettable memory.
          </p>
        </section>

        {/* STATS SECTION */}
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* CONTENT SECTION */}
        <section className="about-details">
          <div className="detail-item">
            <div className="detail-icon">🌍</div>
            <div className="detail-text">
              <h4>Our Mission</h4>
              <p>Making global travel accessible, safe, and incredibly simple for everyone, everywhere.</p>
            </div>
          </div>

          <div className="detail-item">
            <div className="detail-icon">🛡️</div>
            <div className="detail-text">
              <h4>Secure Booking</h4>
              <p>Your safety is our priority. We use world-class encryption for all your transactions.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;