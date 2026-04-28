import { useState } from "react";

const initialAccounts = [
  {
    id: 1,
    name: "Netflix",
    category: "Streaming",
    email: "family@email.com",
    password: "Netfl1x!2024",
    isSubscription: true,
    isActive: true,
    monthlyCost: 22.99,
    notes: "4K plan, up to 4 screens",
    icon: "▶",
    color: "#E50914",
  },
  {
    id: 2,
    name: "Spotify",
    category: "Music",
    email: "family@email.com",
    password: "Sp0tify#Family",
    isSubscription: true,
    isActive: true,
    monthlyCost: 16.99,
    notes: "Family plan — 6 accounts",
    icon: "♪",
    color: "#1DB954",
  },
  {
    id: 3,
    name: "McDonald's",
    category: "Food & Dining",
    email: "family@email.com",
    password: "McD0nalds2024!",
    isSubscription: false,
    isActive: true,
    monthlyCost: null,
    notes: "MyMcDonald's Rewards account",
    icon: "M",
    color: "#FFC72C",
  },
  {
    id: 4,
    name: "Walmart",
    category: "Shopping",
    email: "family@email.com",
    password: "Walm@rt#Family",
    isSubscription: false,
    isActive: true,
    monthlyCost: null,
    notes: "Walmart+ membership linked",
    icon: "★",
    color: "#0071CE",
  },
];

const CATEGORIES = ["All", "Streaming", "Music", "Food & Dining", "Shopping", "Gaming", "Finance", "Other"];

const EyeIcon = ({ open }) => open ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);

const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

