import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ticket.css";

const BASE_URL = import.meta.env.VITE_API_URL || "https://localhost:7001/api";

/* ── Validation rules (mirrors backend FluentValidation) ── */
const rules = {
    airline:    (v) => !v.trim() ? "The airline cannot be empty !" : v.length > 100 ? "The airline must not exceed 100 characters !" : null,
    gate:       (v) => !v.trim() ? "The gate cannot be empty !"    : v.length > 10  ? "The gate must not exceed 10 characters !"    : null,
    plane:      (v) => !v.trim() ? "The plane cannot be empty !"   : v.length > 50  ? "The plane must not exceed 50 characters !"   : null,
    meal:       (v) => !v.trim() ? "The meal cannot be empty !"    : v.length > 50  ? "The meal must not exceed 50 characters !"    : null,
    luggageKg:  (v) => Number(v) < 0 ? "The luggage weight must be greater than or equal to zero !" : null,
    dueDate:    (v) => !v ? "Flight date cannot be empty !" : null,
    fromId:     (v) => !v || Number(v) < 1 ? "From location ID must be a positive number !" : null,
    toId:       (v) => !v || Number(v) < 1 ? "To location ID must be a positive number !" : null,
    variantId:  (v) => !v || Number(v) < 1 ? "Variant ID must be a positive number !" : null,
    rowCount:   (v) => !v || Number(v) < 1 ? "Row count must be at least 1 !" : null,
    seatsPerRow:(v) => !v || Number(v) < 1 ? "Seats per row must be at least 1 !" : null,
};

const allFields = Object.keys(rules);

