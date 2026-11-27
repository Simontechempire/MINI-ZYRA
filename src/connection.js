// ============================================================
// 💀 MINI-ZYRA - Connection - KNIGHT XMD + SIMON MD ENGINE
// BY FACELESS - YOUR METHOD - FIXED SO IT CAN LINK
// USERS: 1000 PEOPLE CAN LINK - NO SLOT LIMIT
// PAIR: PAIR CODE ONLY - NO QR
// ============================================================

const { 
  default: makeWASocket, 
  useMultiFileAuthState, 
  DisconnectReason, 
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers 
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs-extra');
const path = require('path');
const config = require('../config')
const { handleMessage } = require('./handler');

const activeSockets = {};
const sessionsDir = path.join(__dirname, '..', 'sessions');
fs.ensureDirSync(sessionsDir);

if (!global.db) global.db = { users: {}, groups: {}, settings: {}, warnings: {}, anti: {}, banned: [] };
if (!global.db.banned) global.db.banned = [];
if (!global.db.warnings) global.db.warnings = {};
if (!global.db.anti) global.db.anti = {};
if (!global.db.settings) global.db.settings = {};
if (!global.botStart) global.botStart = Date.now();

// ============================================================
// ========== SESSION SETTINGS - PER USER ==========
// Each of 1000 users has own prefix / mode / language
// So if User A does .setprefix !, User B still has .
// ============================================================
function getSessionSettingsPath(clean) {
  return path.join(sessionsDir, clean, 'settings.json');
}

function loadSessionSettings(clean) {
  try {
    const file = getSessionSettingsPath(clean);
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      data.owner = clean;
      if (!data.prefix) data.prefix = config.prefix || '.';
      if (!data.mode) data.mode = config.mode || 'public';
      if (!data.language) data.language = config.language || 'en';
      if (!data.botName) data.botName = config.botName || 'MINI-ZYRA';
      return data;
    }
  } catch {}
  const fresh = {
    owner: clean,
    prefix: config.prefix || '.',
    mode: config.mode || 'public',
    language: config.language || 'en',
    botName: config.botName || 'MINI-ZYRA',
    creatorNumber: clean,
    creatorName: config.creatorName || 'FACELESS',
    createdAt: new Date().toISOString()
  };
  try { fs.writeFileSync(getSessionSettingsPath(clean), JSON.stringify(fresh, null, 2)); } catch {}
  return fresh;
}

function saveSessionSettings(clean, settings) {
  try {
    settings.owner = clean;
    settings.updatedAt = new Date().toISOString();
    fs.writeFileSync(getSessionSettingsPath(clean), JSON.stringify(settings, null, 2));
  } catch {}
}

global.getSessionSettings = loadSessionSettings;
global.saveSessionSettings = saveSessionSettings;

// ============================================================
// ========== PAIRING LOCK - YOUR METHOD ==========
// Stops 2 codes at same time for same number
// Stops "code already generating" spam
// ============================================================
const pairingLocks = {};

function getLock(clean) {
  if (!pairingLocks[clean]) pairingLocks[clean] = { inProgress: false, lastCode: null, lastTime: 0 };
  return pairingLocks[clean];
}

