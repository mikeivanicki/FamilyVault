import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Buffer } from "buffer";
import rateLimit from "express-rate-limit";



const app = express();

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());

// ─── MongoDB Connection ───────────────────────────────────────────────────────

const mongoUri = process.env.MONGO_URI_B64
  ? Buffer.from(process.env.MONGO_URI_B64, "base64").toString("utf8")
  : process.env.MONGO_URI; // fallback for local .env

mongoose.connect(mongoUri)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => { console.error("❌ MongoDB error:", err); process.exit(1); });
// ─── Encryption Helpers (AES-256-GCM) ────────────────────────────────────────
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
if (!process.env.ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  throw new Error("ENCRYPTION_KEY must be a 64-character hex string (32 bytes)");
}

function encrypt(text) {
  if (typeof text !== "string" || text.length === 0) {
    throw new Error("encrypt() requires a non-empty string");
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

function decrypt(payload) {
  try{
  const parts = payload.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted payload format");
  }
  const [ivHex, tagHex, encHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const encrypted = Buffer.from(encHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");} catch (err) {
    console.error("Decryption error:", err);
    throw new Error("Decryption failed: invalid or tampered data");
  }
}

// ─── Mongoose Schemas ─────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema({
  email:        { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role:         { type: String, enum: ["owner", "adult", "child"], default: "child" },
  familyId:     { type: mongoose.Schema.Types.ObjectId, ref: "Family" },
  createdAt:    { type: Date, default: Date.now },
});

const accountSchema = new mongoose.Schema({
  familyId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Family", index: true },
  name:           { type: String, required: true },
  category:       { type: String, default: "Other" },
  email:          { type: String, required: true },
  encryptedPass:  { type: String, required: true },  // AES-256-GCM ciphertext
  isSubscription: { type: Boolean, default: false },
  isActive:       { type: Boolean, default: true },
  monthlyCost:    { type: Number, default: null, min: 0 },
  notes: { type: String, default: "", maxlength: 500 },
  icon:  { type: String, default: "◆", maxlength: 10 },
  color: {
    type: String,
    default: "#6366f1",
    validate: { validator: v => /^#[0-9a-fA-F]{6}$/.test(v), message: "Invalid hex color" }
  },
  createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  
}, {timestamps: true} );

const familySchema = new mongoose.Schema({
  name:      { type: String, default: "My Family" },
  ownerId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

const auditLogSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action:    { type: String, required: true },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
  familyId:  { type: mongoose.Schema.Types.ObjectId, ref: "Family" },
  timestamp: { type: Date, default: Date.now },
});

const inviteSchema = new mongoose.Schema({
  token:     { type: String, required: true, unique: true },
  familyId:  { type: mongoose.Schema.Types.ObjectId, ref: "Family", required: true },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  role:      { type: String, enum: ["adult", "child"], required: true },
  expiresAt: { type: Date, required: true },
  usedAt:    { type: Date, default: null },
});

const Family = mongoose.model("Family", familySchema);
const User    = mongoose.model("User", userSchema);
const Account = mongoose.model("Account", accountSchema);
const AuditLog = mongoose.model("AuditLog", auditLogSchema);
const InviteToken = mongoose.model("InviteToken", inviteSchema);

// ─── Auth Middleware ──────────────────────────────────────────────────────────

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "No token provided" });
  
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    if (!payload.exp) {
      return res.status(401).json({ error: "Token has no expiry" });
    }
    const { userId, role, familyId } = payload;
if (!userId || !role || !familyId) {
  return res.status(401).json({ error: "Malformed token payload" });
}
req.user = { userId, role, familyId }; 
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    if (!roles.includes(req.user.role))
      return res.status(403).json({ error: "Insufficient permissions" });
    next();
  };
}

// ─── Auth Routes ──────────────────────────────────────────────────────────────

