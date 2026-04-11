import React from 'react';
import { useNavigate } from 'react-router-dom';
import './allMyT.css';

const AllMyTicket = () => {
  const navigate = useNavigate();
  const handleNavigation = (path) => navigate(path);

  return (
    <div className="tickets-container">
      <h1 className="page-title">My Booked Tickets</h1>
      <div className="ticket-cards-wrapper">
        <div className="ticket-card plane-card" onClick={() => handleNavigation("/All-My-P")}>
          <div className="card-overlay"></div>
          <div className="card-content">
            <div className="icon-badge">✈️</div>
            <h2>Air Travels</h2>
            <p>View your upcoming flights and boarding passes.</p>
            <button className="btn-view plane-btn">Show Plane Tickets</button>
          </div>
        </div>

        <div className="ticket-card train-card" onClick={() => handleNavigation("/All-My-Train-T")}>
          <div className="card-overlay"></div>
          <div className="card-content">
            <div className="icon-badge">🚆</div>
            <h2>Railway Travels</h2>
            <p>Access your train journeys and seat reservations.</p>
            <button className="btn-view train-btn">Show Train Tickets</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllMyTicket;