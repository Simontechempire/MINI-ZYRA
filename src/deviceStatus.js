// ============================================================
// 💀 MINI-ZYRA - Devices Status - Live Health Check
// BY FACELESS - For dashboard + /api/status + /health
// Shows: online, connecting, offline, last ping
// ============================================================

const fs = require('fs-extra');
const path = require('path');
const config = require('../config')
const { getDevices } = require('./devicesApi');

const sessionsDir = path.join(__dirname, '..', 'sessions');

// Keep last ping time per device
const lastPing = {};

function ping(number) {
  lastPing[String(number).replace(/[^0-9]/g, '')] = Date.now();
}

function getStatus(activeSockets) {
  const devices = getDevices(activeSockets);
  const now = Date.now();
  const detailed = devices.map(d => {
    const last = lastPing[d.number] || 0;
    const ago = last ? Math.floor((now - last) / 1000) : null;
    return {
      ...d,
      lastPingAgoSec: ago,
      health: d.online ? 'healthy' : (d.status === 'connecting' ? 'connecting' : 'offline'),
      // If online but no ping in 5 min, mark as stale
      stale: d.online && last && (now - last > 300000)
    };
  });
  const online = detailed.filter(d => d.online).length;
  const connecting = detailed.filter(d => d.status === 'connecting').length;
  const offline = detailed.filter(d => !d.online && d.status !== 'connecting').length;

  return {
    success: true,
    server: 'online',
    bot: config.botName || 'MINI-ZYRA',
    creator: config.creatorName || 'FACELESS',
    version: config.version || '2.0.0',
    uptimeMs: now - (global.botStart || now),
    uptimeSec: Math.floor((now - (global.botStart || now)) / 1000),
    total: detailed.length,
    online,
    connecting,
    offline,
    maxUsers: 1000,
    remaining: 1000 - detailed.length,
    canLinkMore: detailed.length < 1000,
    devices: detailed
  };
}

function getHealth(activeSockets) {
  const s = getStatus(activeSockets);
  return {
    status: 'ok',
    bot: s.bot,
    total: s.total,
    online: s.online,
    uptime: s.uptimeSec,
    timestamp: new Date().toISOString()
  };
}

// Check if a session folder is corrupted
function checkSessionHealth(number) {
  const clean = String(number).replace(/[^0-9]/g, '');
  const folder = path.join(sessionsDir, clean);
  const creds = path.join(folder, 'creds.json');
  if (!fs.existsSync(folder)) return { exists: false, healthy: false, reason: 'No folder' };
  if (!fs.existsSync(creds)) return { exists: true, healthy: false, reason: 'No creds.json - never linked' };
  try {
    const data = JSON.parse(fs.readFileSync(creds, 'utf8'));
    if (!data.me) return { exists: true, healthy: false, reason: 'creds.json has no me - incomplete' };
    return { exists: true, healthy: true, me: data.me, reason: 'OK' };
  } catch (e) {
    return { exists: true, healthy: false, reason: 'creds.json corrupted: ' + e.message };
  }
}

module.exports = { getStatus, getHealth, ping, checkSessionHealth, lastPing };
