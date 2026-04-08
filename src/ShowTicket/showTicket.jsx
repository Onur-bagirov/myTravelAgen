import React from 'react';
import { useNavigate } from 'react-router-dom';
import './showTicket.css';

const ShowTicket = () => {
  const navigate = useNavigate();

  return (
    <div className="st-page-container">
      <h2 className="st-page-title">Show  <span>Tickets</span></h2>
      
      <div className="st-selection-wrapper">
        {/* Plane Section */}
        <div className="st-choice-card plane-bg" onClick={() => navigate('/Show-Plane-Ticket')}>
          <div className="st-overlay"></div>
          <div className="st-content-box">
            <div className="st-icon">✈️</div>
            <h3>Air Travels</h3>
            <button className="st-nav-btn plane-border">Show Plane Tickets</button>
          </div>
        </div>

        {/* Train Section */}
        <div className="st-choice-card train-bg" onClick={() => navigate('/show-train-tickets')}>
          <div className="st-overlay"></div>
          <div className="st-content-box">
            <div className="st-icon">🚄</div>
            <h3>Railway Travels</h3>
            <button className="st-nav-btn train-border">Show Train Tickets</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowTicket;