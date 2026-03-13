// Backend: src/routes/auth.route.js
// Install first: npm install firebase-admin

import express from "express";
import jwt from "jsonwebtoken";
import admin from "firebase-admin";
import User from "../models/User.js";


const router = express.Router();

// Initialize Firebase Admin once
// Get serviceAccountKey.json from:
// Firebase Console → Project Settings → Service Accounts → Generate New Private Key
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Replace \n in env var with actual newlines
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

// ── Existing login (unchanged) ────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    console.log("LOGIN BODY:", req.body);
    const { phone, role, name } = req.body || {};

    if (!phone || !role) {
      return res.status(400).json({ message: "Phone and role required" });
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: "Phone number must be exactly 10 digits" });
    }

    let user = await User.findOne({ phone, role });
    if (!user) {
      user = await User.create({ phone, role, name: name || "User" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ user, token });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Login failed" });
  }
});

// ── Firebase auth (OTP + Google OAuth) ───────────────────────────────────
router.post("/firebase", async (req, res) => {
  try {
    const { idToken, role, name, phone } = req.body;

    if (!idToken || !role) {
      return res.status(400).json({ message: "idToken and role required" });
    }

    // Verify the Firebase ID token
    const decoded = await admin.auth().verifyIdToken(idToken);

    // Extract identity from Firebase token
    // Phone auth → decoded.phone_number
    // Google auth → decoded.email
    const firebasePhone = decoded.phone_number?.replace("+91", "") || null;
    const firebaseEmail = decoded.email || null;
    const firebaseUid   = decoded.uid;
    const firebaseName  = decoded.name || name || "User";

    // Find or create user
    // Match by phone if available, else by email, else by firebaseUid
    let user = null;

    if (firebasePhone) {
      user = await User.findOne({ phone: firebasePhone });
    } else if (firebaseEmail) {
      user = await User.findOne({ email: firebaseEmail });
    }

    if (!user) {
      // New user — create with whatever identity we have
      user = await User.create({
        phone: firebasePhone || firebaseUid, // fallback uid as phone for Google users
        role,
        name: firebaseName,
        email: firebaseEmail || undefined,
        firebaseUid,
      });
    } else {
      // Existing user — update name/email if missing, and store firebaseUid
      const updates = {};
      if (!user.firebaseUid) updates.firebaseUid = firebaseUid;
      if (!user.name || user.name === "User") updates.name = firebaseName;
      if (firebaseEmail && !user.email) updates.email = firebaseEmail;
      if (Object.keys(updates).length) await User.findByIdAndUpdate(user._id, updates);
      user = await User.findById(user._id);
    }

    // Issue your app's JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ user, token });
  } catch (err) {
    console.error("FIREBASE AUTH ERROR:", err);
    if (err.code === "auth/id-token-expired") {
      return res.status(401).json({ message: "Token expired. Please sign in again." });
    }
    if (err.code === "auth/argument-error") {
      return res.status(401).json({ message: "Invalid token." });
    }
    res.status(500).json({ message: "Firebase auth failed" });
  }
});

export default router;