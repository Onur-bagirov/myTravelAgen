import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Geri qayıtmaq üçün
import "./ticket.css";

const TrainTicket = () => {
  const navigate = useNavigate();
  const [searchData, setSearchData] = useState({
    from: "Baku, Central Railway", fromCode: "BAK",
    to: "Ganja Station", toCode: "GNJ",
    date: "2026-03-25",
    classType: "Standard",
    adults: 1, children: 0, infants: 0
  });

  // Sayğac funksiyası
  const updateCount = (type, operation) => {
    setSearchData(prev => ({
      ...prev,
      [type]: operation === 'inc' ? prev[type] + 1 : Math.max(type === 'adults' ? 1 : 0, prev[type] - 1)
    }));
  };

  return (
    <div className="ticket-page-wrapper">
      <div className="ios-container">
        {/* Geri düyməsi (iOS stili) */}
        <h1 className="main-title">Buy a Train Ticket</h1>

        <div className="search-section">
          
          {/* LOCATION CARD (STATIONS) */}
          <div className="ios-card travel-card">
            <div className="ios-row">
              <div className="input-field">
                <span className="label-tiny">From Station</span>
                <select className="premium-select" value={searchData.from} onChange={(e) => setSearchData({...searchData, from: e.target.value})}>
                  <option>Baku, Central Railway</option>
                  <option>Sumqayit Station</option>
                  <option>Tbilisi, Central</option>
                </select>
              </div>
              <div className="code-badge">🚉</div>
            </div>

            <div className="ios-divider">
              <div className="ios-swap-btn">⇅</div>
            </div>

            <div className="ios-row">
              <div className="input-field">
                <span className="label-tiny">To Station</span>
                <select className="premium-select" value={searchData.to} onChange={(e) => setSearchData({...searchData, to: e.target.value})}>
                  <option>Ganja Station</option>
                  <option>Gabala Station</option>
                  <option>Agstafa Station</option>
                </select>
              </div>
              <div className="code-badge">🛤️</div>
            </div>
          </div>

          {/* DATE & CLASS SELECTION (Yan-yana) */}
          <div className="ios-card single-row">
            <div className="input-field">
              <span className="label-tiny">Departure Date</span>
              <input type="date" className="ios-date-input" value={searchData.date} onChange={(e) => setSearchData({...searchData, date: e.target.value})} />
            </div>
            <div className="icon-box">📅</div>
          </div>

          {/* PASSENGERS CARD */}
          <div className="ios-card passenger-card">
            <span className="label-tiny padding-left">Passengers</span>
            
            <div className="passenger-row">
              <div className="p-info">
                <span className="p-type">Adults</span>
                <span className="p-desc">12+ years</span>
              </div>
              <div className="stepper">
                <button onClick={() => updateCount('adults', 'dec')}>−</button>
                <span>{searchData.adults}</span>
                <button onClick={() => updateCount('adults', 'inc')}>+</button>
              </div>
            </div>

            <div className="inner-divider"></div>

            <div className="passenger-row">
              <div className="p-info">
                <span className="p-type">Children</span>
                <span className="p-desc">5-11 years</span>
              </div>
              <div className="stepper">
                <button onClick={() => updateCount('children', 'dec')}>−</button>
                <span>{searchData.children}</span>
                <button onClick={() => updateCount('children', 'inc')}>+</button>
              </div>
            </div>

            <div className="inner-divider"></div>

            <div className="passenger-row">
              <div className="p-info">
                <span className="p-type">Infants</span>
                <span className="p-desc">Under 5 years</span>
              </div>
              <div className="stepper">
                <button onClick={() => updateCount('infants', 'dec')}>−</button>
                <span>{searchData.infants}</span>
                <button onClick={() => updateCount('infants', 'inc')}>+</button>
              </div>
            </div>
          </div>

          <button className="ios-main-btn train-btn">Search Train Tickets</button>
        </div>
      </div>
    </div>
  );
};

export default TrainTicket;