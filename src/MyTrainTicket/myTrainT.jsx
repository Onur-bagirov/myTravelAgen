import { useState, useEffect, useCallback, useRef } from "react";
import "./myTrainT.css";

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
  const base = Number(t.price || 0);
  return (t.discount > 0 && t.discount < 1 ? base * t.discount : base).toFixed(2);
}
function hasScheduleChange(oldT, newT) {
  if (!oldT || !newT) return false;
  return new Date(oldT.dueDate).getTime() !== new Date(newT.dueDate).getTime();
}

const STATE_MAP = {
  Booked:    { cls: "pill-booked",   label: "Booked"    },
  Pending:   { cls: "pill-pending",  label: "Pending"   },
  Canceled:  { cls: "pill-canceled", label: "Canceled"  },
  Expired:   { cls: "pill-used",     label: "Used"      },
  Delayed:   { cls: "pill-delayed",  label: "Delayed"   },
  Available: { cls: "pill-pending",  label: "Available" },
};

function ScheduleChangeBanner({ oldDate, newDate, onDismiss }) {
  return (
    <div className="tr-schedule-banner">
      <span className="tr-schedule-banner-icon">⚠️</span>
      <div className="tr-schedule-banner-text">
        <strong>Schedule Updated</strong>
        <span>
          Departure changed from{" "}
          <s>{fmtDateInfo(oldDate)} {fmtTime(oldDate)}</s>{" "}
          to <strong>{fmtDateInfo(newDate)} {fmtTime(newDate)}</strong>.
          Check your email for details.
        </span>
      </div>
      <button className="tr-schedule-banner-close" onClick={onDismiss}>✕</button>
    </div>
  );
}

