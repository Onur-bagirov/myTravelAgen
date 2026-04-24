import { useState, useEffect, useCallback, useRef } from "react";
import "./allMyP.css";

const API_BASE = "http://localhost:5251/api";
const getToken   = () => localStorage.getItem("userToken");
const getHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  "Content-Type": "application/json",
});

const getUserName = async () => {
  try {
    const res = await fetch(`${API_BASE}/Auth/me`, { headers: getHeaders() });
    if (!res.ok) return null;
    const data = await res.json();
    const u = data?.data ?? data;
    return [u.name, u.surname].filter(Boolean).join(" ") || null;
  } catch { return null; }
};

function fmtDateInfo(d) {
  return new Date(d).toLocaleDateString("en-US", {
    day: "numeric", month: "short", year: "numeric",
  });
}
function fmtDateSidebar(d) {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "short", day: "numeric", month: "short",
  });
}
function fmtTime(d) {
  const dt = new Date(d);
  return `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
}
function fmtArrival(d) {
  const dt = new Date(d);
  dt.setHours(dt.getHours() + 2);
  return `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
}
function countdown(d) {
  const days = Math.ceil((new Date(d) - new Date()) / 86400000);
  if (days < 0)  return null;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days} days left`;
}
function isExpired(t) { return new Date(t.dueDate) < new Date(); }

function finalPrice(t) {
  return Number(t.price || 0).toFixed(2);
}

function hasScheduleChange(oldT, newT) {
  if (!oldT || !newT) return false;
  return new Date(oldT.dueDate).getTime() !== new Date(newT.dueDate).getTime();
}

const STATE_MAP = {
  Booked:    { cls: "pill-used",     label: "Booked"    },
  Pending:   { cls: "pill-pending",  label: "Pending"   },
  Canceled:  { cls: "pill-canceled", label: "Canceled"  },
  Expired:   { cls: "pill-used",     label: "Used"      },
  Delayed:   { cls: "pill-delayed",  label: "Delayed"   },
  Available: { cls: "pill-pending",  label: "Available" },
};

function ScheduleChangeBanner({ oldDate, newDate, onDismiss }) {
  return (
    <div className="bp-schedule-banner">
      <span className="bp-schedule-banner-icon">⚠️</span>
      <div className="bp-schedule-banner-text">
        <strong>Schedule Updated</strong>
        <span>
          Departure changed from{" "}
          <s>{fmtDateInfo(oldDate)} {fmtTime(oldDate)}</s>{" "}
          to <strong>{fmtDateInfo(newDate)} {fmtTime(newDate)}</strong>.
          Check your email for details.
        </span>
      </div>
      <button className="bp-schedule-banner-close" onClick={onDismiss}>✕</button>
    </div>
  );
}

function ReturnModal({ ticket, onConfirm, onCancel, loading }) {
  const hoursLeft  = (new Date(ticket.dueDate) - new Date()) / 3_600_000;
  const refundRate = hoursLeft >= 24 ? 1.0 : 0.5;

  const paidPrice = Number(ticket.price || 0);
  const refundAmt = (paidPrice * refundRate).toFixed(2);

  return (
    <div className="bp-modal-overlay" onClick={() => !loading && onCancel()}>
      <div className="bp-modal" onClick={e => e.stopPropagation()}>
        <div className="bp-modal-header">
          <span className="bp-modal-icon">↩</span>
          <h3 className="bp-modal-title">Return Ticket?</h3>
        </div>

        <div className="bp-modal-body">
          <div className="bp-modal-route">
            {ticket.from ?? "—"} → {ticket.to ?? "—"}
          </div>
          <div className="bp-modal-date">
            {fmtDateInfo(ticket.dueDate)} · {fmtTime(ticket.dueDate)}
          </div>

          <div className="bp-modal-refund-box">
            <div className="bp-modal-refund-row">
              <span>Amount paid</span>
              <span>{paidPrice.toFixed(2)} ₼</span>
            </div>
            {refundRate < 1 && (
              <div className="bp-modal-refund-row bp-modal-refund-warn">
                <span>⚠ Less than 24h — 50% fee</span>
                <span>−{(paidPrice * 0.5).toFixed(2)} ₼</span>
              </div>
            )}
            <div className="bp-modal-refund-divider" />
            <div className="bp-modal-refund-row bp-modal-refund-total">
              <span>Refund</span>
              <span className="bp-modal-refund-amount">{refundAmt} ₼</span>
            </div>
          </div>

          <p className="bp-modal-note">
            A confirmation email will be sent to your inbox.
          </p>
        </div>

        <div className="bp-modal-actions">
          <button
            className="bp-modal-btn bp-modal-btn--cancel"
            onClick={onCancel}
            disabled={loading}
          >
            Keep Ticket
          </button>
          <button
            className={`bp-modal-btn bp-modal-btn--confirm${loading ? " bp-modal-btn--busy" : ""}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processing…" : "Confirm Return"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TicketCard({ t, idx, onReturn, userName, scheduleChange, onDismissChange }) {
  const [showModal,   setShowModal]   = useState(false);
  const [returning,   setReturning]   = useState(false);
  const [returnError, setReturnError] = useState("");

  const exp      = isExpired(t);
  const stKey    = exp && t.state === "Booked" ? "Expired" : t.state;
  const st       = STATE_MAP[stKey] ?? { cls: "pill-used", label: t.state };
  const cd       = countdown(t.dueDate);
  const varName  = t.variant?.name ?? "Biznez";
  const canReturn = !exp && t.state === "Booked";

  const passengerDisplay =
    t.passengerName ?? t.passenger ?? t.userName ?? t.fullName ?? t.name ?? userName ?? "—";

  async function handleReturn() {
    setReturning(true);
    setReturnError("");
    try {
      const res = await fetch(`${API_BASE}/PlaneTicket/return/${t.id}`, {
        method: "POST",
        headers: getHeaders(),
      });

      let result = null;
      const raw = await res.text();
      try { result = raw ? JSON.parse(raw) : null; } catch { /* ignore */ }

      if (!res.ok) {
        const msg =
          result?.message ||
          result?.data?.message ||
          result?.title ||
          `Error ${res.status}`;
        throw new Error(msg);
      }

      setShowModal(false);
      onReturn(t.id);
    } catch (e) {
      setReturnError(e.message);
      setReturning(false);
    }
  }

  return (
    <>
      <div
        className={`bp-card${exp ? " bp-card--exp" : ""}${scheduleChange ? " bp-card--changed" : ""}`}
        style={{ animationDelay: `${idx * 0.07}s` }}
      >
        {scheduleChange && (
          <ScheduleChangeBanner
            oldDate={scheduleChange.oldDate}
            newDate={scheduleChange.newDate}
            onDismiss={() => onDismissChange(t.id)}
          />
        )}

        <div className="bp-main">
          <div className="bp-topbar">
            <div className="bp-topbar-left">
              <div className="bp-icon-btn">✈</div>
              <span className="bp-topbar-title">BOARDING PASS</span>
              <span className="bp-topbar-sep">·</span>
              <span className="bp-topbar-variant">{varName.toUpperCase()}</span>
            </div>
            <div className="bp-topbar-pills">
              <span className={`bp-pill ${st.cls}`}>{st.label}</span>
              {t.variant?.isPriority && (
                <span className="bp-pill pill-priority">Priority</span>
              )}
            </div>
          </div>

          <div className="bp-route">
            <div className="bp-city-col">
              <span className="bp-city-label">FROM</span>
              <p className="bp-city">
                {t.from ?? t.fromCity ?? "—"}
                <span className="bp-city-dot">•</span>
              </p>
            </div>
            <div className="bp-route-track">
              <div className="bp-track-line">
                <span className="bp-dot bp-dot--filled" />
                <span className="bp-dash" />
                <span className="bp-track-plane">✈</span>
                <span className="bp-dash" />
                <span className="bp-dot" />
              </div>
              {exp ? (
                <span className="bp-track-badge">Completed</span>
              ) : cd ? (
                <span className="bp-track-badge bp-track-badge--live">{cd.toUpperCase()}</span>
              ) : null}
            </div>
            <div className="bp-city-col bp-city-col--r">
              <span className="bp-city-label">TO</span>
              <p className="bp-city">{t.to ?? t.toCity ?? "—"}</p>
            </div>
          </div>

          <div className="bp-info-row">
            <div className="bp-info-item">
              <span className="bp-info-label">Passenger</span>
              <span className="bp-info-val bp-info-val--name">{passengerDisplay}</span>
            </div>
            <div className="bp-info-item">
              <span className="bp-info-label">Boarding</span>
              <span className={`bp-info-val${scheduleChange ? " bp-info-val--updated" : ""}`}>
                {fmtTime(t.dueDate)}
              </span>
            </div>
            <div className="bp-info-item">
              <span className="bp-info-label">Arrival Est.</span>
              <span className="bp-info-val">{fmtArrival(t.dueDate)}</span>
            </div>
            <div className="bp-info-item">
              <span className="bp-info-label">Date</span>
              <span className={`bp-info-val${scheduleChange ? " bp-info-val--updated" : ""}`}>
                {fmtDateInfo(t.dueDate)}
              </span>
            </div>
          </div>

          <div className="bp-chips">
            {t.gate               && <span className="bp-chip">Gate {t.gate}</span>}
            {t.seat?.name         && <span className="bp-chip">{t.seat.name}</span>}
            {t.meal               && <span className="bp-chip">{t.meal}</span>}
            {t.totalLuggageKg > 0 && <span className="bp-chip">{t.totalLuggageKg} kg luggage</span>}
            {t.hasPet             && <span className="bp-chip">🐾 Pet</span>}
            {t.hasChild           && <span className="bp-chip">👶 Child</span>}
          </div>

          {t.note && <div className="bp-note">📝 {t.note}</div>}

          {returnError && (
            <div className="bp-return-error">⚠ {returnError}</div>
          )}

          {canReturn && (
            <div className="bp-return-row">
              <button
                className="bp-return-btn"
                onClick={() => { setReturnError(""); setShowModal(true); }}
              >
                ↩ Return Ticket
              </button>
            </div>
          )}
        </div>

        <div className="bp-sidebar">
          <div className="bp-sb-row">
            <span className="bp-sb-label">Airline</span>
            <span className="bp-sb-val">{t.airline ?? "—"}</span>
          </div>
          {t.plane && (
            <div className="bp-sb-row">
              <span className="bp-sb-label">Flight</span>
              <span className="bp-sb-val">{t.plane}</span>
            </div>
          )}
          <div className="bp-sb-row">
            <span className="bp-sb-label">Date</span>
            <span className={`bp-sb-val bp-sb-val--sm${scheduleChange ? " bp-info-val--updated" : ""}`}>
              {fmtDateSidebar(t.dueDate)}
            </span>
          </div>
          {t.gate && (
            <div className="bp-sb-row">
              <span className="bp-sb-label">Gate</span>
              <span className="bp-sb-val">{t.gate}</span>
            </div>
          )}
          <div className="bp-sb-badges">
            <span className={`bp-sb-pill ${st.cls}`}>{st.label}</span>
            {t.variant?.isPriority && (
              <span className="bp-sb-pill pill-priority">Priority</span>
            )}
          </div>
          <div className="bp-sb-price">
            <span className="bp-sb-label">Price</span>
            <span className="bp-sb-amount">
              {finalPrice(t)}<span className="bp-sb-cur"> ₼</span>
            </span>
          </div>
        </div>
      </div>

      {showModal && (
        <ReturnModal
          ticket={t}
          loading={returning}
          onCancel={() => { if (!returning) { setShowModal(false); setReturnError(""); } }}
          onConfirm={handleReturn}
        />
      )}
    </>
  );
}

