// ============================================================
// 💀 MINI-ZYRA - Dashboard Server
// BY FACELESS
// METHOD: KNIGHT XMD + SIMON MD ENGINE
// USERS: 1000 PEOPLE CAN LINK - NO SLOT LIMIT - NO 20 LIMIT
// PAIR: PAIR CODE ONLY - NO QR
// AUTO-RESTORE: ALL SAVED BOTS COME BACK AFTER RESTART
// ============================================================

const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const config = require('./config.json');
const { handleMessage } = require('./src/handlers/message');
const { handleGroupUpdate } = require('./src/handlers/welcome');

// Inside sock connection, after sock.ev.on('connection.update'...)
sock.ev.on('messages.upsert', (up) => handleMessage(sock, up, sessionOwner, sessionSettings));
sock.ev.on('group-participants.update', (update) => handleGroupUpdate(sock, update));
const { startBot, activeSockets } = require('./src/connection');
const devicesApi = require('./src/devicesApi');

const app = express();

// ---------- MIDDLEWARE ----------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Log every request - so you see who is pairing
app.use((req, res, next) => {
  if (req.path.includes('/pair') || req.path.includes('/getcode') || req.path.includes('/status')) {
    console.log(`[WEB] ${req.method} ${req.path} | IP: ${req.ip} | Body: ${JSON.stringify(req.body || {})}`);
  }
  next();
});

// Devices API - 1000 Users
// GET /api/devices - list all
// POST /api/pair - pair any number
// POST /api/logout - logout any number
app.use('/api', devicesApi);

// ============================================================
// ========== 1. PAIRING - MAIN - NO BLOCKING ==========
// POST /api/pair
// Body: { number: "2348071569915" }
// Returns: { success: true, code: "XXXX-XXXX", number: "..." }
// ============================================================
app.post('/api/pair', async (req, res) => {
  try {
    const { number } = req.body;

    if (!number) {
      return res.json({ success: false, message: 'Number required. Example: 2348071569915' });
    }

    const clean = String(number).replace(/[^0-9]/g, '');

    if (clean.length < 7 || clean.length > 15) {
      return res.json({ success: false, message: 'Invalid number. Use full number with country code, e.g. 2348071569915' });
    }

    // FIX: DON'T block if socket exists
    // startBot() already handles:
    // - If already connected with user -> return alreadyConnected
    // - If dead socket -> delete it and make fresh one
    // - If code < 25 sec old -> return same code
    // Blocking here was causing "couldn't link" in Knight
    console.log(`[PAIR REQUEST] ${clean} | Currently Online: ${Object.keys(activeSockets).length} | Max: 1000`);

    const result = await startBot(clean);

    console.log(`[PAIR RESULT] ${clean} =>`, result.code ? `CODE: ${result.code}` : result.message);

    res.json({ ...result, number: clean });
  } catch (e) {
    console.log('[PAIR ERROR]', e.message, e.stack?.split('\n')[1] || '');
    res.json({ success: false, message: e.message });
  }
});

// ============================================================
// ========== 2. GETCODE - SIMON STYLE - FOR BROWSER LINK ==========
// GET /getcode?number=2348071569915
// Returns: { success: true, code: "XXXX", codeFormatted: "XXXX-XXXX", phone: "..." }
// ============================================================
app.get('/getcode', async (req, res) => {
  try {
    let phone = (req.query.number || req.query.phone || '').replace(/[^0-9]/g, '');

    if (!phone) {
      return res.json({ success: false, message: 'Add ?number=2348071569915' });
    }

    if (phone.length < 7 || phone.length > 15) {
      return res.json({ success: false, message: 'Invalid number' });
    }

    const result = await startBot(phone);

    if (result.code) {
      return res.json({
        success: true,
        code: result.code,
        phone,
        codeFormatted: result.code.match(/.{1,4}/g)?.join("-"),
        message: 'Enter this code in WhatsApp > Linked Devices > Link with code'
      });
    }

    res.json(result);
  } catch (e) {
    console.log('[GETCODE ERROR]', e.message);
    res.json({ success: false, message: e.message });
  }
});

