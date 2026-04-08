import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./showPlane.css";

const BASE_URL = import.meta.env.VITE_API_URL || "https://localhost:7001/api";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric"
  });
}
function fmtTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
function countdown(d) {
  const days = Math.ceil((new Date(d) - new Date()) / 86400000);
  if (days < 0) return null;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days}d away`;
}

const STATE_COLOR = {
  Pending:  "#22c55e",
  Delayed:  "#f59e0b",
  Canceled: "#ef4444",
  Expired:  "#6b7280",
  Missed:   "#a855f7",
};

export default function ShowPlaneTicket() {
  const navigate = useNavigate();
  const routerLocation = useLocation();

  // Newly created ticket passed via navigation state
  const newTicketId = routerLocation.state?.newTicketId ?? null;

  const [tickets, setTickets]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [highlightId, setHighlightId] = useState(newTicketId);

  // Filters
  const [airline, setAirline]     = useState("");
  const [fromId, setFromId]       = useState("");
  const [toId, setToId]           = useState("");
  const [date, setDate]           = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10;

  // Locations for dropdowns
  const [locations, setLocations] = useState([]);

  // Fetch locations for filter dropdowns
  useEffect(() => {
    const fetchLocs = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${BASE_URL}/Location?Limit=200&Page=1`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        const items = data?.items ?? data?.data ?? data ?? [];
        setLocations(Array.isArray(items) ? items : []);
      } catch (_) {}
    };
    fetchLocs();
  }, []);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      params.set("PageNumber", pageNumber);
      params.set("PageSize", pageSize);
      if (airline.trim()) params.set("Airline", airline.trim());
      if (fromId) params.set("FromLocationId", fromId);
      if (toId)   params.set("ToLocationId", toId);
      if (date)   params.set("Date", new Date(date).toISOString());

      const res = await fetch(`${BASE_URL}/PlaneTicket?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setTickets(data?.items ?? data?.data ?? []);
      setTotalCount(data?.totalCount ?? (data?.items ?? []).length);
    } catch (err) {
      setError(err.message || "Failed to load tickets.");
    } finally {
      setLoading(false);
    }
  }, [airline, fromId, toId, date, pageNumber]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Auto-clear highlight after 4s
  useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => setHighlightId(null), 4000);
    return () => clearTimeout(t);
  }, [highlightId]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPageNumber(1);
    fetchTickets();
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const locOptions = locations.map(l => (
    <option key={l.id} value={l.id}>{l.name}{l.country ? ` (${l.country})` : ""}</option>
  ));

  return (
    <div className="spt-page">
      {/* ── Header ── */}
      <div className="spt-header">
        <button className="spt-back-btn" onClick={() => navigate("/Show-Ticket")}>
          ← Back
        </button>
        <div className="spt-title-block">
          <span className="spt-icon">✈️</span>
          <div>
            <h1 className="spt-title">Plane Tickets</h1>
            <p className="spt-meta">{totalCount} ticket{totalCount !== 1 ? "s" : ""} found</p>
          </div>
        </div>
        <button
          className="spt-create-btn"
          onClick={() => navigate("/create-plane-ticket")}
        >
          ＋ Create Ticket
        </button>
      </div>

      {/* ── New ticket banner ── */}
      {newTicketId && (
        <div className="spt-new-banner">
          ✅ Plane ticket <strong>#{newTicketId}</strong> created successfully! It's highlighted below.
        </div>
      )}

      {/* ── Filters ── */}
      <form className="spt-filters" onSubmit={handleSearch}>
        <div className="spt-filter-grid">
          <div className="spt-filter-group">
            <label>Airline</label>
            <input
              type="text"
              placeholder="e.g. AZAL"
              value={airline}
              onChange={e => setAirline(e.target.value)}
            />
          </div>
          <div className="spt-filter-group">
            <label>From Location</label>
            <select
              value={fromId}
              onChange={e => setFromId(e.target.value)}
              className="spt-select"
            >
              <option value="">— Any —</option>
              {locOptions}
            </select>
          </div>
          <div className="spt-filter-group">
            <label>To Location</label>
            <select
              value={toId}
              onChange={e => setToId(e.target.value)}
              className="spt-select"
            >
              <option value="">— Any —</option>
              {locOptions}
            </select>
          </div>
          <div className="spt-filter-group">
            <label>Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
        </div>
        <div className="spt-filter-actions">
          <button type="submit" className="spt-search-btn">Search</button>
          <button type="button" className="spt-reset-btn" onClick={() => {
            setAirline(""); setFromId(""); setToId(""); setDate(""); setPageNumber(1);
          }}>Reset</button>
        </div>
      </form>

      {/* ── Content ── */}
      <div className="spt-content">
        {loading && (
          <div className="spt-state">
            <div className="spt-spinner" />
            <p>Loading tickets…</p>
          </div>
        )}

        {error && !loading && (
          <div className="spt-state spt-error">
            <span>⚠️</span>
            <p>{error}</p>
            <button onClick={fetchTickets}>Retry</button>
          </div>
        )}

        {!loading && !error && tickets.length === 0 && (
          <div className="spt-state">
            <span className="spt-empty-icon">✈️</span>
            <p>No tickets found for your search.</p>
            <button className="spt-create-empty-btn" onClick={() => navigate("/create-plane-ticket")}>
              ＋ Create First Ticket
            </button>
          </div>
        )}

        {!loading && !error && tickets.length > 0 && (
          <div className="spt-grid">
            {tickets.map(ticket => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                isNew={ticket.id === highlightId}
                locations={locations}
              />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && totalPages > 1 && (
          <div className="spt-pagination">
            <button
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber(p => Math.max(1, p - 1))}
            >
              ← Prev
            </button>
            <span>{pageNumber} / {totalPages}</span>
            <button
              disabled={pageNumber >= totalPages}
              onClick={() => setPageNumber(p => Math.min(totalPages, p + 1))}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}