export default function CreateTicket() {
    const navigate = useNavigate();

    const [isGenerated, setIsGenerated]     = useState(false);
    const [loading, setLoading]             = useState(false);
    const [serverError, setServerError]     = useState(null);
    const [createdTicket, setCreatedTicket] = useState(null);
    const [touched, setTouched]             = useState({});
    const [errors, setErrors]               = useState({});

    const [form, setForm] = useState({
        airline: "", gate: "", plane: "", meal: "",
        luggageKg: 0, dueDate: "",
        fromId: "", toId: "",
        variantId: 1, rowCount: 10, seatsPerRow: 6,
    });

    /* ── Helpers ── */
    const validate = (name, value) => rules[name]?.(String(value)) ?? null;

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        const coerced = type === "number" ? (value === "" ? "" : Number(value)) : value;
        setForm((prev) => ({ ...prev, [name]: coerced }));
        if (touched[name]) {
            setErrors((prev) => ({ ...prev, [name]: validate(name, coerced) }));
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched((prev) => ({ ...prev, [name]: true }));
        setErrors((prev) => ({ ...prev, [name]: validate(name, value) }));
    };

    const validateAll = () => {
        const newErrors = {};
        const newTouched = {};
        allFields.forEach((f) => {
            newTouched[f] = true;
            newErrors[f] = validate(f, String(form[f] ?? ""));
        });
        setTouched(newTouched);
        setErrors(newErrors);
        return Object.values(newErrors).every((e) => !e);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError(null);
        if (!validateAll()) return;

        setLoading(true);
        const payload = {
            airline:    form.airline,
            gate:       form.gate,
            plane:      form.plane,
            meal:       form.meal,
            luggageKg:  Number(form.luggageKg),
            dueDate:    new Date(form.dueDate).toISOString(),
            fromId:     Number(form.fromId),
            toId:       Number(form.toId),
            seatGroups: [{
                variantId:   Number(form.variantId),
                rowCount:    Number(form.rowCount),
                seatsPerRow: Number(form.seatsPerRow),
            }],
        };

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/PlaneTicket`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.message || err?.title || `Server error: ${res.status}`);
            }

            const data = await res.json();
            setCreatedTicket(data?.data ?? data);
            setIsGenerated(true);
        } catch (err) {
            setServerError(err.message || "Bilinməyən xəta baş verdi.");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setIsGenerated(false);
        setCreatedTicket(null);
        setServerError(null);
        setTouched({});
        setErrors({});
        setForm({ airline: "", gate: "", plane: "", meal: "", luggageKg: 0, dueDate: "", fromId: "", toId: "", variantId: 1, rowCount: 10, seatsPerRow: 6 });
    };

    const formatDate = (iso) => {
        if (!iso) return "—";
        return new Date(iso).toLocaleDateString("az-AZ", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
    };

    /* ── Reusable Field ── */
    const Field = ({ label, name, type = "text", placeholder, min }) => (
        <div className={`input-group ${errors[name] && touched[name] ? "input-error" : ""}`}>
            <label>{label}</label>
            <input
                name={name}
                type={type}
                value={form[name]}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={placeholder}
                min={min}
                autoComplete="off"
            />
            {touched[name] && errors[name] && (
                <span className="field-error-msg">{errors[name]}</span>
            )}
        </div>
    );

    return (
        <div className="ticket-page-body">
            {!isGenerated ? (
                <div className="ticket-card">
                    <div className="ticket-header">
                        <div className="plane-icon-bg">✈️</div>
                        <h2><span>Create</span> Ticket</h2>
                        <p>Enter flight details to generate your digital boarding pass.</p>
                    </div>

                    <form className="ticket-form" onSubmit={handleSubmit} noValidate>

                        <p className="form-section-title">Flight Information</p>
                        <div className="form-grid form-grid-2">
                            <Field label="Airline"         name="airline"   placeholder="e.g. Turkish Airlines" />
                            <Field label="Gate"            name="gate"      placeholder="e.g. B-04" />
                            <Field label="Plane Model"     name="plane"     placeholder="e.g. Boeing 747" />
                            <Field label="Meal Preference" name="meal"      placeholder="e.g. Standard, Vegan" />
                            <Field label="Luggage (KG)"    name="luggageKg" type="number" min="0" />
                            <Field label="Flight Date"     name="dueDate"   type="datetime-local" />
                        </div>

                        <p className="form-section-title">Route</p>
                        <div className="form-grid form-grid-2">
                            <Field label="From (Location ID)" name="fromId" type="number" placeholder="e.g. 1" min="1" />
                            <Field label="To (Location ID)"   name="toId"   type="number" placeholder="e.g. 2" min="1" />
                        </div>

                        <p className="form-section-title">Seat Configuration</p>
                        <div className="form-grid form-grid-3">
                            <Field label="Variant ID"    name="variantId"   type="number" min="1" />
                            <Field label="Row Count"     name="rowCount"    type="number" min="1" />
                            <Field label="Seats Per Row" name="seatsPerRow" type="number" min="1" />
                        </div>

                        {serverError && (
                            <div className="server-error-box">⚠️ {serverError}</div>
                        )}

                        <button type="submit" className="generate-btn" disabled={loading}>
                            {loading
                                ? <span className="btn-loading"><span className="spinner" />Generating...</span>
                                : "Generate Ticket"}
                        </button>
                    </form>
                </div>
            ) : (
                <div className="boarding-pass-container animate-pop">
                    <div className="boarding-pass">
                        <div className="pass-left">
                            <div className="pass-header">
                                <div className="airline-brand">{createdTicket?.airline || form.airline || "GLOBAL AIRWAYS"}</div>
                                <div className="pass-label">BOARDING PASS</div>
                            </div>
                            <div className="pass-route">
                                <div className="city">
                                    <h1>#{createdTicket?.fromId ?? form.fromId}</h1>
                                    <p>FROM</p>
                                </div>
                                <div className="plane-fly">✈️</div>
                                <div className="city">
                                    <h1>#{createdTicket?.toId ?? form.toId}</h1>
                                    <p>TO</p>
                                </div>
                            </div>
                            <div className="pass-info-grid">
                                <div className="info-box"><span>TICKET ID</span><strong>{createdTicket?.id ?? "—"}</strong></div>
                                <div className="info-box"><span>AIRLINE</span><strong>{createdTicket?.airline || form.airline}</strong></div>
                                <div className="info-box"><span>GATE</span><strong>{createdTicket?.gate || form.gate}</strong></div>
                                <div className="info-box"><span>MODEL</span><strong>{createdTicket?.plane || form.plane}</strong></div>
                                <div className="info-box"><span>LUGGAGE</span><strong>{createdTicket?.luggageKg ?? form.luggageKg} KG</strong></div>
                                <div className="info-box"><span>TOTAL SEATS</span><strong>{createdTicket?.totalTicketsCreated ?? "—"}</strong></div>
                            </div>
                        </div>
                        <div className="pass-right">
                            <div className="stub-header">{createdTicket?.airline || form.airline}</div>
                            <div className="stub-route">#{createdTicket?.fromId ?? form.fromId} ➔ #{createdTicket?.toId ?? form.toId}</div>
                            <div className="stub-details">
                                <p>Gate: {createdTicket?.gate || form.gate}</p>
                                <p>Date: {formatDate(createdTicket?.dueDate || form.dueDate)}</p>
                                <p>Seats: {createdTicket?.totalTicketsCreated ?? "—"}</p>
                            </div>
                            <div className="barcode-area"></div>
                        </div>
                    </div>
                    <div className="action-buttons">
                        <button className="back-btn" onClick={resetForm}>Create New</button>
                        <button className="home-btn" onClick={() => navigate("/")}>Go to Home</button>
                    </div>
                </div>
            )}
        </div>
    );
}