// ============================================================
// ========== 3. STATUS - REAL DATA - NO FAKE ==========
// GET /api/status
// Returns online, waiting, total, bots list with code
// ============================================================
app.get('/api/status', (req, res) => {
  try {
    const bots = Object.keys(activeSockets);

    // Show which bots are truly connected (have user) vs just waiting for code
    const detailed = bots.map(n => ({
      number: n,
      connected: !!activeSockets[n]?.user,
      waitingForCode: !!activeSockets[n]?.pairingCode,
      code: activeSockets[n]?.pairingCode || null,
      user: activeSockets[n]?.user ? activeSockets[n].user.id : null,
      prefix: activeSockets[n]?.sessionSettings?.prefix || config.prefix,
      mode: activeSockets[n]?.sessionSettings?.mode || config.mode
    }));

    res.json({
      success: true,
      bot: 'MINI-ZYRA',
      botName: config.botName || 'MINI-ZYRA',
      creator: config.creatorName || 'FACELESS',
      online: bots.filter(b => activeSockets[b]?.user).length,
      waiting: bots.filter(b => !activeSockets[b]?.user).length,
      total: bots.length,
      maxUsers: 1000,
      bots: detailed,
      uptime: Math.floor((Date.now() - (global.botStart || Date.now())) / 1000),
      uptimeHuman: formatUptime(Date.now() - (global.botStart || Date.now())),
      prefix: config.prefix,
      mode: config.mode,
      time: new Date().toISOString()
    });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (d) return `${d}d ${h}h ${m}m`;
  if (h) return `${h}h ${m}m ${r}s`;
  if (m) return `${m}m ${r}s`;
  return `${r}s`;
}

// ============================================================
// ========== 4. LOGOUT / STOP BOT ==========
// POST /api/logout
// Body: { number: "2348071569915" }
// Deletes session, so user can get new code
// ============================================================
app.post('/api/logout', async (req, res) => {
  try {
    const { number } = req.body;
    const clean = (number || '').replace(/[^0-9]/g, '');

    if (!clean) return res.json({ success: false, message: 'Number required' });

    const sock = activeSockets[clean];
    if (sock) {
      try { await sock.logout(); } catch {}
      try { sock.end(); } catch {}
      delete activeSockets[clean];
    }

    await fs.remove(path.join(__dirname, 'sessions', clean)).catch(() => {});

    console.log(`[LOGOUT] ${clean} logged out, session cleared`);

    res.json({ success: true, message: 'Logged out, session cleared. Get new code now.' });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

// ============================================================
// ========== 5. HEALTH + PING ==========
// ============================================================
app.get('/health', (req, res) => res.json({ status: 'ok', bot: 'MINI-ZYRA', time: new Date().toISOString(), online: Object.keys(activeSockets).length }));
app.get('/api/ping', (req, res) => res.json({ success: true, message: 'pong', bot: 'MINI-ZYRA', time: Date.now() }));

// ============================================================
// ========== 6. HOME PAGE ==========
// ============================================================
app.get('/', (req, res) => {
  const file = path.join(__dirname, 'public/index.html');
  if (fs.existsSync(file)) return res.sendFile(file);
  res.send(`
    <h1>💀 MINI-ZYRA Dashboard</h1>
    <p>Bot is running. Use /api/pair to pair.</p>
    <p>Prefix: ${config.prefix} | Mode: ${config.mode}</p>
    <p>Online bots: ${Object.keys(activeSockets).length} / 1000</p>
    <p>By FACELESS</p>
  `);
});

// ============================================================
// ========== 7. AUTO-START SAVED BOTS ON RESTART ==========
// This is why 1000 users stay online after Render restart
// It reads sessions/ folder, finds creds.json, starts each bot
// Delay 800ms between each so WhatsApp does not rate-limit
// ============================================================
async function autoRestoreBots() {
  try {
    const sessionsDir = path.join(__dirname, 'sessions');
    if (!await fs.pathExists(sessionsDir)) {
      console.log('[RESTORE] No sessions folder yet');
      return;
    }

    const folders = await fs.readdir(sessionsDir);
    console.log(`[RESTORE] Found ${folders.length} session folders`);

    let restored = 0;
    for (const folder of folders) {
      const clean = String(folder).replace(/[^0-9]/g, '');
      if (!clean) continue;

      const credsPath = path.join(sessionsDir, folder, 'creds.json');
      if (!await fs.pathExists(credsPath)) {
        console.log(`[RESTORE] Skip ${clean} - no creds.json yet (never linked)`);
        continue;
      }

      console.log(`[RESTORE] Auto-starting saved bot: ${clean}`);
      try {
        await startBot(clean);
        restored++;
      } catch (e) {
        console.log(`[RESTORE] Failed ${clean}:`, e.message);
      }

      await new Promise(r => setTimeout(r, 800));
    }

    console.log(`[RESTORE] Done. Restored: ${restored} | Online now: ${Object.keys(activeSockets).length}`);
  } catch (e) {
    console.log('[RESTORE] Error:', e.message);
  }
}

// ============================================================
// ========== 8. START SERVER ==========
// ============================================================
const PORT = process.env.PORT || config.port || 3000;

app.listen(PORT, () => {
  console.log(`==========================================`);
  console.log(`💀 MINI-ZYRA Dashboard running on port ${PORT}`);
  console.log(`🌐 Open: http://localhost:${PORT}`);
  console.log(`👥 1000 Users Ready - No Slot Limit`);
  console.log(`📱 Pair: POST /api/pair { number: "234..." }`);
  console.log(`📱 GetCode: GET /getcode?number=234...`);
  console.log(`📊 Status: GET /api/status`);
  console.log(`👑 By FACELESS`);
  console.log(`==========================================`);
  setTimeout(() => autoRestoreBots(), 2000);
});

// ============================================================
// ========== 9. CRASH PROTECTION - NEVER DIE ==========
// ============================================================
process.on('uncaughtException', (e) => console.log('[UNCAUGHT]', e.message, e.stack?.split('\n')[1] || ''));
process.on('unhandledRejection', (e) => console.log('[REJECTION]', e?.message || e));
process.on('SIGTERM', () => console.log('[SERVER] SIGTERM - Render restarting...'));
process.on('SIGINT', () => console.log('[SERVER] SIGINT - Shutting down...'));
