import React from 'react';
import { useNavigate } from 'react-router-dom'; 
import './buy.css';

const Buy = () => {
  const navigate = useNavigate(); 

  const tickets = [
    { 
      id: 1, 
      name: 'Train Ticket', 
      icon: '/Train.jpeg', 
      type: 'train',
      desc: 'Fast and scenic city-to-city travel with premium comfort.' 
    },
    { 
      id: 3, 
      name: 'Plane Ticket', 
      icon: '/Plane.webp', 
      type: 'plane',
      desc: 'Quick international flights with world-class service.' 
    }
  ];

  const handleSelect = (ticketType) => {
    if (ticketType === 'plane') {
      navigate('/ticket/plane'); 
    } 
    else if (ticketType === 'train') {
      navigate('/ticket/train'); 
    } 
    else if (ticketType === 'bus') {
      navigate('/ticket/bus');
    }
    else {
      alert(`${ticketType} bileti üçün səhifə tezliklə aktiv olacaq!`);
    }
  };

  return (
    <div className="buy-page-container">
      <div className="buy-content-wrapper">
        <h2 className="buy-main-title">Select Your <span>Transport</span></h2>
        <p className="buy-subtitle">Experience the best journey with TravelAgen's flexible options</p>
        
        <div className="ticket-grid">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="ticket-card">
              <div className="ticket-icon-box">
                <img src={ticket.icon} alt={ticket.name} className="ticket-img" />
              </div>
              <h3 className="ticket-name">{ticket.name}</h3>
              <p className="ticket-description">{ticket.desc}</p>
              {/* 4. onClick hissəsini yenilədik */}
              <button className="select-ticket-btn" onClick={() => handleSelect(ticket.type)}>
                Select Ticket
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Buy;