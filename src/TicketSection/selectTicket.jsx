import React from 'react';
import { useNavigate } from 'react-router-dom';
import './selectTicket.css';

const SelectTicket = () => {
  const navigate = useNavigate();

  const travelOptions = [
    {
      id: 1,
      name: 'Air Travels',
      bgClass: 'plane-bg',
      btnClass: 'plane-border',
      btnText: 'Create Plane Ticket',
      path: '/create-ticket',
    },
    {
      id: 2,
      name: 'Railway Travels',
      bgClass: 'train-bg',
      btnClass: 'train-border',
      btnText: 'Create Train Ticket',
      path: '/create-train-ticket',
    },
  ];

  return (
    <div className="st-page-wrapper">
      <h2 className="st-page-title">
        Choose <span>Your Way</span>
      </h2>

      <div className="st-selection-wrapper">
        {travelOptions.map((option) => (
          <div
            key={option.id}
            className={`st-choice-card ${option.bgClass}`}
            onClick={() => navigate(option.path)}
          >
            <div className="st-card-bg"></div>
            <div className="st-overlay"></div>

            <div className="st-content-box">
              <h3>{option.name}</h3>
              <button
                className={`st-nav-btn ${option.btnClass}`}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(option.path);
                }}
              >
                {option.btnText}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SelectTicket;