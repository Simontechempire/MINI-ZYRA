// ============================================================
// 💀 MINI-ZYRA - Devices API
// BY FACELESS - List / Logout / Status for 1000 bots
// Used by server.js: /api/devices /api/status /api/logout
// ============================================================

const fs = require('fs-extra');
const path = require('path');
const config = require('../config.json');
const sessionsDir = path.join(__dirname, '..', 'sessions');

function getDevices(activeSockets) {
  try {
    const devices = [];
    for (const [number, sock] of Object.entries(activeSockets || {})) {
      const isOnline = !!(sock && sock.user);
      devices.push({
        number,
        jid: sock?.user?.id || `${number}@s.whatsapp.net`,
        name: sock?.user?.name || config.botName || 'MINI-ZYRA',
        status: isOnline ? 'online' : 'connecting',
        online: isOnline,
        prefix: sock?.sessionSettings?.prefix || config.prefix || '.',
        mode: sock?.sessionSettings?.mode || config.mode || 'public',
        pairingCode: sock?.pairingCode || null,
        lastSeen: new Date().toISOString()
      });
    }
    if (fs.existsSync(sessionsDir)) {
      const folders = fs.readdirSync(sessionsDir).filter(f => {
        try { return fs.statSync(path.join(sessionsDir, f)).isDirectory(); } catch { return false; }
      });
      for (const folder of folders) {
        if (!devices.find(d => d.number === folder)) {
          let settings = {};
          try {
            const sf = path.join(sessionsDir, folder, 'settings.json');
            if (fs.existsSync(sf)) settings = JSON.parse(fs.readFileSync(sf, 'utf8'));
          } catch {}
          devices.push({
            number: folder,
            jid: `${folder}@s.whatsapp.net`,
            name: config.botName || 'MINI-ZYRA',
            status: 'offline',
            online: false,
            prefix: settings.prefix || config.prefix || '.',
            mode: settings.mode || config.mode || 'public',
            pairingCode: null,
            lastSeen: null
          });
        }
      }
    }
    return devices;
  } catch (e) { console.log('[DEVICES ERROR]', e.message); return []; }
}

function getStats(activeSockets) {
  const devices = getDevices(activeSockets);
  const online = devices.filter(d => d.online).length;
  return {
    success: true,
    total: devices.length,
    online,
    offline: devices.length - online,
    maxUsers: 1000,
    remaining: 1000 - devices.length,
    bot: config.botName || 'MINI-ZYRA',
    creator: config.creatorName || 'FACELESS',
    uptime: Date.now() - (global.botStart || Date.now()),
    devices
  };
}

async function logoutDevice(activeSockets, number) {
  const clean = String(number).replace(/[^0-9]/g, '');
  try {
    const sock = activeSockets[clean];
    if (sock) {
      try { await sock.logout().catch(()=>{}); } catch {}
      try { sock.end(); } catch {}
      delete activeSockets[clean];
    }
    const sessionPath = path.join(sessionsDir, clean);
    if (fs.existsSync(sessionPath)) await fs.remove(sessionPath).catch(()=>{});
    console.log(`[LOGOUT] ${clean} logged out`);
    return { success: true, message: `✅ ${clean} logged out. Get new code to link again.` };
  } catch (e) {
    return { success: false, message: 'Logout failed: ' + e.message };
  }
}

async function logoutAll(activeSockets) {
  const devices = getDevices(activeSockets);
  let count = 0;
  for (const d of devices) {
    const r = await logoutDevice(activeSockets, d.number);
    if (r.success) count++;
  }
  return { success: true, message: `✅ Logged out ${count} devices`, count };
}

// For server.js: GET /api/devices/:number
function getOneDevice(activeSockets, number) {
  const clean = String(number).replace(/[^0-9]/g, '');
  const devices = getDevices(activeSockets);
  return devices.find(d => d.number === clean) || null;
}

module.exports = { getDevices, getStats, logoutDevice, logoutAll, getOneDevice };