export default function AllMyP() {
  const [tickets,         setTickets]         = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState("");
  const [filter,          setFilter]          = useState("all");
  const [userName,        setUserName]        = useState("");
  const [lastRefresh,     setLastRefresh]     = useState(null);
  const [scheduleChanges, setScheduleChanges] = useState({});
  const prevTicketsRef = useRef({});

  const fetchTickets = useCallback(async (isInitial = false) => {
    try {
      const res = await fetch(`${API_BASE}/PlaneTicket/my-tickets`, { headers: getHeaders() });
      if (!res.ok) throw new Error("Tickets could not be loaded.");
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];

      if (!isInitial) {
        const newChanges = {};
        arr.forEach(newT => {
          const oldT = prevTicketsRef.current[newT.id];
          if (oldT && newT.state === "Booked" && hasScheduleChange(oldT, newT)) {
            newChanges[newT.id] = { oldDate: oldT.dueDate, newDate: newT.dueDate };
          }
        });
        if (Object.keys(newChanges).length > 0)
          setScheduleChanges(prev => ({ ...prev, ...newChanges }));
      }

      const byId = {};
      arr.forEach(t => { byId[t.id] = t; });
      prevTicketsRef.current = byId;

      setTickets(arr);
      setLastRefresh(new Date());
      if (isInitial) setLoading(false);
    } catch (e) {
      if (isInitial) { setError(e.message); setLoading(false); }
    }
  }, []);

  useEffect(() => {
    getUserName().then(n => { if (n) setUserName(n); });
    fetchTickets(true);
  }, [fetchTickets]);

  useEffect(() => {
    const id = setInterval(() => fetchTickets(false), 30_000);
    return () => clearInterval(id);
  }, [fetchTickets]);

  function handleReturn(id) {
    setTickets(prev => prev.filter(t => t.id !== id));
    setScheduleChanges(prev => { const n = { ...prev }; delete n[id]; return n; });
  }

  function handleDismissChange(id) {
    setScheduleChanges(prev => { const n = { ...prev }; delete n[id]; return n; });
  }

  const visible = tickets.filter(t =>
    filter === "active"  ? !isExpired(t) :
    filter === "expired" ?  isExpired(t) : true
  );
  const activeCount  = tickets.filter(t => !isExpired(t)).length;
  const changedCount = Object.keys(scheduleChanges).length;

  return (
    <div className="bp-page">
      <div className="bp-inner">

        <div className="bp-page-header">
          <div>
            <h1 className="bp-page-title">My Plane Tickets</h1>
            <p className="bp-page-sub">
              {activeCount} active · {tickets.length} total
              {changedCount > 0 && (
                <span className="bp-change-badge"> · {changedCount} schedule update{changedCount > 1 ? "s" : ""} ⚠️</span>
              )}
            </p>
            {lastRefresh && (
              <p className="bp-last-refresh">
                Last updated: {lastRefresh.toLocaleTimeString()}
                <button className="bp-refresh-btn" onClick={() => fetchTickets(false)} title="Refresh">↻</button>
              </p>
            )}
          </div>
          <div className="bp-filters">
            {[
              { key: "all",     label: "All"    },
              { key: "active",  label: "Active" },
              { key: "expired", label: "Past"   },
            ].map(f => (
              <button
                key={f.key}
                className={`bp-filter-btn${filter === f.key ? " bp-filter-btn--on" : ""}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="bp-list">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bp-skeleton" style={{ animationDelay: `${i * 0.12}s` }} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="bp-empty"><span className="bp-empty-ico">⚠</span><p>{error}</p></div>
        )}

        {!loading && !error && visible.length === 0 && (
          <div className="bp-empty">
            <span className="bp-empty-ico">✈</span>
            <p>
              {filter === "active"  ? "No active tickets."  :
               filter === "expired" ? "No past tickets."    :
               "You haven't purchased any tickets yet."}
            </p>
          </div>
        )}

        {!loading && !error && visible.length > 0 && (
          <div className="bp-list">
            {visible.map((t, i) => (
              <TicketCard
                key={t.id}
                t={t}
                idx={i}
                onReturn={handleReturn}
                userName={userName}
                scheduleChange={scheduleChanges[t.id] ?? null}
                onDismissChange={handleDismissChange}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}