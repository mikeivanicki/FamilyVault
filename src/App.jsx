import { useState, useEffect, useCallback } from "react";
import {
  login, logout, register, joinFamily, generateInvite,
  fetchAccounts, createAccount, updateAccount, deleteAccount, revealPassword,
} from "./api";

// ─── Icons ────────────────────────────────────────────────────────────────────

const EyeIcon = ({ open }) => open ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const CopyIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
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

const CATEGORIES = ["All", "Streaming", "Music", "Food & Dining", "Shopping", "Gaming", "Finance", "Other"];
const inputStyle = { width: "100%", background: "#171922", border: "1px solid #2a2d3a", borderRadius: "10px", padding: "10px 14px", color: "#f0f0f0", fontSize: "14px", fontFamily: "'DM Mono', monospace", outline: "none", boxSizing: "border-box" };

// ─── Login / Register / Join Screen ──────────────────────────────────────────

function AuthScreen({ onAuth }) {
  // Auto-detect invite token in URL and pre-select "join" tab
  const urlToken = new URLSearchParams(window.location.search).get("token") || "";
  const [mode, setMode] = useState(urlToken ? "join" : "login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [inviteToken, setInviteToken] = useState(urlToken);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const TABS = [
    { id: "login",    label: "Sign In" },
    { id: "register", label: "Create Family" },
    { id: "join",     label: "Join via Invite" },
  ];

  const handleSubmit = async () => {
    setError("");
    if (!email || !password) return setError("Email and password are required.");
    if (mode === "join" && !inviteToken) return setError("An invite token is required.");
    setLoading(true);
    try {
      let user;
      if (mode === "login")    user = await login(email, password);
      if (mode === "register") user = await register(email, password);
      if (mode === "join")     user = await joinFamily(inviteToken, email, password);
      onAuth(user);
      // Strip token from URL after successful join
      if (urlToken) window.history.replaceState({}, "", window.location.pathname);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const descriptions = {
    login:    "Sign in to your family vault.",
    register: "Create a new vault. You'll be the owner and can invite family members after signing in.",
    join:     "You've been invited! Paste your invite link or token below to join your family's vault.",
  };

  const btnLabels = { login: "Sign In", register: "Create Family Vault", join: "Join Family" };

  return (
    <div style={{ minHeight: "100vh", background: "#080a10", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "420px", background: "#0f1117", border: "1px solid #2a2d3a", borderRadius: "20px", padding: "36px" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "linear-gradient(135deg, #6366f1, #818cf8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>🔐</div>
          <h1 style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "22px", background: "linear-gradient(135deg, #f0f0f0, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>FamilyVault</h1>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setMode(t.id); setError(""); }} style={{ flex: 1, padding: "8px 4px", borderRadius: "9px", cursor: "pointer", fontSize: "11px", fontFamily: "'Syne', sans-serif", fontWeight: 600, transition: "all 0.2s", background: mode === t.id ? "linear-gradient(135deg, #6366f1, #818cf8)" : "transparent", border: mode === t.id ? "1px solid transparent" : "1px solid #2a2d3a", color: mode === t.id ? "white" : "#666", whiteSpace: "nowrap" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Description */}
        <p style={{ margin: "0 0 20px", fontSize: "12px", color: "#555", fontFamily: "'DM Mono', monospace", lineHeight: 1.6, minHeight: "36px" }}>
          {descriptions[mode]}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Invite token field — join mode only */}
          {mode === "join" && (
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "#888", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px", fontFamily: "'DM Mono', monospace" }}>Invite Token *</label>
              <input
                type="text"
                placeholder="Paste token or full invite link…"
                value={inviteToken}
                onChange={e => {
                  // Accept either the raw token or the full URL
                  const val = e.target.value;
                  try {
                    const url = new URL(val);
                    setInviteToken(url.searchParams.get("token") || val);
                  } catch { setInviteToken(val); }
                }}
                style={inputStyle}
              />
            </div>
          )}

          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
          <input type="password" placeholder={mode === "join" ? "Choose a password (12+ chars)" : "Password"} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} style={inputStyle} />

          {/* Register info callout */}
          {mode === "register" && (
            <div style={{ background: "#12142a", border: "1px solid #2a2d5a", borderRadius: "10px", padding: "12px 14px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "14px", flexShrink: 0 }}>ℹ️</span>
              <p style={{ margin: 0, fontSize: "11px", color: "#818cf8", fontFamily: "'DM Mono', monospace", lineHeight: 1.6 }}>
                You'll be the <strong>Owner</strong> of this vault. After signing in, use the <em>Invite Member</em> button to add family members as Adults or Children.
              </p>
            </div>
          )}

          {error && <p style={{ margin: 0, fontSize: "12px", color: "#f87171", fontFamily: "'DM Mono', monospace" }}>{error}</p>}

          <button onClick={handleSubmit} disabled={loading} style={{ padding: "12px", background: "linear-gradient(135deg, #6366f1, #818cf8)", border: "none", borderRadius: "10px", color: "white", cursor: loading ? "not-allowed" : "pointer", fontSize: "14px", fontFamily: "'Syne', sans-serif", fontWeight: 700, boxShadow: "0 4px 20px rgba(99,102,241,0.4)", opacity: loading ? 0.7 : 1, marginTop: "4px" }}>
            {loading ? "Please wait…" : btnLabels[mode]}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Invite Member Modal (owner only) ─────────────────────────────────────────

function InviteModal({ onClose }) {
  const [role, setRole]         = useState("adult");
  const [inviteLink, setInviteLink] = useState("");
  const [loading, setLoading]   = useState(false);
  const [copied, setCopied]     = useState(false);
  const [error, setError]       = useState("");

  const handleGenerate = async () => {
    setLoading(true); setError(""); setInviteLink("");
    try {
      const link = await generateInvite(role);
      setInviteLink(link);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const roleInfo = {
    adult: "Can view passwords, add and edit accounts.",
    child: "Can see account names and emails, but passwords are always hidden.",
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
      <div style={{ background: "#0f1117", border: "1px solid #2a2d3a", borderRadius: "20px", padding: "32px", width: "100%", maxWidth: "440px", boxShadow: "0 25px 80px rgba(0,0,0,0.6)" }}>
        <h2 style={{ margin: "0 0 6px", fontSize: "20px", fontFamily: "'Syne', sans-serif", color: "#f0f0f0", fontWeight: 700 }}>Invite Family Member</h2>
        <p style={{ margin: "0 0 24px", fontSize: "12px", color: "#555", fontFamily: "'DM Mono', monospace" }}>Generate a one-time invite link. Expires in 24 hours.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Role selector */}
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#888", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px", fontFamily: "'DM Mono', monospace" }}>Role</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {["adult", "child"].map(r => (
                <button key={r} onClick={() => setRole(r)} style={{ flex: 1, padding: "10px", borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontFamily: "'Syne', sans-serif", fontWeight: 600, transition: "all 0.2s", background: role === r ? `${r === "adult" ? "#1a1a3a" : "#0d2e1e"}` : "transparent", border: `1px solid ${role === r ? (r === "adult" ? "#818cf8" : "#34d399") : "#2a2d3a"}`, color: role === r ? (r === "adult" ? "#818cf8" : "#34d399") : "#666" }}>
                  {r === "adult" ? "👤 Adult" : "🧒 Child"}
                </button>
              ))}
            </div>
            <p style={{ margin: "8px 0 0", fontSize: "11px", color: "#555", fontFamily: "'DM Mono', monospace" }}>{roleInfo[role]}</p>
          </div>

          {/* Generated link */}
          {inviteLink && (
            <div style={{ background: "#0a0c14", border: "1px solid #2a2d3a", borderRadius: "10px", padding: "12px 14px" }}>
              <div style={{ fontSize: "10px", color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'DM Mono', monospace", marginBottom: "6px" }}>Invite Link</div>
              <div style={{ fontSize: "11px", color: "#818cf8", fontFamily: "'DM Mono', monospace", wordBreak: "break-all", lineHeight: 1.5, marginBottom: "10px" }}>{inviteLink}</div>
              <button onClick={handleCopy} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", background: copied ? "#0d2e1e" : "transparent", border: `1px solid ${copied ? "#34d399" : "#2a2d3a"}`, borderRadius: "8px", color: copied ? "#34d399" : "#666", cursor: "pointer", fontSize: "12px", fontFamily: "'DM Mono', monospace", transition: "all 0.2s" }}>
                <CopyIcon /> {copied ? "Copied!" : "Copy link"}
              </button>
            </div>
          )}

          {error && <p style={{ margin: 0, fontSize: "12px", color: "#f87171", fontFamily: "'DM Mono', monospace" }}>{error}</p>}
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px", background: "transparent", border: "1px solid #2a2d3a", borderRadius: "10px", color: "#888", cursor: "pointer", fontSize: "14px", fontFamily: "'Syne', sans-serif", fontWeight: 600 }}>Close</button>
          <button onClick={handleGenerate} disabled={loading} style={{ flex: 2, padding: "12px", background: "linear-gradient(135deg, #6366f1, #818cf8)", border: "none", borderRadius: "10px", color: "white", cursor: loading ? "not-allowed" : "pointer", fontSize: "14px", fontFamily: "'Syne', sans-serif", fontWeight: 700, opacity: loading ? 0.7 : 1 }}>
            {loading ? "Generating…" : inviteLink ? "Generate New Link" : "Generate Invite Link"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Icon & Color Options ─────────────────────────────────────────────────────

const ICON_OPTIONS = [
  "◆", "★", "●", "▶", "♪", "⚡", "🔒", "🏠", "🎮", "🛒",
  "🍔", "✈", "💳", "📱", "🎬", "📦", "🎵", "☁", "🔑", "💡",
];

const COLOR_OPTIONS = [
  "#6366f1", "#818cf8", "#34d399", "#f87171", "#fbbf24",
  "#c084fc", "#38bdf8", "#fb923c", "#e879f9", "#4ade80",
  "#f472b6", "#2dd4bf", "#a3e635", "#facc15", "#60a5fa",
];

// ─── Account Modal ────────────────────────────────────────────────────────────

function AccountModal({ account, onClose, onSave, loading }) {
  const empty = { name: "", category: "Other", email: "", password: "", isSubscription: false, isActive: true, monthlyCost: "", notes: "", icon: "◆", color: "#6366f1" };
  const [form, setForm] = useState(account ? { ...account, password: "" } : empty);

  const handleSave = () => {
    if (!form.name || !form.email) return;
    if (!account && !form.password) return;
    onSave({ ...form, monthlyCost: form.isSubscription ? parseFloat(form.monthlyCost) || 0 : null });
  };

  const labelStyle = { display: "block", fontSize: "11px", color: "#888", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px", fontFamily: "'DM Mono', monospace" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
      <div style={{ background: "#0f1117", border: "1px solid #2a2d3a", borderRadius: "20px", padding: "32px", width: "100%", maxWidth: "520px", boxShadow: "0 25px 80px rgba(0,0,0,0.6)", maxHeight: "90vh", overflowY: "auto" }}>
        
        {/* Header with live preview */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "24px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: `${form.color}25`, border: `2px solid ${form.color}60`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0, transition: "all 0.2s" }}>
            {form.icon}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", fontFamily: "'Syne', sans-serif", color: "#f0f0f0", fontWeight: 700 }}>{account ? "Edit Account" : "Add New Account"}</h2>
            <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#555", fontFamily: "'DM Mono', monospace" }}>Preview updates as you type</p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Text fields */}
          {[
            { label: "Service Name *", key: "name", placeholder: "e.g. Netflix" },
            { label: "Email / Username *", key: "email", placeholder: "family@example.com" },
            { label: account ? "New Password (leave blank to keep)" : "Password *", key: "password", placeholder: "••••••••", type: "password" },
            { label: "Notes", key: "notes", placeholder: "Optional notes..." },
          ].map(({ label, key, placeholder, type }) => (
            <div key={key}>
              <label style={labelStyle}>{label}</label>
              <input type={type || "text"} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} style={inputStyle} />
            </div>
          ))}

          {/* Category */}
          <div>
            <label style={labelStyle}>Category</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
              {CATEGORIES.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Icon picker */}
          <div>
            <label style={labelStyle}>Icon</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {ICON_OPTIONS.map(icon => (
                <button
                  key={icon}
                  onClick={() => setForm(f => ({ ...f, icon }))}
                  style={{
                    width: "38px", height: "38px", borderRadius: "9px", fontSize: "18px",
                    background: form.icon === icon ? `${form.color}25` : "#0a0c14",
                    border: `1.5px solid ${form.icon === icon ? form.color : "#2a2d3a"}`,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s", transform: form.icon === icon ? "scale(1.15)" : "scale(1)",
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label style={labelStyle}>Color</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
              {COLOR_OPTIONS.map(color => (
                <button
                  key={color}
                  onClick={() => setForm(f => ({ ...f, color }))}
                  style={{
                    width: "28px", height: "28px", borderRadius: "50%", background: color,
                    border: form.color === color ? "3px solid #f0f0f0" : "3px solid transparent",
                    outline: form.color === color ? `2px solid ${color}` : "none",
                    cursor: "pointer", padding: 0, transition: "all 0.15s",
                    transform: form.color === color ? "scale(1.2)" : "scale(1)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Checkboxes */}
          <div style={{ display: "flex", gap: "20px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input type="checkbox" checked={form.isSubscription} onChange={e => setForm(f => ({ ...f, isSubscription: e.target.checked }))} style={{ accentColor: "#818cf8" }} />
              <span style={{ fontSize: "13px", color: "#ccc", fontFamily: "'DM Mono', monospace" }}>Subscription</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} style={{ accentColor: "#34d399" }} />
              <span style={{ fontSize: "13px", color: "#ccc", fontFamily: "'DM Mono', monospace" }}>Active</span>
            </label>
          </div>

          {/* Monthly cost */}
          {form.isSubscription && (
            <div>
              <label style={labelStyle}>Monthly Cost ($)</label>
              <input type="number" value={form.monthlyCost} onChange={e => setForm(f => ({ ...f, monthlyCost: e.target.value }))} placeholder="0.00" style={inputStyle} />
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "28px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px", background: "transparent", border: "1px solid #2a2d3a", borderRadius: "10px", color: "#888", cursor: "pointer", fontSize: "14px", fontFamily: "'Syne', sans-serif", fontWeight: 600 }}>Cancel</button>
          <button onClick={handleSave} disabled={loading} style={{ flex: 2, padding: "12px", background: "linear-gradient(135deg, #6366f1, #818cf8)", border: "none", borderRadius: "10px", color: "white", cursor: "pointer", fontSize: "14px", fontFamily: "'Syne', sans-serif", fontWeight: 700, opacity: loading ? 0.7 : 1 }}>
            {loading ? "Saving…" : account ? "Save Changes" : "Add Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Account Card ─────────────────────────────────────────────────────────────

function AccountCard({ account, userRole, onDelete, onEdit }) {
  const [revealedPass, setRevealedPass] = useState(null);
  const [revealing, setRevealing] = useState(false);
  const [copied, setCopied] = useState(null);
  const canSeePassword = userRole === "owner" || userRole === "adult";

  const handleReveal = async () => {
    if (revealedPass) { setRevealedPass(null); return; }
    setRevealing(true);
    try { setRevealedPass(await revealPassword(account._id)); }
    catch (err) { alert("Could not reveal password: " + err.message); }
    finally { setRevealing(false); }
  };

  const copy = (text, type) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(type);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div style={{ background: "#0f1117", border: "1px solid #1e2130", borderRadius: "18px", padding: "22px", position: "relative", overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.4)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: account.color || "#6366f1", borderRadius: "18px 18px 0 0" }} />
      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "18px" }}>
        <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: `${account.color || "#6366f1"}20`, border: `1px solid ${account.color || "#6366f1"}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", color: account.color, flexShrink: 0 }}>{account.icon || "◆"}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, fontSize: "17px", fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "#f0f0f0" }}>{account.name}</h3>
            <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "20px", fontFamily: "'DM Mono', monospace", background: account.isActive ? "#0d2e1e" : "#2a1a1a", color: account.isActive ? "#34d399" : "#f87171", border: `1px solid ${account.isActive ? "#1a4a30" : "#4a1a1a"}` }}>{account.isActive ? "● Active" : "● Inactive"}</span>
            {account.isSubscription && <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "20px", background: "#1a1a3a", color: "#818cf8", border: "1px solid #2a2a5a", fontFamily: "'DM Mono', monospace" }}>Subscription</span>}
          </div>
          <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#555", fontFamily: "'DM Mono', monospace" }}>{account.category}</p>
        </div>
        {userRole !== "child" && (
          <div style={{ display: "flex", gap: "6px" }}>
            <button onClick={() => onEdit(account)} style={{ background: "transparent", border: "1px solid #2a2d3a", borderRadius: "8px", padding: "6px", cursor: "pointer", color: "#666", display: "flex", alignItems: "center", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#818cf8"; e.currentTarget.style.borderColor = "#818cf8"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#666"; e.currentTarget.style.borderColor = "#2a2d3a"; }}><EditIcon /></button>
            {userRole === "owner" && (
              <button onClick={() => onDelete(account._id)} style={{ background: "transparent", border: "1px solid #2a2d3a", borderRadius: "8px", padding: "6px", cursor: "pointer", color: "#666", display: "flex", alignItems: "center", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.borderColor = "#f87171"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#666"; e.currentTarget.style.borderColor = "#2a2d3a"; }}><TrashIcon /></button>
            )}
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ background: "#0a0c14", borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "10px", color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'DM Mono', monospace", marginBottom: "2px" }}>Email</div>
            <div style={{ fontSize: "13px", color: "#c8cce8", fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{account.email}</div>
          </div>
          <button onClick={() => copy(account.email, "email")} style={{ background: copied === "email" ? "#1a2e1a" : "transparent", border: `1px solid ${copied === "email" ? "#34d399" : "#2a2d3a"}`, borderRadius: "7px", padding: "5px 10px", cursor: "pointer", color: copied === "email" ? "#34d399" : "#555", fontSize: "11px", fontFamily: "'DM Mono', monospace", display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
            <CopyIcon /> {copied === "email" ? "Copied!" : "Copy"}
          </button>
        </div>
        <div style={{ background: "#0a0c14", borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: "10px", color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'DM Mono', monospace", marginBottom: "2px" }}>Password</div>
            <div style={{ fontSize: "13px", color: "#c8cce8", fontFamily: "'DM Mono', monospace", letterSpacing: revealedPass ? "normal" : "0.15em" }}>
              {canSeePassword ? (revealedPass || "••••••••••••") : "── hidden ──"}
            </div>
          </div>
          {canSeePassword && (
            <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
              <button onClick={handleReveal} disabled={revealing} style={{ background: revealedPass ? "#1a1a3a" : "transparent", border: `1px solid ${revealedPass ? "#818cf8" : "#2a2d3a"}`, borderRadius: "7px", padding: "5px 8px", cursor: "pointer", color: revealedPass ? "#818cf8" : "#555", display: "flex", alignItems: "center" }}>
                {revealing ? "…" : <EyeIcon open={!!revealedPass} />}
              </button>
              {revealedPass && (
                <button onClick={() => copy(revealedPass, "pass")} style={{ background: copied === "pass" ? "#1a2e1a" : "transparent", border: `1px solid ${copied === "pass" ? "#34d399" : "#2a2d3a"}`, borderRadius: "7px", padding: "5px 10px", cursor: "pointer", color: copied === "pass" ? "#34d399" : "#555", fontSize: "11px", fontFamily: "'DM Mono', monospace", display: "flex", alignItems: "center", gap: "5px" }}>
                  <CopyIcon /> {copied === "pass" ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px" }}>
        {account.isSubscription && account.monthlyCost != null
          ? <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}><span style={{ fontSize: "20px", fontWeight: 700, color: "#f0f0f0", fontFamily: "'Syne', sans-serif" }}>${account.monthlyCost.toFixed(2)}</span><span style={{ fontSize: "11px", color: "#555", fontFamily: "'DM Mono', monospace" }}>/mo</span></div>
          : <span style={{ fontSize: "12px", color: "#444", fontFamily: "'DM Mono', monospace" }}>No subscription</span>}
        {account.notes && <span style={{ fontSize: "11px", color: "#555", fontFamily: "'DM Mono', monospace", textAlign: "right", maxWidth: "55%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{account.notes}</span>}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function FamilyVault() {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    const handler = () => { setUser(null); setAccounts([]); };
    window.addEventListener("auth:expired", handler);
    return () => window.removeEventListener("auth:expired", handler);
  }, []);

  const loadAccounts = useCallback(async () => {
    setLoading(true); setError("");
    try { setAccounts(await fetchAccounts()); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (user) loadAccounts(); }, [user, loadAccounts]);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      // Await the API call first — never inside a state updater,
      // as React may call the updater multiple times in StrictMode.
      if (editAccount) {
        await updateAccount(editAccount._id, data);
      } else {
        await createAccount(data);
      }
      setShowModal(false);
      setEditAccount(null);
      // Re-fetch from server so the account list always reflects true DB state.
      await loadAccounts();
    } catch (err) { alert("Save failed: " + err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this account?")) return;
    try { await deleteAccount(id); setAccounts(accs => accs.filter(a => a._id !== id)); }
    catch (err) { alert("Delete failed: " + err.message); }
  };

  if (!user) return <AuthScreen onAuth={setUser} />;

  const filtered = accounts.filter(a =>
    (filter === "All" || a.category === filter) &&
    (a.name.toLowerCase().includes(search.toLowerCase()) || a.category?.toLowerCase().includes(search.toLowerCase()))
  );
  const totalMonthly = accounts.filter(a => a.isSubscription && a.isActive && a.monthlyCost).reduce((s, a) => s + a.monthlyCost, 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
        * { box-sizing: border-box; } body { margin: 0; }
        input::placeholder { color: #444; } input:focus, select:focus { border-color: #6366f1 !important; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: #2a2d3a; border-radius: 3px; }
      `}</style>
      <div style={{ minHeight: "100vh", background: "#080a10", color: "#f0f0f0", fontFamily: "'DM Mono', monospace" }}>
        <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: "1200px", margin: "0 auto", padding: "40px 24px" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "40px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "4px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "linear-gradient(135deg, #6366f1, #818cf8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>🔐</div>
                <h1 style={{ margin: 0, fontSize: "32px", fontFamily: "'Syne', sans-serif", fontWeight: 800, letterSpacing: "-0.02em", background: "linear-gradient(135deg, #f0f0f0, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>FamilyVault</h1>
              </div>
              <p style={{ margin: 0, color: "#555", fontSize: "12px", paddingLeft: "56px" }}>
                Signed in as <span style={{ color: "#818cf8" }}>{user.email}</span> · <span style={{ color: "#34d399", textTransform: "capitalize" }}>{user.role}</span>
              </p>
            </div>
            <button onClick={() => { logout(); setUser(null); setAccounts([]); }} style={{ padding: "9px 18px", background: "transparent", border: "1px solid #2a2d3a", borderRadius: "10px", color: "#666", cursor: "pointer", fontSize: "12px", fontFamily: "'DM Mono', monospace", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.borderColor = "#f87171"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#666"; e.currentTarget.style.borderColor = "#2a2d3a"; }}>Sign Out</button>
            {user.role === "owner" && (
              <button onClick={() => setShowInviteModal(true)} style={{ padding: "9px 18px", background: "transparent", border: "1px solid #2a2d5a", borderRadius: "10px", color: "#818cf8", cursor: "pointer", fontSize: "12px", fontFamily: "'DM Mono', monospace", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#1a1a3a"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                👥 Invite Member
              </button>
            )}
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "32px" }}>
            {[
              { label: "Total Accounts", value: accounts.length, accent: "#818cf8" },
              { label: "Active Services", value: accounts.filter(a => a.isActive).length, accent: "#34d399" },
              { label: "Monthly Cost", value: `$${totalMonthly.toFixed(2)}`, accent: "#fbbf24" },
            ].map(({ label, value, accent }) => (
              <div key={label} style={{ background: "#0f1117", border: "1px solid #1e2130", borderRadius: "16px", padding: "20px 22px" }}>
                <div style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>{label}</div>
                <div style={{ fontSize: "28px", fontFamily: "'Syne', sans-serif", fontWeight: 800, color: accent }}>{loading ? "…" : value}</div>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
            <input type="text" placeholder="Search accounts…" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: "1", minWidth: "200px", background: "#0f1117", border: "1px solid #2a2d3a", borderRadius: "12px", padding: "11px 16px", color: "#f0f0f0", fontSize: "13px", fontFamily: "'DM Mono', monospace", outline: "none" }} />
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setFilter(cat)} style={{ padding: "10px 14px", borderRadius: "10px", cursor: "pointer", fontSize: "12px", fontFamily: "'DM Mono', monospace", transition: "all 0.2s", background: filter === cat ? "linear-gradient(135deg, #6366f1, #818cf8)" : "transparent", border: filter === cat ? "1px solid transparent" : "1px solid #2a2d3a", color: filter === cat ? "white" : "#666" }}>{cat}</button>
              ))}
            </div>
            {user.role !== "child" && (
              <button onClick={() => { setEditAccount(null); setShowModal(true); }} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "11px 20px", background: "linear-gradient(135deg, #6366f1, #818cf8)", border: "none", borderRadius: "12px", color: "white", cursor: "pointer", fontSize: "13px", fontFamily: "'Syne', sans-serif", fontWeight: 700, boxShadow: "0 4px 20px rgba(99,102,241,0.4)", whiteSpace: "nowrap" }}>
                <PlusIcon /> Add Account
              </button>
            )}
          </div>

          {error && <div style={{ background: "#2a1a1a", border: "1px solid #4a1a1a", borderRadius: "12px", padding: "14px 18px", marginBottom: "20px", color: "#f87171", fontSize: "13px" }}>⚠️ {error} <button onClick={loadAccounts} style={{ marginLeft: "12px", color: "#818cf8", background: "none", border: "none", cursor: "pointer", fontSize: "13px" }}>Retry</button></div>}

          {loading ? (
            <div style={{ textAlign: "center", padding: "80px", color: "#444" }}>Loading accounts…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 20px", color: "#444" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
              <div style={{ fontSize: "16px", fontFamily: "'Syne', sans-serif", color: "#666", marginBottom: "8px" }}>No accounts found</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
              {filtered.map(account => (
                <AccountCard key={account._id} account={account} userRole={user.role} onDelete={handleDelete} onEdit={acc => { setEditAccount(acc); setShowModal(true); }} />
              ))}
            </div>
          )}
        </div>
      </div>
      {showModal && <AccountModal account={editAccount} onClose={() => { setShowModal(false); setEditAccount(null); }} onSave={handleSave} loading={saving} />}
      {showInviteModal && <InviteModal onClose={() => setShowInviteModal(false)} />}
    </>
  );
}
