import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Emailcode.css";

export default function Emailcode() {
    const [code, setCode] = useState(new Array(6).fill(""));
    const [message, setMessage] = useState("");
    const inputs = useRef([]);
    const navigate = useNavigate();

    const handleChange = (e, index) => {
        const value = e.target.value;
        if (isNaN(value)) return;

        let newCode = [...code];
        newCode[index] = value.substring(value.length - 1);
        setCode(newCode);

        // Növbəti inputa keçid
        if (value && index < 5) {
            inputs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        // Backspace basıldıqda əvvəlki inputa qayıtmaq
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputs.current[index - 1].focus();
        }
    };

    const handleSubmit = async () => {
        const fullCode = code.join("");
        try {
            const res = await fetch("http://localhost:5000/verify-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: fullCode })
            });

            const data = await res.json();
            if (res.ok) {
                setMessage("Təsdiqləndi! Giriş səhifəsinə yönləndirilirsiniz...");
                setTimeout(() => navigate("/login"), 2000);
            } else {
                setMessage(data.message || "Kod yanlışdır.");
            }
        } catch (err) {
            setMessage("Server xətası: " + err.message);
        }
    };

    return (
        <div className="verify-body">
            <div className="verify-card">
                <div className="verify-header">
                    <div className="mail-icon">✉️</div>
                    <h2>Kodu daxil edin</h2>
                    <p>E-poçt ünvanınıza göndərilən 6 rəqəmli təsdiq kodunu yazın.</p>
                </div>

                <div className="code-inputs">
                    {code.map((digit, index) => (
                        <input
                            key={index}
                            type="text"
                            maxLength="1"
                            value={digit}
                            ref={(el) => (inputs.current[index] = el)}
                            onChange={(e) => handleChange(e, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                        />
                    ))}
                </div>

                <button className="confirm-btn" onClick={handleSubmit}>
                    Təsdiqlə
                </button>

                {message && <p className={`msg ${message.includes("Təsdiqləndi") ? "success" : "error"}`}>
                    {message}
                </p>}

                <div className="resend-section">
                    Kod gəlməyib? <button className="resend-link">Yenidən göndər</button>
                </div>
            </div>
        </div>
    );
}