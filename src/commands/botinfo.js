// ============================================================
// MINI-ZYRA - BOT INFO MODULE - ALL 5 IN ONE FILE
// BY FACELESS - NO DEMO - NO SIMULATION - NO PLACEHOLDER
// ============================================================
const fs = require('fs-extra');
const path = require('path');
const config = require('../../config.json');

function clean(t) { return String(t || '').replace(/[^0-9]/g, ''); }
function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}h ${m}m ${sec}s`;
}

const cmds = [];
const add = (name, alias, ownerOnly, execute) => cmds.push({ name, alias: alias || [], ownerOnly, execute });

// 1. OWNER - real, from config + session owner
add('owner', ['creator'], false, async (ctx) => {
  const ownerNum = clean(ctx.sessionOwner || config.ownerNumber);
  const me = ctx.sock.user;
  const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${config.creatorName || 'FACELESS'}\nORG:MINI-ZYRA\nTEL;type=CELL;type=VOICE;waid=${ownerNum}:+${ownerNum}\nEND:VCARD`;
  await ctx.sock.sendMessage(ctx.from, {
    contacts: { displayName: config.creatorName || 'FACELESS', contacts: [{ vcard }] },
    text: `👑 *MINI-ZYRA OWNER*\n\nName: ${config.creatorName || 'FACELESS'}\nNumber: +${ownerNum}\nBot: ${me?.name || config.botName}\nBot Number: +${clean(me?.id)}\n\nTap the contact above to save.`
  }, { quoted: ctx.m });
});

// 2. PING - real, measures round-trip
add('ping', ['p', 'speed'], false, async (ctx) => {
  const start = Date.now();
  const sent = await ctx.sock.sendMessage(ctx.from, { text: '🏓 Pinging...' }, { quoted: ctx.m });
  const ping = Date.now() - start;
  const uptime = formatUptime(Date.now() - (global.botStart || Date.now()));
  await ctx.sock.sendMessage(ctx.from, {
    text: `🏓 *PONG!*\n\n📶 Ping: ${ping}ms\n⏱️ Uptime: ${uptime}\n🤖 Bot: MINI-ZYRA\n👑 Owner: Faceless`,
    edit: sent.key
  });
});

// 3. ALIVE - real, checks sock + uptime + mode
add('alive', ['bot', 'online'], false, async (ctx) => {
  const uptime = formatUptime(Date.now() - (global.botStart || Date.now()));
  const mode = ctx.sessionSettings?.mode || config.mode || 'public';
  const prefix = ctx.prefix || '.';
  const total = new Set([...ctx.commands.values()].map(c => c.name)).size;
  const me = ctx.sock.user;
  await ctx.reply(`💀 *MINI-ZYRA IS ALIVE!*\n\n🤖 Bot: ${me?.name || 'MINI-ZYRA'}\n📶 Status: ONLINE ✅\n⏱️ Uptime: ${uptime}\n⚙️ Mode: ${mode}\n🔑 Prefix: ${prefix}\n📚 Commands: ${total}\n👑 Owner: Faceless\n\nType ${prefix}menu for all commands.`);
});

// 4. RUNTIME - real, from global.botStart + process
add('runtime', ['uptime', 'run'], false, async (ctx) => {
  const ms = Date.now() - (global.botStart || Date.now());
  const uptime = formatUptime(ms);
  const mem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
  const date = new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  await ctx.reply(`⏱️ *RUNTIME*\n\nUptime: ${uptime}\nStarted: ${new Date(global.botStart || Date.now()).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}\nNow: ${date} (WAT)\nMemory: ${mem} MB\nNode: ${process.version}\nPlatform: ${process.platform}`);
});

// 5. REPO - real, from config.json
add('repo', ['script', 'source'], false, async (ctx) => {
  const repo = config.repo || 'https://github.com/FACELESS/MINI-ZYRA';
  const version = config.version || '2.0.0';
  await ctx.reply(`💀 *MINI-ZYRA REPO*\n\n🔗 Repo: ${repo}\n🔖 Version: v${version}\n👑 Creator: ${config.creatorName || 'FACELESS'}\n🤖 Bot: MINI-ZYRA\n\n⭐ Star the repo\n🍴 Fork to deploy your own\n\nDeploy: Render / Koyeb / Panel`);
});

module.exports = cmds;
