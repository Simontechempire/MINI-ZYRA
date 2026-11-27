// ============================================================
// MINI-ZYRA - Handler - Message Router - FIXED FOR ALL 14 MODULES
// BY FACELESS - Supports Array exports + Single exports
// REACT: ⏳ BEFORE -> 💀 AFTER -> ❌ ON ERROR
// ============================================================
const fs = require('fs-extra');
const path = require('path');
const config = require('../config')
try { require('../util/fancy'); } catch {}

const commands = new Map();
// FIXED PATH: handler is in src/handlers/ -> commands is in src/commands/
const commandsDir = path.join(__dirname, '../commands');
const dbPath = path.join(__dirname, '../../database.json');
global.botStart = global.botStart || Date.now();

function getDBFile() { try { return JSON.parse(fs.readFileSync(dbPath, 'utf8')); } catch { return { banned: [], groupSettings: {}, economy: {} }; } }

function loadCommands() {
  try {
    commands.clear();
    if (!fs.existsSync(commandsDir)) { console.log('[HANDLER] No commands dir:', commandsDir); return; }
    const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));
    let total = 0;
    for (const file of files) {
      try {
        const full = path.join(commandsDir, file);
        delete require.cache[require.resolve(full)];
        const exported = require(full);
        // NEW FORMAT: Array from Modules 1-14
        const list = Array.isArray(exported) ? exported : [exported];
        for (const cmd of list) {
          if (!cmd || !cmd.name || typeof cmd.execute !== 'function') { console.log(`[CMD SKIP] ${file} - missing name/execute`); continue; }
          commands.set(cmd.name.toLowerCase(), cmd);
          if (Array.isArray(cmd.alias)) for (const a of cmd.alias) commands.set(String(a).toLowerCase(), cmd);
          total++;
        }
        console.log(`✅ Loaded ${file} -> ${list.length} cmd(s)`);
      } catch (e) { console.log(`[CMD LOAD FAIL] ${file}:`, e.message); }
    }
    console.log(`[HANDLER] Loaded ${total} commands (${commands.size} with aliases) from ${files.length} files`);
  } catch (e) { console.log('[HANDLER LOAD]', e.message); }
}
loadCommands();
global.reloadCommands = loadCommands;
global.commands = commands;

function fancy(text) {
  const map = { a:'𝐚',b:'𝐛',c:'𝐜',d:'𝐝',e:'𝐞',f:'𝐟',g:'𝐠',h:'𝐡',i:'𝐢',j:'𝐣',k:'𝐤',l:'𝐥',m:'𝐦',n:'𝐧',o:'𝐨',p:'𝐩',q:'𝐪',r:'𝐫',s:'𝐬',t:'𝐭',u:'𝐮',v:'𝐯',w:'𝐰',x:'𝐱',y:'𝐲',z:'𝐳',A:'𝐀',B:'𝐁',C:'𝐂',D:'𝐃',E:'𝐄',F:'𝐅',G:'𝐆',H:'𝐇',I:'𝐈',J:'𝐉',K:'𝐊',L:'𝐋',M:'𝐌',N:'𝐍',O:'𝐎',P:'𝐏',Q:'𝐐',R:'𝐑',S:'𝐒',T:'𝐓',U:'𝐔',V:'𝐕',W:'𝐖',X:'𝐗',Y:'𝐘',Z:'𝐙','0':'𝟎','1':'𝟏','2':'𝟐','3':'𝟑','4':'𝟒','5':'𝟓','6':'𝟔','7':'𝟕','8':'𝟖','9':'𝟗' };
  return String(text).split('').map(c => map[c] || c).join('');
}

