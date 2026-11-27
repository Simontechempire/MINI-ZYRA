// ============================================================
// 💀 MINI-ZYRA - Multiple Devices Manager
// BY FACELESS - 1000 USERS CAN LINK AT SAME TIME
// NO SLOT LIMIT - NO QUEUE - NO WAITING
// ============================================================

const fs = require('fs-extra');
const path = require('path');
const config = require('../config.json');
const { startBot } = require('./connection');

const sessionsDir = path.join(__dirname, '..', 'sessions');
fs.ensureDirSync(sessionsDir);

// Track all bots in memory
let activeSockets = {};
try {
  const conn = require('./connection');
  if (conn.activeSockets) activeSockets = conn.activeSockets;
} catch {}

// ============================================================
// ========== GET ALL SESSIONS FROM DISK ==========
// Returns list of numbers that have a folder in /sessions
// ============================================================
function getAllSessionNumbers() {
  try {
    if (!fs.existsSync(sessionsDir)) return [];
    return fs.readdirSync(sessionsDir).filter(f => {
      try { return fs.statSync(path.join(sessionsDir, f)).isDirectory(); } catch { return false; }
    });
  } catch { return []; }
}

// ============================================================
// ========== START ONE BOT ==========
// Used by server.js when user clicks GET PAIR CODE
// ============================================================
async function startOne(number) {
  const clean = String(number).replace(/[^0-9]/g, '');
  if (!clean || clean.length < 7) {
    return { success: false, message: 'Invalid number. Use country code, e.g. 2348071569915' };
  }
  // Max check - 1000
  const total = getAllSessionNumbers().length;
  const alreadyExists = getAllSessionNumbers().includes(clean);
  if (total >= 1000 && !alreadyExists) {
    return { success: false, message: '❌ Max 1000 users reached. Try later.' };
  }
  try {
    const result = await startBot(clean);
    return result;
  } catch (e) {
    return { success: false, message: 'Start failed: ' + e.message };
  }
}

// ============================================================
// ========== AUTO RESTORE ALL BOTS ON RESTART ==========
// When Render restarts / redeploys, this re-connects all
// bots that were already linked. No need to re-pair.
// ============================================================
async function restoreAll(delayMs = 3000) {
  const numbers = getAllSessionNumbers();
  console.log(`[RESTORE] Found ${numbers.length} sessions to restore...`);
  let restored = 0;
  for (const num of numbers) {
    try {
      // Skip folders that have no creds.json - they never linked
      const credsFile = path.join(sessionsDir, num, 'creds.json');
      if (!fs.existsSync(credsFile)) {
        console.log(`[RESTORE] Skip ${num} - no creds.json (never linked)`);
        continue;
      }
      console.log(`[RESTORE] Restoring ${num}...`);
      await startBot(num).catch(()=>{});
      restored++;
      // Delay between restores so WhatsApp doesn't rate-limit
      await new Promise(r => setTimeout(r, delayMs));
    } catch (e) {
      console.log(`[RESTORE FAIL] ${num}:`, e.message);
    }
  }
  console.log(`[RESTORE DONE] ${restored}/${numbers.length} bots restored`);
  return { success: true, restored, total: numbers.length };
}

// ============================================================
// ========== GET COUNT ==========
// ============================================================
function getCount() {
  const numbers = getAllSessionNumbers();
  const online = Object.values(activeSockets).filter(s => s && s.user).length;
  return { total: numbers.length, online, offline: numbers.length - online, max: 1000, remaining: 1000 - numbers.length };
}

// ============================================================
// ========== CLEAN DEAD SESSIONS ==========
// Deletes folders with no creds and older than 1 hour
// So /sessions doesn't fill with junk from failed pair attempts
// ============================================================
async function cleanDead() {
  const numbers = getAllSessionNumbers();
  let cleaned = 0;
  for (const num of numbers) {
    try {
      const credsFile = path.join(sessionsDir, num, 'creds.json');
      const folder = path.join(sessionsDir, num);
      if (!fs.existsSync(credsFile)) {
        const stat = fs.statSync(folder);
        const age = Date.now() - stat.mtimeMs;
        if (age > 3600000) { // 1 hour
          await fs.remove(folder);
          cleaned++;
        }
      }
    } catch {}
  }
  if (cleaned > 0) console.log(`[CLEAN] Removed ${cleaned} dead sessions`);
  return cleaned;
}

// Auto clean every 1 hour
setInterval(() => cleanDead().catch(()=>{}), 3600000);

module.exports = { startOne, restoreAll, getAllSessionNumbers, getCount, cleanDead, activeSockets };
