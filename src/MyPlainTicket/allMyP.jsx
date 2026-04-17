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
function finalPrice(t) { return (t.price * (t.discount || 1)).toFixed(2); }

const STATE_MAP = {
  Booked:   { cls: "s-booked",   label: "Booked"   },
  Pending:  { cls: "s-pending",  label: "Pending"  },
  Canceled: { cls: "s-canceled", label: "Canceled" },
  Expired:  { cls: "s-expired",  label: "Expired"  },
  Delayed:  { cls: "s-delayed",  label: "Delayed"  },
};

function TicketCard({ t, idx }) {
  const exp    = isExpired(t);
  const cd     = countdown(t.dueDate);
  const st     = STATE_MAP[t.state] ?? { cls: "s-expired", label: t.state };
  const hasDsc = t.discount > 0 && t.discount < 1;
  const varName = t.variant?.name ?? "Standard";

  return (
    <div
      className={`bp-card${exp ? " bp-card--exp" : ""}`}
      style={{ animationDelay: `${idx * 0.07}s` }}
    >
      {/* ── LEFT MAIN SECTION ── */}
      <div className="bp-main">

        {/* Header bar */}
        <div className="bp-header">
          <div className="bp-header-left">
            <div className="bp-plane-icon">✈</div>
            <span className="bp-title">BOARDING PASS</span>
            <span className="bp-title-sep">·</span>
            <span className="bp-class-badge">{varName.toUpperCase()}</span>
          </div>
          <div className="bp-header-right">
            <span className="bp-status-pill bp-status-booked">{st.label}</span>
            {t.variant?.isPriority && (
              <>
                <span className="bp-status-dot">·</span>
                <span className="bp-status-pill bp-status-priority">Priority</span>
              </>
            )}
          </div>
        </div>

        {/* BIG ROUTE ROW */}
        <div className="bp-route">
          {/* FROM */}
          <div className="bp-from-block">
            <span className="bp-from-label">From</span>
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <span className="bp-iata">{t.from ?? t.fromCity ?? "—"}</span>
              <span className="bp-iata-dot"> •</span>
            </div>
            {t.fromCity && t.from && (
              <span className="bp-city-name">{t.fromCity}</span>
            )}
          </div>

          {/* Track */}
          <div className="bp-track">
            <div className="bp-track-line">
              <span className="bp-dot bp-dot--filled" />
              <span className="bp-dash" />
              <span className="bp-fly-ico">✈</span>
              <span className="bp-dash" />
              <span className="bp-dot" />
            </div>
            {exp && (
              <span className="bp-route-sub">COMPLETED</span>
            )}
            {!exp && cd && (
              <span className="bp-route-sub bp-route-sub--green">{cd}</span>
            )}
            {!exp && !cd && (
              <span className="bp-route-sub">DIRECT</span>
            )}
          </div>

          {/* TO */}
          <div className="bp-to-block">
            <span className="bp-to-label">To</span>
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <span className="bp-iata">{t.to ?? t.toCity ?? "—"}</span>
            </div>
            {t.toCity && t.to && (
              <span className="bp-city-name" style={{ textAlign: "right" }}>{t.toCity}</span>
            )}
          </div>
        </div>

        {/* PASSENGER + DETAILS ROW */}
        <div className="bp-details-row">
          <div className="bp-detail-item">
            <span className="bp-detail-label">Passenger</span>
            <span className="bp-detail-val bp-detail-val--pax">
              {t.passengerName ?? t.passenger ?? t.userName ?? t.fullName ?? t.name ?? "—"}
            </span>
          </div>
          <div className="bp-detail-item">
            <span className="bp-detail-label">Boarding</span>
            <span className="bp-detail-val">{fmtTime(t.dueDate)}</span>
          </div>
          <div className="bp-detail-item">
            <span className="bp-detail-label">Arrival Est.</span>
            <span className="bp-detail-val">{fmtArrival(t.dueDate)}</span>
          </div>
          <div className="bp-detail-item">
            <span className="bp-detail-label">Date</span>
            <span className="bp-detail-val">{fmtDateInfo(t.dueDate)}</span>
          </div>
        </div>

        {/* CHIPS ROW */}
        <div className="bp-chips">
          {t.gate && (
            <span className="bp-chip bp-chip--gate">Gate {t.gate}</span>
          )}
          {t.seat?.name && (
            <span className="bp-chip bp-chip--class">{t.seat.name}</span>
          )}
          {t.meal && (
            <span className="bp-chip bp-chip--meal">{t.meal}</span>
          )}
          {t.totalLuggageKg > 0 && (
            <span className="bp-chip bp-chip--bag">{t.totalLuggageKg} kg luggage</span>
          )}
          {t.hasPet && (
            <span className="bp-chip bp-chip--misc">🐾 Pet</span>
          )}
          {t.hasChild && (
            <span className="bp-chip bp-chip--misc">👶 Child</span>
          )}
        </div>

        {t.note && <div className="bp-note">📝 {t.note}</div>}
      </div>

      {/* ── PERFORATION DIVIDER ── */}
      <div className="bp-divider" />

      {/* ── RIGHT SIDEBAR ── */}
      <div className="bp-sidebar">
        <div className="bp-sb-row">
          <span className="bp-sb-label">Airline</span>
          <span className="bp-sb-val">{t.airline}</span>
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

        {/* Status badges */}
        <div className="bp-sb-badges">
          <span className={`bp-badge ${st.cls}`}>{st.label}</span>
          {t.variant?.isPriority && (
            <span className="bp-badge bp-badge--pri">Priority</span>
          )}
        </div>

        {/* Price */}
        <div className="bp-sb-price-section">
          <div className="bp-sb-price-label">Price</div>
          {hasDsc && (
            <div className="bp-sb-price-orig">{t.price.toFixed(2)} ₼</div>
          )}
          <div className="bp-sb-price-val">
            {finalPrice(t)}<span className="bp-sb-currency"> ₼</span>
          </div>
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
        if (arr.length > 0) console.log("🎫 Ticket fields:", Object.keys(arr[0]), arr[0]);
        setTickets(arr);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

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
          <div className="bp-empty">
            <span className="bp-empty-ico">⚠</span>
            <p>{error}</p>
          </div>
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
              <TicketCard key={t.id} t={t} idx={i} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}