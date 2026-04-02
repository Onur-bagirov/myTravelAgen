import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Emailcode.css";

export default function Emailcode() {
    const [code, setCode] = useState(new Array(6).fill(""));
    const [status, setStatus] = useState({ type: "", message: "" });
    const inputs = useRef([]);
    const navigate = useNavigate();

    useEffect(() => {
        const userEmail = localStorage.getItem("userEmail");
        if (!userEmail) {
            setStatus({ type: "error", message: "Email not found in storage!" });
        }
    }, []);

    const handleChange = (e, index) => {
        const value = e.target.value;
        if (isNaN(value)) return;
        let newCode = [...code];
        newCode[index] = value.substring(value.length - 1);
        setCode(newCode);
        if (value && index < 5) inputs.current[index + 1].focus();
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace" && !code[index] && index > 0) inputs.current[index - 1].focus();
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        const fullCode = code.join("");
        const userEmail = localStorage.getItem("userEmail");

        if (!userEmail || fullCode.length < 6) {
            setStatus({ type: "error", message: "Please enter the full 6-digit code." });
            return;
        }

        try {
            setStatus({ type: "loading", message: "Verifying..." });
            const response = await fetch("http://localhost:5251/api/Auth/confirm-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: userEmail, confirmCode: fullCode })
            });

            const data = await response.json();
            if (response.ok && data === true) {
                setStatus({ type: "success", message: "Verified! Redirecting..." });
                localStorage.removeItem("userEmail");
                setTimeout(() => navigate("/login"), 2000);
            } else {
                setStatus({ type: "error", message: "Invalid code." });
            }
        } catch (err) {
            setStatus({ type: "error", message: "Server connection failed." });
        }
    };

    return (
        <div className="verify-body">
            <div className="verify-card">
                <h2>Verify Your Email</h2>
                <div className="code-inputs">
                    {code.map((digit, index) => (
                        <input key={index} type="text" maxLength="1" value={digit}
                            ref={(el) => (inputs.current[index] = el)}
                            onChange={(e) => handleChange(e, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                        />
                    ))}
                </div>
                <button className="confirm-btn" onClick={handleSubmit} disabled={status.type === "loading"}>
                    {status.type === "loading" ? "Checking..." : "VERIFY CODE"}
                </button>
                {status.message && <p className={`msg ${status.type}`}>{status.message}</p>}
            </div>
        </div>
    );
}