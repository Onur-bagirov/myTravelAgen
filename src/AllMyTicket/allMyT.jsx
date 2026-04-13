import React from 'react';
import { useNavigate } from 'react-router-dom';
import './allMyT.css';

const AllMyTicket = () => {
  const navigate = useNavigate();

  return (
    <div className="amt-page-container">
      <h2 className="amt-page-title">My <span>Tickets</span></h2>

      <div className="amt-selection-wrapper">
        <div className="amt-choice-card plane-bg" onClick={() => navigate('/All-My-P')}>
          <div className="amt-overlay"></div>
          <div className="amt-content-box">
            <h3>Air Travels</h3>
            <button className="amt-nav-btn plane-border">Show Plane Tickets</button>
          </div>
        </div>

        <div className="amt-choice-card train-bg" onClick={() => navigate('/All-My-Train-T')}>
          <div className="amt-overlay"></div>
          <div className="amt-content-box">
            <h3>Railway Travels</h3>
            <button className="amt-nav-btn train-border">Show Train Tickets</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllMyTicket;