import React from 'react';
import { useNavigate } from 'react-router-dom'; // Naviqasiya üçün hook
import './selectTicket.css';

const SelectTicket = () => {
  const navigate = useNavigate(); // Funksiyanı işə salırıq

  const travelOptions = [
    { 
      id: 1, 
      name: 'Sky Executive', 
      desc: 'Lüks və sürətli uçuş təcrübəsi.',
      icon: '✈️',
      bgClass: 'plane-card',
      path: '/Create-Plane-Ticket' // Kliklədikdə gedəcəyi ünvan
    },
    { 
      id: 2, 
      name: 'Iron Express', 
      desc: 'Komfortlu qatar səyahəti.',
      icon: '🚄',
      bgClass: 'train-card',
      path: '/book-train' // Kliklədikdə gedəcəyi ünvan
    },
  ];

  // Klik funksiyası
  const handleSelection = (path) => {
    navigate(path);
  };

  return (
    <div className="st-page-wrapper">
      <div className="st-container">
        
        <header className="st-header">
          <div className="st-badge">
            <span className="st-pulse"></span>
            Select Trip
          </div>
          <h1 className="st-main-title">
            Choose Your <span>Way</span>
          </h1>
        </header>

        <div className="st-selection-grid">
          {travelOptions.map((option) => (
            <div 
              key={option.id} 
              className={`st-premium-card ${option.bgClass}`}
              onClick={() => handleSelection(option.path)} // Karta klik edəndə keçid edir
            >
              <div className="st-card-top">
                <div className="st-icon-box">{option.icon}</div>
                <div className="st-arrow-circle">→</div>
              </div>

              <div className="st-card-body">
                <h3>{option.name}</h3>
                <p>{option.desc}</p>
              </div>

              <div className="st-card-footer">
                <span className="st-tag">Premium</span>
                <button 
                  className="st-select-btn"
                  onClick={(e) => {
                    e.stopPropagation(); // Düyməyə klikləyəndə kartın kliklənməsini təkrarlamasın
                    handleSelection(option.path);
                  }}
                >
                  Select
                </button>
              </div>
            </div>
          ))}
        </div>

        <footer className="st-trust-footer">
          <p>🔒 SSL Secured Booking</p>
        </footer>
      </div>
    </div>
  );
};

export default SelectTicket;