// POST /api/auth/register
app.post("/api/auth/register", async (req, res) => {
  const {email, password} = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 12);

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // 1. Create user first (no familyId yet)
      const [user] = await User.create([{
        email,
        passwordHash,
        role: "owner",
      }], { session });
    
      // 2. Create family now that we have the user's _id
      const [family] = await Family.create([{
        name: "My Family",
        ownerId: user._id,
      }], { session });
    
      // 3. Link the family back to the user
      user.familyId = family._id;
      await user.save({ session });
    
      await session.commitTransaction();
      const token = jwt.sign(
        { userId: user._id, role: user.role, familyId: user.familyId },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );
      res.status(201).json({ token, user: { id: user._id, email: user.email, role: user.role } });
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// POST /api/family/invite — owner only, generates an invite link
app.post("/api/family/invite", requireAuth, requireRole("owner"), async (req, res) => {
  const { role } = req.body;

  if (!["adult", "child"].includes(role)) {
    return res.status(400).json({ error: "Role must be 'adult' or 'child'" });
  }

  try {
    const token = crypto.randomBytes(32).toString("hex");
    await InviteToken.create({
      token,
      familyId:  req.user.familyId,
      invitedBy: req.user.userId,
      role,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    const inviteLink = `${process.env.APP_URL}/join?token=${token}`;
    res.json({ inviteLink });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate invite" });
  }
});

// POST /api/auth/join — registers a new user via invite token
app.post("/api/auth/join", async (req, res) => {
  const { token, email, password } = req.body;

  if (!token || !email || !password) {
    return res.status(400).json({ error: "token, email, and password are required" });
  }
  if (password.length < 12) {
    return res.status(400).json({ error: "Password must be at least 12 characters" });
  }

  try {
    const invite = await InviteToken.findOne({ token });

    // Validate the invite token
    if (!invite)              return res.status(400).json({ error: "Invalid invite token" });
    if (invite.usedAt)        return res.status(400).json({ error: "Invite token already used" });
    if (invite.expiresAt < new Date()) return res.status(400).json({ error: "Invite token expired" });

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 12);
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const [user] = await User.create([{
        email: email.toLowerCase().trim(),
        passwordHash,
        role:     invite.role,
        familyId: invite.familyId,
      }], { session });

      // Mark invite as used
      invite.usedAt = new Date();
      await invite.save({ session });

      await session.commitTransaction();

      const jwtToken = jwt.sign(
        { userId: user._id, role: user.role, familyId: user.familyId },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );

      res.status(201).json({ token: jwtToken, user: { id: user._id, email: user.email, role: user.role } });
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user._id, role: user.role, familyId: user.familyId },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch {
    res.status(500).json({ error: "Login failed" });
  }
});

// POST /api/auth/refresh  
app.post("/api/auth/refresh", requireAuth, async (req, res) => {
  try{
  const user = await User.findById(req.user.userId).select("-passwordHash");
  if (!user) return res.status(401).json({ error: "User not found" });

  const token = jwt.sign(
    { userId: user._id, role: user.role, familyId: user.familyId },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
  res.json({ token });
  } catch (err){
    console.error("Token refresh error:", err);
    res.status(500).json({ error: "Token refresh failed" });
  }

});

// ─── Account Routes ───────────────────────────────────────────────────────────

// GET /api/accounts — returns accounts for the user's family (passwords masked)
app.get("/api/accounts", requireAuth, async (req, res) => {
  try {
    const accounts = await Account.find({ familyId: req.user.familyId }).lean();
    // Never send encryptedPass to the client by default
    const safe = accounts.map(({ encryptedPass, ...rest }) => rest);
    res.json(safe);
  } catch {
    res.status(500).json({ error: "Failed to fetch accounts" });
  }
});

// GET /api/accounts/:id/reveal — returns decrypted password (owner/adult only, audit-logged)

const revealLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many reveal requests" }
});
app.get("/api/accounts/:id/reveal", requireAuth, requireRole("owner", "adult"), revealLimiter, async (req, res) => {
  console.log(`User ${req.user.userId} requested password reveal for account ${req.params.id}`);
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid account ID" });
  }
  try {
    const account = await Account.findOne({ _id: req.params.id, familyId: req.user.familyId });
    if (!account) return res.status(404).json({ error: "Account not found" });

    const password = decrypt(account.encryptedPass);

    await AuditLog.create({
      userId: req.user.userId,
      action: "reveal_password",
      accountId: account._id,
      familyId: req.user.familyId,
      timestamp: new Date(),
    });

    res.json({ password });
  } catch {
    res.status(500).json({ error: "Failed to decrypt password" });
  }
});