// ============================================================
// ========== START BOT - MAIN FUNCTION ==========
// Called by server.js: POST /api/pair + GET /getcode + autoRestore
// ============================================================
async function startBot(number) {
  const clean = String(number).replace(/[^0-9]/g, '');
  const lock = getLock(clean);

  // FIX - RENDER REPLY FIX: Never return fake "Already Connected"
  // If socket has no user, it never connected. Delete it and make fresh one.
  // This was the #1 reason Knight said "couldn't link" - dead socket was blocking new code
  if (activeSockets[clean]) {
    const old = activeSockets[clean];
    if (old.user) {
      return { success: true, message: 'Already connected', code: null, alreadyConnected: true };
    }
    try { old.end(); } catch {}
    delete activeSockets[clean];
    lock.lastCode = null;
    lock.lastTime = 0;
    lock.inProgress = false;
  }

  const sessionPath = path.join(sessionsDir, clean);
  await fs.ensureDir(sessionPath);
  const sessionSettings = loadSessionSettings(clean);
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  let version = [2, 3000, 0];
  try {
    const v = await fetchLatestBaileysVersion();
    version = v.version;
  } catch {}

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.macOS('Safari'),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    },
    markOnlineOnConnect: config.autoOnline || false,
    syncFullHistory: false,
    connectTimeoutMs: config.connectTimeoutMs || 60000,
    keepAliveIntervalMs: config.keepAliveIntervalMs || 10000,
    retryRequestDelayMs: config.retryRequestDelayMs || 2000
  });

  activeSockets[clean] = sock;
  sock.pairingCode = null;
  sock.sessionOwner = clean;
  sock.sessionSettings = sessionSettings;
  sock.sessionNumber = clean;

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (u) => {
    const { connection, lastDisconnect } = u;
    if (connection === 'open') {
      console.log(`✅ MINI-ZYRA ONLINE: ${clean} | Owner: ${clean} | Prefix: ${sessionSettings.prefix} | Mode: ${sessionSettings.mode}`);
      sock.pairingCode = null;
      lock.lastCode = null;
      lock.inProgress = false;
      try {
        // Auto PFP - from config.json botPfp
        const pfpUrl = config.botPfp || config.pfp || config.menuImage;
        if (pfpUrl && pfpUrl.startsWith('http')) {
          await sock.updateProfilePicture(sock.user.id, { url: pfpUrl }).catch(() => {});
        }
        // Auto Bio / Status
        const statusText = config.botStatus || config.statusText || `💀 MINI-ZYRA | BY ${config.creatorName || 'FACELESS'} | Prefix ${sessionSettings.prefix} | Type ${sessionSettings.prefix}menu`;
        await sock.updateProfileStatus(statusText).catch(() => {});
      } catch {}
    }
    if (connection === 'close') {
      delete activeSockets[clean];
      // FIX - Clear lock on close so next code is fresh, not dead code
      lock.lastCode = null;
      lock.lastTime = 0;
      lock.inProgress = false;
      sock.pairingCode = null;
      const code = lastDisconnect?.error?.output?.statusCode;
      console.log(`[MINI-ZYRA ${clean}] Closed:`, code);
      if ([DisconnectReason.loggedOut, 401, 440, 405].includes(code)) {
        await fs.remove(sessionPath).catch(() => {});
        console.log(`[MINI-ZYRA ${clean}] Logged out - session cleared, get new code`);
      } else if (code !== DisconnectReason.loggedOut) {
        console.log(`Reconnecting ${clean} in 10s...`);
        setTimeout(() => startBot(clean).catch(() => {}), 10000);
      }
    }
  });

  sock.ev.on('messages.upsert', async (up) => {
    try {
      const liveSettings = loadSessionSettings(clean);
      sock.sessionSettings = liveSettings;
      // Auto View Status - only if user turned it on
      if (config.autoViewStatus || global.db.settings?.autoView) {
        for (const m of up.messages) {
          if (m.key.remoteJid === 'status@broadcast') {
            try {
              await sock.readMessages([m.key]);
              if (global.db.settings?.autoLikeStatus || config.autoLikeStatus) {
                await sock.sendMessage('status@broadcast', { react: { text: '❤️', key: m.key } }).catch(() => {});
              }
            } catch {}
          }
        }
      }
      await handleMessage(sock, up, clean, liveSettings);
    } catch (e) { console.log('[UP ERROR]', e.message); }
  });

  sock.ev.on('messages.update', async (updates) => {
    try {
      for (const u of updates) {
        if (u.update?.message === null && global.db.anti?.[u.key.remoteJid]?.antidelete) {
          console.log(`[ANTI-DELETE] Deleted in ${u.key.remoteJid}`);
        }
      }
    } catch {}
  });

  // ============================================================
  // ========== PAIR CODE - YOUR METHOD - 25 SEC LOCK ==========
  // If code < 25 sec old, return SAME code - don't make new one
  // If inProgress, tell user wait 5 sec - don't spam WhatsApp
  // ============================================================
  if (!state.creds.registered) {
    if (lock.lastCode && Date.now() - lock.lastTime < 25000) {
      sock.pairingCode = lock.lastCode;
      return { success: true, code: lock.lastCode, message: 'Use this same code, no refresh' };
    }
    if (lock.inProgress) {
      return { success: false, message: 'Code already generating, wait 5 sec and refresh' };
    }
    lock.inProgress = true;
    try {
      await new Promise(r => setTimeout(r, 2000));
      const code = await sock.requestPairingCode(clean);
      sock.pairingCode = code;
      lock.lastCode = code;
      lock.lastTime = Date.now();
      console.log(`[PAIR] ${clean} => ${code}`);
      return { success: true, code, message: 'Enter this code in WhatsApp > Linked Devices > Link with code' };
    } catch (e) {
      console.log('Pair error', e.message);
      delete activeSockets[clean];
      return { success: false, message: 'Pair failed, try again: ' + e.message };
    } finally {
      lock.inProgress = false;
    }
  }

  return { success: true, message: 'Bot connected / waiting', code: null };
}

module.exports = { startBot, activeSockets, loadSessionSettings, saveSessionSettings };