function ReturnModal({ ticket, onConfirm, onCancel, loading }) {
  const hoursLeft  = (new Date(ticket.dueDate) - new Date()) / 3_600_000;
  const refundRate = hoursLeft >= 24 ? 1.0 : 0.5;
  const paidPrice  = Number(ticket.price || 0);
  const refundAmt  = (paidPrice * refundRate).toFixed(2);

  return (
    <div className="tr-modal-overlay" onClick={() => !loading && onCancel()}>
      <div className="tr-modal" onClick={e => e.stopPropagation()}>
        <div className="tr-modal-header">
          <span className="tr-modal-icon">↩</span>
          <h3 className="tr-modal-title">Return Ticket?</h3>
        </div>

        <div className="tr-modal-body">
          <div className="tr-modal-route">
            {ticket.from ?? "—"} → {ticket.to ?? "—"}
          </div>
          <div className="tr-modal-meta">
            {ticket.trainCompany} · #{ticket.trainNumber} · Coach {ticket.vagonNumber}
          </div>
          <div className="tr-modal-date">
            {fmtDateInfo(ticket.dueDate)} · {fmtTime(ticket.dueDate)}
          </div>

          <div className="tr-modal-refund-box">
            <div className="tr-modal-refund-row">
              <span>Amount paid</span>
              <span>{paidPrice.toFixed(2)} ₼</span>
            </div>
            {refundRate < 1 && (
              <div className="tr-modal-refund-row tr-modal-refund-warn">
                <span>⚠ Less than 24h — 50% fee</span>
                <span>−{(paidPrice * 0.5).toFixed(2)} ₼</span>
              </div>
            )}
            <div className="tr-modal-refund-divider" />
            <div className="tr-modal-refund-row tr-modal-refund-total">
              <span>Refund</span>
              <span className="tr-modal-refund-amount">{refundAmt} ₼</span>
            </div>
          </div>

          <p className="tr-modal-note">
            A confirmation email will be sent to your inbox.
          </p>
        </div>

        <div className="tr-modal-actions">
          <button
            className="tr-modal-btn tr-modal-btn--cancel"
            onClick={onCancel}
            disabled={loading}
          >
            Keep Ticket
          </button>
          <button
            className={`tr-modal-btn tr-modal-btn--confirm${loading ? " tr-modal-btn--busy" : ""}`}
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

function TrainTicketCard({ t, idx, onReturn, userName, scheduleChange, onDismissChange }) {
  const [showModal,   setShowModal]   = useState(false);
  const [returning,   setReturning]   = useState(false);
  const [returnError, setReturnError] = useState("");

  const exp      = isExpired(t);
  const stKey    = exp && t.state === "Booked" ? "Expired" : t.state;
  const st       = STATE_MAP[stKey] ?? { cls: "pill-used", label: t.state };
  const cd       = countdown(t.dueDate);
  const hasDsc   = t.discount > 0 && t.discount < 1;
  const varName  = t.variantName ?? t.variant?.name ?? "Standart";
  const canReturn = !exp && t.state === "Booked";

  const passengerDisplay =
    t.passengerName ?? t.passenger ?? t.userName ?? t.fullName ?? t.name ?? userName ?? "—";

  async function handleReturn() {
    setReturning(true);
    setReturnError("");
    try {
      const res = await fetch(`${API_BASE}/TrainTicket/return/${t.id}`, {
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
        className={`tr-card${exp ? " tr-card--exp" : ""}${scheduleChange ? " tr-card--changed" : ""}`}
        style={{ animationDelay: `${idx * 0.07}s` }}
      >
        {scheduleChange && (
          <ScheduleChangeBanner
            oldDate={scheduleChange.oldDate}
            newDate={scheduleChange.newDate}
            onDismiss={() => onDismissChange(t.id)}
          />
        )}

        <div className="tr-main">
          <div className="tr-topbar">
            <div className="tr-topbar-left">
              <div className="tr-icon-btn">🚆</div>
              <span className="tr-topbar-title">TRAIN TICKET</span>
              <span className="tr-topbar-sep">·</span>
              <span className="tr-topbar-variant">{varName.toUpperCase()}</span>
            </div>
            <div className="tr-topbar-pills">
              <span className={`tr-pill ${st.cls}`}>{st.label}</span>
              {t.variant?.isPriority && (
                <span className="tr-pill pill-priority">Priority</span>
              )}
            </div>
          </div>

          <div className="tr-route">
            <div className="tr-city-col">
              <span className="tr-city-label">FROM</span>
              <p className="tr-city">
                {t.from ?? "—"}
                <span className="tr-city-dot">•</span>
              </p>
            </div>
            <div className="tr-route-track">
              <div className="tr-track-line">
                <span className="tr-dot tr-dot--filled" />
                <span className="tr-dash" />
                <span className="tr-track-loco">🚆</span>
                <span className="tr-dash" />
                <span className="tr-dot" />
              </div>
              {exp ? (
                <span className="tr-track-badge">Completed</span>
              ) : cd ? (
                <span className="tr-track-badge tr-track-badge--live">{cd.toUpperCase()}</span>
              ) : null}
            </div>
            <div className="tr-city-col tr-city-col--r">
              <span className="tr-city-label">TO</span>
              <p className="tr-city">{t.to ?? "—"}</p>
            </div>
          </div>

          <div className="tr-info-row">
            <div className="tr-info-item">
              <span className="tr-info-label">Passenger</span>
              <span className="tr-info-val tr-info-val--name">{passengerDisplay}</span>
            </div>
            <div className="tr-info-item">
              <span className="tr-info-label">Departure</span>
              <span className={`tr-info-val${scheduleChange ? " tr-info-val--updated" : ""}`}>
                {fmtTime(t.dueDate)}
              </span>
            </div>
            <div className="tr-info-item">
              <span className="tr-info-label">Arrival Est.</span>
              <span className="tr-info-val">{fmtArrival(t.dueDate)}</span>
            </div>
            <div className="tr-info-item">
              <span className="tr-info-label">Date</span>
              <span className={`tr-info-val${scheduleChange ? " tr-info-val--updated" : ""}`}>
                {fmtDateInfo(t.dueDate)}
              </span>
            </div>
          </div>

          <div className="tr-chips">
            {t.vagonNumber && <span className="tr-chip">Vagon Number {t.vagonNumber}</span>}
            {t.seat?.name  && <span className="tr-chip">{t.seat.name}</span>}
            {(t.luggageCount > 0 || t.totalLuggageKg > 0) && (
              <span className="tr-chip">
                {t.luggageCount ?? 1} bags · {t.totalLuggageKg ?? 0} kg
              </span>
            )}
            {t.hasPet   && <span className="tr-chip">🐾 Pet</span>}
            {t.hasChild && <span className="tr-chip">👶 Child</span>}
          </div>

          {t.note && <div className="tr-note">📝 {t.note}</div>}

          {returnError && (
            <div className="tr-return-error">⚠ {returnError}</div>
          )}

          {canReturn && (
            <div className="tr-return-row">
              <button
                className="tr-return-btn"
                onClick={() => { setReturnError(""); setShowModal(true); }}
              >
                ↩ Return Ticket
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="tr-sidebar">
          <div className="tr-sb-row">
            <span className="tr-sb-label">Company</span>
            <span className="tr-sb-val">{t.trainCompany ?? "—"}</span>
          </div>
          {t.trainNumber && (
            <div className="tr-sb-row">
              <span className="tr-sb-label">Train</span>
              <span className="tr-sb-val">#{t.trainNumber}</span>
            </div>
          )}
          <div className="tr-sb-row">
            <span className="tr-sb-label">Date</span>
            <span className={`tr-sb-val tr-sb-val--sm${scheduleChange ? " tr-info-val--updated" : ""}`}>
              {fmtDateSidebar(t.dueDate)}
            </span>
          </div>
          {t.vagonNumber && (
            <div className="tr-sb-row">
              <span className="tr-sb-label">Coach</span>
              <span className="tr-sb-val">{t.vagonNumber}</span>
            </div>
          )}
          <div className="tr-sb-badges">
            <span className={`tr-sb-pill ${st.cls}`}>{st.label}</span>
            {t.variant?.isPriority && (
              <span className="tr-sb-pill pill-priority">Priority</span>
            )}
          </div>
          <div className="tr-sb-price">
            <span className="tr-sb-label">Price</span>
            {hasDsc && (
              <span className="tr-sb-orig">{Number(t.price).toFixed(2)} ₼</span>
            )}
            <span className="tr-sb-amount">
              {finalPrice(t)}<span className="tr-sb-cur"> ₼</span>
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

export default function AllMyTrainTickets() {
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
      const res = await fetch(`${API_BASE}/TrainTicket/my-tickets`, { headers: getHeaders() });
      if (!res.ok) throw new Error("Tickets could not be loaded.");
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data?.data ?? [];

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
    <div className="tr-page">
      <div className="tr-inner">

        <div className="tr-page-header">
          <div>
            <h1 className="tr-page-title">My Train Tickets</h1>
            <p className="tr-page-sub">
              {activeCount} active · {tickets.length} total
              {changedCount > 0 && (
                <span className="tr-change-badge"> · {changedCount} schedule update{changedCount > 1 ? "s" : ""} ⚠️</span>
              )}
            </p>
            {lastRefresh && (
              <p className="tr-last-refresh">
                Last updated: {lastRefresh.toLocaleTimeString()}
                <button className="tr-refresh-btn" onClick={() => fetchTickets(false)} title="Refresh">↻</button>
              </p>
            )}
          </div>
          <div className="tr-filters">
            {[
              { key: "all",     label: "All"    },
              { key: "active",  label: "Active" },
              { key: "expired", label: "Past"   },
            ].map(f => (
              <button
                key={f.key}
                className={`tr-filter-btn${filter === f.key ? " tr-filter-btn--on" : ""}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="tr-list">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="tr-skeleton" style={{ animationDelay: `${i * 0.12}s` }} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="tr-empty">
            <span className="tr-empty-ico">⚠</span>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && visible.length === 0 && (
          <div className="tr-empty">
            <span className="tr-empty-ico">🚆</span>
            <p>
              {filter === "active"  ? "No active tickets."  :
               filter === "expired" ? "No past tickets."    :
               "You haven't purchased any tickets yet."}
            </p>
          </div>
        )}

        {!loading && !error && visible.length > 0 && (
          <div className="tr-list">
            {visible.map((t, i) => (
              <TrainTicketCard
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