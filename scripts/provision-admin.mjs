/**
 * Road Development Authority (RDA) - Sri Lanka
 * Contractor Data Collection System
 * 
 * Secure One-Time Initial Administrator Provisioning Tool
 * 
 * Usage:
 *   node --env-file=.env.local scripts/provision-admin.mjs
 * 
 * With Authorized Credentials:
 *   INIT_ADMIN_EMAIL=officer@rda.gov.lk INIT_ADMIN_PASSWORD="<STRONG_PASSWORD>" node --env-file=.env.local scripts/provision-admin.mjs
 * 
 * Safety & Security:
 * - Checks for existing Super Administrator; idempotently aborts if already provisioned.
 * - Enforces minimum 12-character high-complexity password.
 * - Uses bcrypt with 12 salt rounds.
 * - Never logs or reveals plain-text passwords.
 * - Refuses to create any accounts without explicit authorized credentials.
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dns from "dns";

// Prefer IPv4 resolution order
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

const MIN_PASSWORD_LENGTH = 12;

async function run() {
  console.log("\n========================================================");
  console.log("  RDA System: One-Time Administrator Provisioning Tool  ");
  console.log("  Road Development Authority, Sri Lanka                 ");
  console.log("========================================================\n");

  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.error("❌ ERROR: MONGODB_URI is not set in environment variables (.env.local).");
    process.exit(1);
  }

  // Sanitize URI for safe console display
  const sanitizedUri = MONGODB_URI.replace(/mongodb(\+srv)?:\/\/[^@]+@/gi, "mongodb$1://[REDACTED]@");
  console.log(`Connecting to database: ${sanitizedUri}...`);

  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  const db = mongoose.connection.db;
  const usersCollection = db.collection("users");

  // 1. Check if a Super Administrator already exists
  const existingSuperAdmin = await usersCollection.findOne({ role: "SUPER_ADMIN" });

  if (existingSuperAdmin) {
    console.log("🔒 NOTICE: A Super Administrator is already provisioned in this database.");
    console.log(`   Official Email: ${existingSuperAdmin.email}`);
    console.log(`   RDA Staff ID:   ${existingSuperAdmin.rdaStaffId || "N/A"}`);
    console.log(`   Created At:     ${existingSuperAdmin.createdAt || "Recorded"}`);
    console.log("\nOne-time provisioning is locked to prevent unauthorized privilege elevation.");
    await mongoose.disconnect();
    process.exit(0);
  }

  // 2. Check for provided authorized administrator credentials
  const email = (process.env.INIT_ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.INIT_ADMIN_PASSWORD || "";
  const fullName = (process.env.INIT_ADMIN_NAME || "Eng. Chief Administrative Officer").trim();
  const rdaStaffId = (process.env.INIT_ADMIN_STAFF_ID || "RDA/HQ/DIR/001").trim();

  if (!email || !password) {
    console.log("ℹ️  STATUS: Ready for initial administrator provisioning.");
    console.log("   No existing Super Administrator detected in database.\n");
    console.log("⚠️  POLICY: No default or unverified official account will be created.");
    console.log("   To provision the initial administrator, specify authorized credentials:\n");
    console.log("   Windows PowerShell Example:");
    console.log('   $env:INIT_ADMIN_EMAIL="official.admin@rda.gov.lk"');
    console.log('   $env:INIT_ADMIN_PASSWORD="YourStrongPassword2026!"');
    console.log('   $env:INIT_ADMIN_NAME="Engineer MR Indunil Madhusanka"');
    console.log('   node --env-file=.env.local scripts/provision-admin.mjs\n');
    console.log("Standing by. Database remains unpopulated and secure.\n");
    await mongoose.disconnect();
    process.exit(0);
  }

  // 3. Validate authorized credentials
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error("❌ ERROR: Provided INIT_ADMIN_EMAIL is not a valid email address format.");
    await mongoose.disconnect();
    process.exit(1);
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`❌ ERROR: Password must be at least ${MIN_PASSWORD_LENGTH} characters long for public sector administrative accounts.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
    console.error("❌ ERROR: Password must contain uppercase letters, lowercase letters, numbers, and special symbols.");
    await mongoose.disconnect();
    process.exit(1);
  }

  // 4. Hash password with bcrypt (salt rounds = 12)
  console.log("Generating secure bcrypt password hash (rounds = 12)...");
  const passwordHash = await bcrypt.hash(password, 12);

  // 5. Insert authorized Super Administrator record
  const now = new Date();
  const newAdminDoc = {
    email,
    passwordHash,
    fullName,
    designation: "Chief Engineer (Planning & Procurement)",
    role: "SUPER_ADMIN",
    assignedProvince: "All Provinces (National HQ)",
    rdaStaffId,
    isActive: true,
    isDemoRecord: false,
    createdAt: now,
    updatedAt: now,
  };

  await usersCollection.insertOne(newAdminDoc);
  console.log("✅ SUCCESS: Initial Super Administrator provisioned successfully!");
  console.log(`   Official Email:      ${email}`);
  console.log(`   Full Name:           ${fullName}`);
  console.log(`   Role:                SUPER_ADMIN`);
  console.log(`   Assigned Province:   All Provinces (National HQ)`);
  console.log(`   RDA Staff ID:        ${rdaStaffId}`);
  console.log(`   Timestamp:           ${now.toISOString()}`);
  console.log("\nProvisioning completed securely. Initial administrator can now sign in at /login.\n");

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Provisioning failed:", err.message);
  process.exit(1);
});
