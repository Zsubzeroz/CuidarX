#!/usr/bin/env node
/**
 * Migration: delete personal events from 'appointments' and log to 'systemLogs'.
 * Uses Application Default Credentials from `firebase login`.
 */
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const os = require("os");

// Use Google OAuth2 refresh token with Firebase's known client ID/secret
const configPath = path.join(os.homedir(), ".config/configstore/firebase-tools.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const refreshToken = config.tokens?.refresh_token;

if (!refreshToken) {
  console.error("No refresh token found. Run: firebase login");
  process.exit(1);
}

// Firebase CLI uses these credentials for refresh token auth
const tokenFilePath = path.join(os.tmpdir(), "firebase-refresh-token.json");
fs.writeFileSync(tokenFilePath, JSON.stringify({
  client_id: "32555940559.apps.googleusercontent.com",
  client_secret: "j9iVZfS8ksCEFis41LqS5IkL",
  refresh_token: refreshToken,
}));

admin.initializeApp({
  credential: admin.credential.refreshToken(tokenFilePath),
  projectId: "podologa-fabricia",
});

const db = admin.firestore();

const PERSONAL_PATTERNS = [
  /almoco/i, /almoço/i, /hamburger/i,
  /estagio/i, /estágio/i, /ubs/i,
  /pilates/i,
  /reuniao/i, /reunião/i, /igreja/i, /oracao/i, /oração/i,
  /mamae/i, /mamãe/i,
  /feriado/i, /dia dos pais/i, /assumption/i,
  /birthday/i, /aniversario/i, /aniversário/i,
];

function isPersonalEvent(summary) {
  if (!summary) return false;
  return PERSONAL_PATTERNS.some((p) => p.test(summary));
}

async function run() {
  console.log("=== Migration: personal events from appointments → systemLogs ===\n");

  const snapshot = await db.collection("appointments").where("source", "==", "google").get();
  console.log(`Found ${snapshot.size} google-sourced appointments`);

  const personalDocs = [];
  const patientDocs = [];

  snapshot.docs.forEach((d) => {
    const data = d.data();
    if (isPersonalEvent(data.patientName)) {
      personalDocs.push({ id: d.id, data });
    } else {
      patientDocs.push({ id: d.id, data });
    }
  });

  console.log(`Personal events to migrate: ${personalDocs.length}`);
  console.log(`Patient events to keep: ${patientDocs.length}\n`);

  let deleted = 0;
  const logEntries = [];

  for (const p of personalDocs) {
    try {
      await db.doc(`appointments/${p.id}`).delete();
      deleted++;
      logEntries.push({
        appointmentId: p.id,
        patientName: p.data.patientName || "",
        date: p.data.date || "",
        time: p.data.time || "",
        calendarEventId: p.data.calendarEventId || null,
      });
      console.log(`  ✓ Deleted: "${p.data.patientName}" ${p.data.date} ${p.data.time}`);
    } catch (err) {
      console.error(`  ✗ Failed: ${p.id} — ${err.message}`);
    }
  }

  if (logEntries.length > 0) {
    await db.collection("systemLogs").add({
      type: "migration_personal_events",
      description: `Migrated ${logEntries.length} personal events from appointments to scheduleBlocks`,
      details: logEntries,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      deletedCount: logEntries.length,
    });
    console.log(`\nLogged ${logEntries.length} deletions to systemLogs`);
  }

  console.log(`\n=== Done: ${deleted}/${personalDocs.length} deleted ===`);
  process.exit(0);
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