async function handleMessage(sock, up, sessionOwner, sessionSettings) {
  try {
    if (!up || !up.messages) return;
    for (const m of up.messages) {
      if (!m.message) continue;
      if (m.key.fromMe) continue;

      const from = m.key.remoteJid;
      const isGroup = from.endsWith('@g.us');
      const sender = isGroup ? (m.key.participant || m.participant || from) : from;
      const senderNumber = sender.replace(/[^0-9]/g, '');

      let text = '';
      if (m.message.conversation) text = m.message.conversation;
      else if (m.message.extendedTextMessage?.text) text = m.message.extendedTextMessage.text;
      else if (m.message.imageMessage?.caption) text = m.message.imageMessage.caption;
      else if (m.message.videoMessage?.caption) text = m.message.videoMessage.caption;
      if (!text) continue;

      const prefix = sessionSettings?.prefix || config.prefix || '.';
      const mode = sessionSettings?.mode || config.mode || 'public';
      const ownerNumber = String(sessionOwner || config.ownerNumber || '2348071569915').replace(/[^0-9]/g, '');
      const isOwner = senderNumber === ownerNumber;

      if (mode === 'private' && !isOwner) continue;
      if (mode === 'self' && !isOwner) continue;

      // Banned check - REAL from database.json (owner2.js writes here)
      const dbFile = getDBFile();
      if ((dbFile.banned || []).includes(senderNumber) && !isOwner) {
        if (text.startsWith(prefix)) await sock.sendMessage(from, { text: config.messages?.banned || '🚫 YOU ARE BANNED' }, { quoted: m }).catch(()=>{});
        continue;
      }

      // Group metadata ONCE - for admin checks + ctx
      let meta = null, isAdmin = false, isBotAdmin = false, botJid = null;
      if (isGroup) {
        try {
          meta = await sock.groupMetadata(from).catch(()=>null);
          const me = meta?.participants?.find(p => p.id === sock.user?.id);
          isBotAdmin = me?.admin === 'admin' || me?.admin === 'superadmin';
          const part = meta?.participants?.find(p => p.id === sender);
          isAdmin = part?.admin === 'admin' || part?.admin === 'superadmin';
          botJid = sock.user?.id;
        } catch {}
      }

      // Build ctx FIRST - so antilink can use it
      const fullText = text.slice(prefix.length).trim();
      const args = fullText.split(/\s+/).filter(Boolean);
      const cmdName = (args.shift() || '').toLowerCase();

      // Attach helpers to m - modules use these
      m.quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage ? { participant: m.message.extendedTextMessage.contextInfo.participant } : null;
      m.mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

      const ctx = {
        sock, m, from, isGroup, sender, senderNumber, isOwner, isAdmin, isBotAdmin, botJid, groupMetadata: meta,
        args, text: fullText, prefix, mode, sessionOwner, sessionSettings,
        fancy, commands, config,
        reply: async (txt, opts = {}) => await sock.sendMessage(from, { text: txt, ...opts }, { quoted: m }).catch(()=>{}),
        replyImage: async (image, caption) => {
          try {
            if (typeof image === 'string' && image.startsWith('http')) return await sock.sendMessage(from, { image: { url: image }, caption: caption || '' }, { quoted: m });
            return await sock.sendMessage(from, { image, caption: caption || '' }, { quoted: m });
          } catch { return await sock.sendMessage(from, { text: caption || '' }, { quoted: m }).catch(()=>{}); }
        }
      };

      // ANTILINK / ANTISPAM / ANTIPORN - Module 11 engine
      try {
        const { handleAntiLink } = require('./welcome');
        if (await handleAntiLink(sock, m, ctx)) continue;
      } catch (e) { /* welcome.js not yet added - skip */ }

      if (!text.startsWith(prefix)) continue;
      if (!cmdName) continue;

      const cmd = commands.get(cmdName);
      if (!cmd) continue;

      if (cmd.ownerOnly && !isOwner) { await sock.sendMessage(from, { text: config.messages?.ownerOnly || '❌ OWNER ONLY' }, { quoted: m }).catch(()=>{}); continue; }
      if (cmd.adminOnly && isGroup && !isAdmin && !isOwner) { await sock.sendMessage(from, { text: '❌ ONLY GROUP ADMINS CAN USE THIS' }, { quoted: m }).catch(()=>{}); continue; }
      if (cmd.groupOnly && !isGroup) { await sock.sendMessage(from, { text: '❌ THIS COMMAND ONLY WORKS IN A GROUP' }, { quoted: m }).catch(()=>{}); continue; }

      try { if (config.autoReact !== false) await sock.sendMessage(from, { react: { text: config.reactBefore || '⏳', key: m.key } }).catch(()=>{}); } catch {}

      try {
        await cmd.execute(ctx);
        try { if (config.autoReact !== false) await sock.sendMessage(from, { react: { text: config.reactAfter || '💀', key: m.key } }).catch(()=>{}); } catch {}
        if (global.db) { global.db.stats = global.db.stats || {}; global.db.stats.commands = (global.db.stats.commands || 0) + 1; }
      } catch (e) {
        console.log(`[CMD ERROR] ${cmdName}:`, e.message);
        try { await sock.sendMessage(from, { react: { text: config.reactError || '❌', key: m.key } }).catch(()=>{}); } catch {}
        await sock.sendMessage(from, { text: `❌ COMMAND FAILED\n\n${e.message}\n\nType ${prefix}menu` }, { quoted: m }).catch(()=>{});
      }
    }
  } catch (e) { console.log('[HANDLER ERROR]', e.message); }
}

module.exports = { handleMessage, loadCommands, commands, fancy };
