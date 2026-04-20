import { useState, useEffect } from "react";
import "./allMyP.css";

const API_BASE = "http://localhost:5251/api";
const getToken   = () => localStorage.getItem("userToken");
const getHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  "Content-Type": "application/json",
});

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

const STATE_MAP = {
  Booked:   { cls: "pill-used",     label: "Booked"   },
  Pending:  { cls: "pill-pending",  label: "Pending"  },
  Canceled: { cls: "pill-canceled", label: "Canceled" },
  Expired:  { cls: "pill-used",     label: "Used"     },
  Delayed:  { cls: "pill-delayed",  label: "Delayed"  },
};

function TicketCard({ t, idx, onReturn }) {
  const [returning, setReturning] = useState(false);
  const exp     = isExpired(t);
  const stKey   = exp && t.state === "Booked" ? "Expired" : t.state;
  const st      = STATE_MAP[stKey] ?? { cls: "pill-used", label: t.state };
  const cd      = countdown(t.dueDate);
  const hasDsc  = t.discount > 0 && t.discount < 1;
  const varName = t.variant?.name ?? "Biznez";

  async function handleReturn() {
    if (!window.confirm("Are you sure you want to return this ticket?")) return;
    setReturning(true);
    try {
      const res = await fetch(`${API_BASE}/PlaneTicket/return/${t.id}`, {
        method: "POST",
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("Return failed.");
      onReturn(t.id);
    } catch (e) {
      alert(e.message);
      setReturning(false);
    }
  }

  return (
    <div
      className={`bp-card${exp ? " bp-card--exp" : ""}`}
      style={{ animationDelay: `${idx * 0.07}s` }}
    >
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
            <span className="bp-info-val bp-info-val--name">
              {t.passengerName ?? t.passenger ?? t.userName ?? t.fullName ?? t.name ?? "—"}
            </span>
          </div>
          <div className="bp-info-item">
            <span className="bp-info-label">Boarding</span>
            <span className="bp-info-val">{fmtTime(t.dueDate)}</span>
          </div>
          <div className="bp-info-item">
            <span className="bp-info-label">Arrival Est.</span>
            <span className="bp-info-val">{fmtArrival(t.dueDate)}</span>
          </div>
          <div className="bp-info-item">
            <span className="bp-info-label">Date</span>
            <span className="bp-info-val">{fmtDateInfo(t.dueDate)}</span>
          </div>
        </div>
        <div className="bp-chips">
          {t.gate          && <span className="bp-chip">Gate {t.gate}</span>}
          {t.seat?.name    && <span className="bp-chip">{t.seat.name}</span>}
          {t.meal          && <span className="bp-chip">{t.meal}</span>}
          {t.totalLuggageKg > 0 && <span className="bp-chip">{t.totalLuggageKg} kg luggage</span>}
          {t.hasPet        && <span className="bp-chip">🐾 Pet</span>}
          {t.hasChild      && <span className="bp-chip">👶 Child</span>}
        </div>

        {t.note && <div className="bp-note">📝 {t.note}</div>}

        {!exp && (
          <div className="bp-return-row">
            <button
              className={`bp-return-btn${returning ? " bp-return-btn--busy" : ""}`}
              onClick={handleReturn}
              disabled={returning}
            >
              {returning ? "Processing…" : "↩ Return Ticket"}
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
          <span className="bp-sb-val bp-sb-val--sm">{fmtDateSidebar(t.dueDate)}</span>
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
          {hasDsc && (
            <span className="bp-sb-orig">{Number(t.price).toFixed(2)} ₼</span>
          )}
          <span className="bp-sb-amount">
            {finalPrice(t)}<span className="bp-sb-cur"> ₼</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AllMyP() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [filter,  setFilter]  = useState("all");

  useEffect(() => {
    fetch(`${API_BASE}/PlaneTicket/my-tickets`, { headers: getHeaders() })
      .then(r => {
        if (!r.ok) throw new Error("Tickets could not be loaded.");
        return r.json();
      })
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        setTickets(arr);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  function handleReturn(id) {
    setTickets(prev => prev.filter(t => t.id !== id));
  }

  const visible = tickets.filter(t =>
    filter === "active"  ? !isExpired(t) :
    filter === "expired" ?  isExpired(t) : true
  );
  const activeCount = tickets.filter(t => !isExpired(t)).length;

  return (
    <div className="bp-page">
      <div className="bp-inner">
        <div className="bp-page-header">
          <div>
            <h1 className="bp-page-title">My Plane Tickets</h1>
            <p className="bp-page-sub">{activeCount} active · {tickets.length} total</p>
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
              <TicketCard key={t.id} t={t} idx={i} onReturn={handleReturn} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}