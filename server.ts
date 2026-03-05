import express from "express";
import { createServer as createViteServer } from "vite";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cors from "cors";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
const PORT = 3000;

// Email Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async (to: string, subject: string, html: string) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("SMTP credentials not configured. Email not sent.");
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@thehairgallery.com",
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
const DATA_DIR = path.join(process.cwd(), "data");
const ADMIN_FILE = path.join(DATA_DIR, "admin.json");
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_dev_only";

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Initialize admin if not exists
if (!fs.existsSync(ADMIN_FILE)) {
  const defaultAdmin = {
    username: process.env.ADMIN_USERNAME || "admin",
    // Default password is 'admin123'
    passwordHash: bcrypt.hashSync("admin123", 10),
    email: "nwagwu2ebere@gmail.com",
    resetToken: null,
    resetTokenExpiry: null
  };
  fs.writeFileSync(ADMIN_FILE, JSON.stringify(defaultAdmin, null, 2));
}

app.use(cors());
app.use(express.json());

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// API Routes
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  const admin = JSON.parse(fs.readFileSync(ADMIN_FILE, "utf-8"));

  if (username !== admin.username) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const validPassword = bcrypt.compareSync(password, admin.passwordHash);
  if (!validPassword) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const token = jwt.sign({ username: admin.username }, JWT_SECRET, { expiresIn: "24h" });
  res.json({ token });
});

app.post("/api/auth/verify-username", (req, res) => {
  const { username } = req.body;
  const admin = JSON.parse(fs.readFileSync(ADMIN_FILE, "utf-8"));

  if (username === admin.username) {
    return res.json({ valid: true });
  }

  res.status(404).json({ message: "Username not found" });
});

app.post("/api/auth/forgot-password", (req, res) => {
  const { username, email } = req.body;
  const admin = JSON.parse(fs.readFileSync(ADMIN_FILE, "utf-8"));

  const normalizedEmail = email.trim().toLowerCase();
  const storedEmail = admin.email.trim().toLowerCase();

  if (username === admin.username && normalizedEmail === storedEmail) {
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const hashedToken = bcrypt.hashSync(resetToken, 10);
    
    admin.resetToken = hashedToken;
    admin.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    fs.writeFileSync(ADMIN_FILE, JSON.stringify(admin, null, 2));

    sendEmail(
      admin.email,
      "Password Reset Request - The Hair Gallery",
      `<p>You requested a password reset for your admin account.</p>
       <p>Your reset token is: <strong>${resetToken}</strong></p>
       <p>This token will expire in 1 hour.</p>`
    );

    return res.json({ 
      message: "Reset token generated and sent to your email.",
    });
  }

  res.status(401).json({ message: "The email provided does not match our records for this username." });
});

app.post("/api/auth/reset-password", (req, res) => {
  const { token, newPassword } = req.body;
  const admin = JSON.parse(fs.readFileSync(ADMIN_FILE, "utf-8"));

  if (!admin.resetToken || !admin.resetTokenExpiry || Date.now() > admin.resetTokenExpiry) {
    return res.status(400).json({ message: "Invalid or expired reset token" });
  }

  const validToken = bcrypt.compareSync(token, admin.resetToken);
  if (!validToken) {
    return res.status(400).json({ message: "Invalid reset token" });
  }

  admin.passwordHash = bcrypt.hashSync(newPassword, 10);
  admin.resetToken = null;
  admin.resetTokenExpiry = null;
  fs.writeFileSync(ADMIN_FILE, JSON.stringify(admin, null, 2));

  res.json({ message: "Password reset successful" });
});

// Booking Email Routes
app.post("/api/bookings/notify-request", (req, res) => {
  const { clientName, clientEmail, serviceName, date, time } = req.body;
  
  // Notify Client
  sendEmail(
    clientEmail,
    "Appointment Request Received - The Hair Gallery",
    `<p>Hello ${clientName},</p>
     <p>We've received your appointment request for <strong>${serviceName}</strong> on <strong>${date}</strong> at <strong>${time}</strong>.</p>
     <p>Please wait for our confirmation email once we've reviewed your request.</p>`
  );

  // Notify Admin
  const admin = JSON.parse(fs.readFileSync(ADMIN_FILE, "utf-8"));
  sendEmail(
    admin.email,
    "New Appointment Request",
    `<p>New request from <strong>${clientName}</strong> (${clientEmail})</p>
     <p>Service: ${serviceName}</p>
     <p>Time: ${date} at ${time}</p>`
  );

  res.json({ success: true });
});

app.post("/api/bookings/notify-status", (req, res) => {
  const { clientName, clientEmail, serviceName, date, time, status } = req.body;
  
  const isAccepted = status === "ACCEPTED";
  const subject = isAccepted ? "Appointment Confirmed! - The Hair Gallery" : "Appointment Update - The Hair Gallery";
  const message = isAccepted 
    ? `<p>Great news ${clientName}!</p><p>Your appointment for <strong>${serviceName}</strong> on <strong>${date}</strong> at <strong>${time}</strong> has been <strong>ACCEPTED</strong>.</p><p>We look forward to seeing you!</p>`
    : `<p>Hello ${clientName},</p><p>We're sorry, but your appointment request for <strong>${serviceName}</strong> on <strong>${date}</strong> at <strong>${time}</strong> could not be accepted at this time.</p>`;

  sendEmail(clientEmail, subject, message);
  res.json({ success: true });
});

// Protected route example
app.get("/api/admin/check", authenticateToken, (req, res) => {
  res.json({ authenticated: true });
});

app.get("/api/admin/email-status", authenticateToken, (req, res) => {
  const configured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  res.json({ 
    configured, 
    message: configured ? "Email system is ready." : "SMTP credentials missing." 
  });
});

app.post("/api/admin/test-email", authenticateToken, async (req, res) => {
  const admin = JSON.parse(fs.readFileSync(ADMIN_FILE, "utf-8"));
  try {
    await sendEmail(
      admin.email,
      "Test Email - The Hair Gallery",
      "<p>This is a test email to verify your SMTP configuration. If you're reading this, it works!</p>"
    );
    res.json({ message: "Test email sent successfully to " + admin.email });
  } catch (err) {
    res.status(500).json({ message: "Failed to send test email." });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