function AccountModal({ account, onClose, onSave }) {
  const empty = {
    name: "", category: "Other", email: "", password: "",
    isSubscription: false, isActive: true, monthlyCost: "", notes: "", icon: "◆", color: "#6366f1"
  };
  const [form, setForm] = useState(account || empty);

  const handleSave = () => {
    if (!form.name || !form.email || !form.password) return;
    onSave({ ...form, monthlyCost: form.isSubscription ? parseFloat(form.monthlyCost) || 0 : null });
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px"
    }}>
      <div style={{
        background: "#0f1117", border: "1px solid #2a2d3a", borderRadius: "20px",
        padding: "32px", width: "100%", maxWidth: "480px",
        boxShadow: "0 25px 80px rgba(0,0,0,0.6)"
      }}>
        <h2 style={{ margin: "0 0 24px", fontSize: "20px", fontFamily: "'Syne', sans-serif", color: "#f0f0f0", fontWeight: 700 }}>
          {account ? "Edit Account" : "Add New Account"}
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {[
            { label: "Service Name *", key: "name", placeholder: "e.g. Netflix" },
            { label: "Email / Username *", key: "email", placeholder: "family@example.com" },
            { label: "Password *", key: "password", placeholder: "••••••••", type: "password" },
            { label: "Notes", key: "notes", placeholder: "Optional notes..." },
          ].map(({ label, key, placeholder, type }) => (
            <div key={key}>
              <label style={{ display: "block", fontSize: "11px", color: "#888", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px", fontFamily: "'DM Mono', monospace" }}>{label}</label>
              <input
                type={type || "text"}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                style={{
                  width: "100%", background: "#171922", border: "1px solid #2a2d3a",
                  borderRadius: "10px", padding: "10px 14px", color: "#f0f0f0",
                  fontSize: "14px", fontFamily: "'DM Mono', monospace", outline: "none",
                  boxSizing: "border-box", transition: "border-color 0.2s"
                }}
              />
            </div>
          ))}

          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#888", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px", fontFamily: "'DM Mono', monospace" }}>Category</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              style={{
                width: "100%", background: "#171922", border: "1px solid #2a2d3a",
                borderRadius: "10px", padding: "10px 14px", color: "#f0f0f0",
                fontSize: "14px", fontFamily: "'DM Mono', monospace", outline: "none", boxSizing: "border-box"
              }}
            >
              {CATEGORIES.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", userSelect: "none" }}>
              <input type="checkbox" checked={form.isSubscription} onChange={e => setForm(f => ({ ...f, isSubscription: e.target.checked }))} style={{ accentColor: "#818cf8" }} />
              <span style={{ fontSize: "13px", color: "#ccc", fontFamily: "'DM Mono', monospace" }}>Subscription</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", userSelect: "none" }}>
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} style={{ accentColor: "#34d399" }} />
              <span style={{ fontSize: "13px", color: "#ccc", fontFamily: "'DM Mono', monospace" }}>Active</span>
            </label>
          </div>

          {form.isSubscription && (
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "#888", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px", fontFamily: "'DM Mono', monospace" }}>Monthly Cost ($)</label>
              <input
                type="number"
                value={form.monthlyCost}
                onChange={e => setForm(f => ({ ...f, monthlyCost: e.target.value }))}
                placeholder="0.00"
                style={{
                  width: "100%", background: "#171922", border: "1px solid #2a2d3a",
                  borderRadius: "10px", padding: "10px 14px", color: "#f0f0f0",
                  fontSize: "14px", fontFamily: "'DM Mono', monospace", outline: "none", boxSizing: "border-box"
                }}
              />
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "28px" }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "12px", background: "transparent", border: "1px solid #2a2d3a",
            borderRadius: "10px", color: "#888", cursor: "pointer", fontSize: "14px",
            fontFamily: "'Syne', sans-serif", fontWeight: 600, transition: "all 0.2s"
          }}>Cancel</button>
          <button onClick={handleSave} style={{
            flex: 2, padding: "12px", background: "linear-gradient(135deg, #6366f1, #818cf8)",
            border: "none", borderRadius: "10px", color: "white", cursor: "pointer",
            fontSize: "14px", fontFamily: "'Syne', sans-serif", fontWeight: 700,
            boxShadow: "0 4px 20px rgba(99,102,241,0.4)", transition: "all 0.2s"
          }}>
            {account ? "Save Changes" : "Add Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AccountCard({ account, onDelete, onEdit }) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(null);

  const copy = (text, type) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(type);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div style={{
      background: "#0f1117",
      border: "1px solid #1e2130",
      borderRadius: "18px",
      padding: "22px",
      position: "relative",
      overflow: "hidden",
      transition: "transform 0.2s, box-shadow 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.4)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      {/* Color accent bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "3px",
        background: account.color, borderRadius: "18px 18px 0 0"
      }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "18px" }}>
        <div style={{
          width: "44px", height: "44px", borderRadius: "12px",
          background: `${account.color}20`, border: `1px solid ${account.color}40`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "20px", color: account.color, flexShrink: 0
        }}>
          {account.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, fontSize: "17px", fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "#f0f0f0" }}>
              {account.name}
            </h3>
            <span style={{
              fontSize: "10px", padding: "2px 8px", borderRadius: "20px", fontFamily: "'DM Mono', monospace",
              background: account.isActive ? "#0d2e1e" : "#2a1a1a",
              color: account.isActive ? "#34d399" : "#f87171",
              border: `1px solid ${account.isActive ? "#1a4a30" : "#4a1a1a"}`
            }}>
              {account.isActive ? "● Active" : "● Inactive"}
            </span>
            {account.isSubscription && (
              <span style={{
                fontSize: "10px", padding: "2px 8px", borderRadius: "20px",
                background: "#1a1a3a", color: "#818cf8", border: "1px solid #2a2a5a",
                fontFamily: "'DM Mono', monospace"
              }}>
                Subscription
              </span>
            )}
          </div>
          <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#555", fontFamily: "'DM Mono', monospace" }}>
            {account.category}
          </p>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button onClick={() => onEdit(account)} style={{
            background: "transparent", border: "1px solid #2a2d3a", borderRadius: "8px",
            padding: "6px", cursor: "pointer", color: "#666", display: "flex", alignItems: "center",
            transition: "all 0.2s"
          }}
            onMouseEnter={e => { e.currentTarget.style.color = "#818cf8"; e.currentTarget.style.borderColor = "#818cf8"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#666"; e.currentTarget.style.borderColor = "#2a2d3a"; }}
          >
            <EditIcon />
          </button>
          <button onClick={() => onDelete(account.id)} style={{
            background: "transparent", border: "1px solid #2a2d3a", borderRadius: "8px",
            padding: "6px", cursor: "pointer", color: "#666", display: "flex", alignItems: "center",
            transition: "all 0.2s"
          }}
            onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.borderColor = "#f87171"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#666"; e.currentTarget.style.borderColor = "#2a2d3a"; }}
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {/* Credentials */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {/* Email */}
        <div style={{ background: "#0a0c14", borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "10px", color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'DM Mono', monospace", marginBottom: "2px" }}>Email</div>
            <div style={{ fontSize: "13px", color: "#c8cce8", fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{account.email}</div>
          </div>
          <button onClick={() => copy(account.email, "email")} style={{
            background: copied === "email" ? "#1a2e1a" : "transparent",
            border: `1px solid ${copied === "email" ? "#34d399" : "#2a2d3a"}`,
            borderRadius: "7px", padding: "5px 10px", cursor: "pointer",
            color: copied === "email" ? "#34d399" : "#555", fontSize: "11px",
            fontFamily: "'DM Mono', monospace", display: "flex", alignItems: "center", gap: "5px",
            transition: "all 0.2s", flexShrink: 0
          }}>
            <CopyIcon /> {copied === "email" ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* Password */}
        <div style={{ background: "#0a0c14", borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: "10px", color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'DM Mono', monospace", marginBottom: "2px" }}>Password</div>
            <div style={{ fontSize: "13px", color: "#c8cce8", fontFamily: "'DM Mono', monospace", letterSpacing: showPassword ? "normal" : "0.15em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {showPassword ? account.password : "•".repeat(Math.min(account.password.length, 16))}
            </div>
          </div>
          <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
            <button onClick={() => setShowPassword(p => !p)} style={{
              background: showPassword ? "#1a1a3a" : "transparent",
              border: `1px solid ${showPassword ? "#818cf8" : "#2a2d3a"}`,
              borderRadius: "7px", padding: "5px 8px", cursor: "pointer",
              color: showPassword ? "#818cf8" : "#555", display: "flex", alignItems: "center",
              transition: "all 0.2s"
            }}>
              <EyeIcon open={showPassword} />
            </button>
            <button onClick={() => copy(account.password, "pass")} style={{
              background: copied === "pass" ? "#1a2e1a" : "transparent",
              border: `1px solid ${copied === "pass" ? "#34d399" : "#2a2d3a"}`,
              borderRadius: "7px", padding: "5px 10px", cursor: "pointer",
              color: copied === "pass" ? "#34d399" : "#555", fontSize: "11px",
              fontFamily: "'DM Mono', monospace", display: "flex", alignItems: "center", gap: "5px",
              transition: "all 0.2s"
            }}>
              <CopyIcon /> {copied === "pass" ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px" }}>
        {account.isSubscription && account.monthlyCost != null ? (
          <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
            <span style={{ fontSize: "20px", fontWeight: 700, color: "#f0f0f0", fontFamily: "'Syne', sans-serif" }}>
              ${account.monthlyCost.toFixed(2)}
            </span>
            <span style={{ fontSize: "11px", color: "#555", fontFamily: "'DM Mono', monospace" }}>/mo</span>
          </div>
        ) : (
          <span style={{ fontSize: "12px", color: "#444", fontFamily: "'DM Mono', monospace" }}>No subscription</span>
        )}
        {account.notes && (
          <span style={{ fontSize: "11px", color: "#555", fontFamily: "'DM Mono', monospace", textAlign: "right", maxWidth: "55%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {account.notes}
          </span>
        )}
      </div>
    </div>
  );
}

export default function FamilyVault() {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editAccount, setEditAccount] = useState(null);

  const filtered = accounts.filter(a =>
    (filter === "All" || a.category === filter) &&
    (a.name.toLowerCase().includes(search.toLowerCase()) || a.category.toLowerCase().includes(search.toLowerCase()))
  );

  const totalMonthly = accounts.filter(a => a.isSubscription && a.isActive && a.monthlyCost).reduce((s, a) => s + a.monthlyCost, 0);
  const activeCount = accounts.filter(a => a.isActive).length;
  const subCount = accounts.filter(a => a.isSubscription).length;

  const handleSave = (data) => {
    if (editAccount) {
      setAccounts(accs => accs.map(a => a.id === editAccount.id ? { ...data, id: editAccount.id } : a));
    } else {
      setAccounts(accs => [...accs, { ...data, id: Date.now() }]);
    }
    setShowModal(false);
    setEditAccount(null);
  };

  const handleEdit = (account) => {
    setEditAccount(account);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setAccounts(accs => accs.filter(a => a.id !== id));
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0c14; }
        ::-webkit-scrollbar-thumb { background: #2a2d3a; border-radius: 3px; }
        input::placeholder { color: #444; }
        input:focus { border-color: #6366f1 !important; }
        select:focus { border-color: #6366f1 !important; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#080a10", color: "#f0f0f0", fontFamily: "'DM Mono', monospace" }}>
        {/* Background grid */}
        <div style={{
          position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
          backgroundImage: "linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: "1200px", margin: "0 auto", padding: "40px 24px" }}>

          {/* Header */}
          <div style={{ marginBottom: "48px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "6px" }}>
              <div style={{
                width: "42px", height: "42px", borderRadius: "12px",
                background: "linear-gradient(135deg, #6366f1, #818cf8)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px"
              }}>🔐</div>
              <h1 style={{ margin: 0, fontSize: "32px", fontFamily: "'Syne', sans-serif", fontWeight: 800, letterSpacing: "-0.02em", background: "linear-gradient(135deg, #f0f0f0, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                FamilyVault
              </h1>
            </div>
            <p style={{ margin: 0, color: "#555", fontSize: "13px", paddingLeft: "56px" }}>
              Shared account manager for your household
            </p>
          </div>

          {/* Stats Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "32px" }}>
            {[
              { label: "Total Accounts", value: accounts.length, accent: "#818cf8", symbol: "" },
              { label: "Active Services", value: activeCount, accent: "#34d399", symbol: "" },
              { label: "Monthly Cost", value: `$${totalMonthly.toFixed(2)}`, accent: "#fbbf24", symbol: "" },
            ].map(({ label, value, accent }) => (
              <div key={label} style={{
                background: "#0f1117", border: "1px solid #1e2130", borderRadius: "16px", padding: "20px 22px",
              }}>
                <div style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>{label}</div>
                <div style={{ fontSize: "28px", fontFamily: "'Syne', sans-serif", fontWeight: 800, color: accent }}>{value}</div>
                {label === "Monthly Cost" && (
                  <div style={{ fontSize: "11px", color: "#444", marginTop: "3px" }}>{subCount} subscriptions</div>
                )}
              </div>
            ))}
          </div>

          {/* Controls */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Search accounts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: "1", minWidth: "200px", background: "#0f1117", border: "1px solid #2a2d3a",
                borderRadius: "12px", padding: "11px 16px", color: "#f0f0f0",
                fontSize: "13px", fontFamily: "'DM Mono', monospace", outline: "none", transition: "border-color 0.2s"
              }}
            />
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setFilter(cat)} style={{
                  padding: "10px 16px", borderRadius: "10px", cursor: "pointer",
                  fontSize: "12px", fontFamily: "'DM Mono', monospace", fontWeight: 500,
                  transition: "all 0.2s",
                  background: filter === cat ? "linear-gradient(135deg, #6366f1, #818cf8)" : "transparent",
                  border: filter === cat ? "1px solid transparent" : "1px solid #2a2d3a",
                  color: filter === cat ? "white" : "#666",
                  boxShadow: filter === cat ? "0 4px 15px rgba(99,102,241,0.3)" : "none"
                }}>
                  {cat}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setEditAccount(null); setShowModal(true); }}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "11px 20px", background: "linear-gradient(135deg, #6366f1, #818cf8)",
                border: "none", borderRadius: "12px", color: "white", cursor: "pointer",
                fontSize: "13px", fontFamily: "'Syne', sans-serif", fontWeight: 700,
                boxShadow: "0 4px 20px rgba(99,102,241,0.4)", whiteSpace: "nowrap",
                transition: "all 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 25px rgba(99,102,241,0.6)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(99,102,241,0.4)"}
            >
              <PlusIcon /> Add Account
            </button>
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 20px", color: "#444" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
              <div style={{ fontSize: "16px", fontFamily: "'Syne', sans-serif", marginBottom: "8px", color: "#666" }}>No accounts found</div>
              <div style={{ fontSize: "13px" }}>Try adjusting your search or filter</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
              {filtered.map(account => (
                <AccountCard key={account.id} account={account} onDelete={handleDelete} onEdit={handleEdit} />
              ))}
            </div>
          )}

          {/* Footer note */}
          <div style={{ marginTop: "48px", padding: "16px", background: "#0f1117", border: "1px solid #1e2130", borderRadius: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "16px" }}>⚠️</span>
            <span style={{ fontSize: "12px", color: "#555" }}>
              Prototype UI — in production, passwords would be encrypted server-side and never stored in plain text.
            </span>
          </div>
        </div>
      </div>

      {showModal && (
        <AccountModal
          account={editAccount}
          onClose={() => { setShowModal(false); setEditAccount(null); }}
          onSave={handleSave}
        />
      )}
    </>
  );
}