// POST /api/accounts — create new account (owner/adult only)
app.post("/api/accounts", requireAuth, requireRole("owner", "adult"), async (req, res) => {
  const { name, category, email, password, isSubscription, isActive, monthlyCost, notes, icon, color } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "name, email, and password are required" });

  if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "name, email, and password must be strings" });
  }

  // Check email format (simple regex) 
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  if (isSubscription !== undefined && typeof isSubscription !== "boolean") {
    return res.status(400).json({ error: "isSubscription must be a boolean" });
  }

  if (isActive !== undefined && typeof isActive !== "boolean") {
    return res.status(400).json({ error: "isActive must be a boolean" });
  }

  try {
    const account = await Account.create({
      familyId: req.user.familyId,
      name, category, email,
      encryptedPass: encrypt(password),
      isSubscription, isActive, monthlyCost, notes, icon, color,
      createdBy: req.user.userId,
    });
    const { encryptedPass, ...safe } = account.toObject();
res.status(201).json(safe);
  } catch {
    res.status(500).json({ error: "Failed to create account" });
  }
});

// PUT /api/accounts/:id — update account (owner/adult only)
app.put("/api/accounts/:id", requireAuth, requireRole("owner", "adult"), async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid account ID" });
  }

  if (typeof req.body.name !== "string" || typeof req.body.email !== "string" || typeof req.body.password !== "string") {
    return res.status(400).json({ error: "name, email, and password must be strings" });
  }

  // Check email format (simple regex) 
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(req.body.email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  await AuditLog.create({
    userId: req.user.userId,
    action: "update_account",
    accountId: req.params.id,
    familyId: req.user.familyId,
    timestamp: new Date(),
  });

  // Explicitly whitelist what's updatable
const { password } = req.body;
const update = {
  ...(req.body.name && { name: req.body.name }),
  ...(req.body.category && { category: req.body.category }),
  ...(req.body.email && { email: req.body.email }),
  ...(req.body.monthlyCost !== undefined && { monthlyCost: req.body.monthlyCost }),
  ...(req.body.isSubscription !== undefined && { isSubscription: req.body.isSubscription }),
  ...(req.body.isActive !== undefined && { isActive: req.body.isActive }),
  ...(req.body.notes && { notes: req.body.notes }),
  ...(req.body.icon && { icon: req.body.icon }),
  ...(req.body.color && { color: req.body.color }),
  updatedAt: new Date(),
};
  if (password) update.encryptedPass = encrypt(password);

  try {
    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, familyId: req.user.familyId },
      update,
      { new: true, lean: true }
    );
    if (!account) return res.status(404).json({ error: "Account not found" });
    const {encryptedPass,  ...safe } = account;
    res.json(safe);
  } catch {
    res.status(500).json({ error: "Failed to update account" });
  }
});

// DELETE /api/accounts/:id — owner only
app.delete("/api/accounts/:id", requireAuth, requireRole("owner"), async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid account ID" });
  }
  console.log(`User ${req.user.userId} is deleting account ${req.params.id}`);
  await AuditLog.create({
    userId: req.user.userId,
    action: "delete_account",
    accountId: req.params.id,
    familyId: req.user.familyId,
    timestamp: new Date(),
  });
  try {
    const result = await Account.findOneAndDelete({ _id: req.params.id, familyId: req.user.familyId });
    if (!result) return res.status(404).json({ error: "Account not found" });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete account" });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 FamilyVault API running on http://localhost:${PORT}`));