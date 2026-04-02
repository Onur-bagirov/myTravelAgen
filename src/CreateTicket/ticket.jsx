import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Navigation üçün
import "./ticket.css";

export default function CreateTicket() {
    const navigate = useNavigate();
    const [isGenerated, setIsGenerated] = useState(false);
    
    const [ticket, setTicket] = useState({
        airline: "",
        gate: "",
        plane: "",
        meal: "",
        luggageKg: 0,
        passengerName: "ONUR BAGIROV", // Default name
        from: "BAKU (GYD)",
        to: "LONDON (LHR)",
        flightNo: "BA-256",
        seat: "10A",
        date: "APR 12, 2026"
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setTicket({
            ...ticket,
            [name]: type === "checkbox" ? checked : value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Trigger the ticket view
        setIsGenerated(true);
        console.log("Ticket Data Generated:", ticket);
    };

    return (
        <div className="ticket-page-body">
            {!isGenerated ? (
                /* FORM SECTION */
                <div className="ticket-card">
                    <div className="ticket-header">
                        <div className="plane-icon-bg">✈️</div>
                        <h2><span>Create</span> Ticket</h2>
                        <p>Enter flight details to generate your digital boarding pass.</p>
                    </div>

                    <form className="ticket-form" onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="input-group">
                                <label>Airline</label>
                                <input 
                                    name="airline" 
                                    value={ticket.airline} 
                                    onChange={handleChange} 
                                    placeholder="e.g. Turkish Airlines" 
                                    required 
                                />
                            </div>
                            <div className="input-group">
                                <label>Gate</label>
                                <input 
                                    name="gate" 
                                    value={ticket.gate} 
                                    onChange={handleChange} 
                                    placeholder="e.g. B-04" 
                                    required 
                                />
                            </div>
                            <div className="input-group">
                                <label>Plane Model</label>
                                <input 
                                    name="plane" 
                                    value={ticket.plane} 
                                    onChange={handleChange} 
                                    placeholder="e.g. Boeing 747" 
                                    required 
                                />
                            </div>
                            <div className="input-group">
                                <label>Meal Preference</label>
                                <input 
                                    name="meal" 
                                    value={ticket.meal} 
                                    onChange={handleChange} 
                                    placeholder="e.g. Standard, Vegan" 
                                />
                            </div>
                            <div className="input-group">
                                <label>Luggage (KG)</label>
                                <input 
                                    type="number" 
                                    name="luggageKg" 
                                    value={ticket.luggageKg} 
                                    onChange={handleChange} 
                                    min="0" 
                                />
                            </div>
                        </div>

                        <button type="submit" className="generate-btn">
                            Generate Ticket
                        </button>
                    </form>
                </div>
            ) : (
                /* GENERATED TICKET SECTION */
                <div className="boarding-pass-container animate-pop">
                    <div className="boarding-pass">
                        <div className="pass-left">
                            <div className="pass-header">
                                <div className="airline-brand">{ticket.airline || "GLOBAL AIRWAYS"}</div>
                                <div className="pass-label">BOARDING PASS</div>
                            </div>
                            
                            <div className="pass-route">
                                <div className="city">
                                    <h1>GYD</h1>
                                    <p>BAKU</p>
                                </div>
                                <div className="plane-fly">✈️</div>
                                <div className="city">
                                    <h1>LHR</h1>
                                    <p>LONDON</p>
                                </div>
                            </div>

                            <div className="pass-info-grid">
                                <div className="info-box">
                                    <span>PASSENGER</span>
                                    <strong>{ticket.passengerName}</strong>
                                </div>
                                <div className="info-box">
                                    <span>FLIGHT</span>
                                    <strong>{ticket.flightNo}</strong>
                                </div>
                                <div className="info-box">
                                    <span>GATE</span>
                                    <strong>{ticket.gate}</strong>
                                </div>
                                <div className="info-box">
                                    <span>SEAT</span>
                                    <strong>{ticket.seat}</strong>
                                </div>
                                <div className="info-box">
                                    <span>MODEL</span>
                                    <strong>{ticket.plane}</strong>
                                </div>
                                <div className="info-box">
                                    <span>LUGGAGE</span>
                                    <strong>{ticket.luggageKg} KG</strong>
                                </div>
                            </div>
                        </div>

                        <div className="pass-right">
                            <div className="stub-header">{ticket.airline}</div>
                            <div className="stub-route">GYD ➔ LHR</div>
                            <div className="stub-details">
                                <p>Seat: {ticket.seat}</p>
                                <p>Date: {ticket.date}</p>
                            </div>
                            <div className="barcode-area"></div>
                        </div>
                    </div>
                    
                    <div className="action-buttons">
                        <button className="back-btn" onClick={() => setIsGenerated(false)}>
                            Create New
                        </button>
                        <button className="home-btn" onClick={() => navigate("/")}>
                            Go to Home
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}