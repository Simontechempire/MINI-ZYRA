// ============================================================
// 💀 MINI-ZYRA - Handler - Message Router
// BY FACELESS - KNIGHT XMD + SIMON MD ENGINE
// REACT: ⏳ BEFORE -> 💀 AFTER -> ❌ ON ERROR
// PER-SESSION: Each bot has own prefix / mode
// ============================================================

const fs = require('fs-extra');
const path = require('path');
const { fancy } = require('../util/fancy');
const config = require('../config.json');

const commands = new Map();
const commandsDir = path.join(__dirname, 'commands');

// Load all commands from src/commands/*.js
function loadCommands() {
  try {
    if (!fs.existsSync(commandsDir)) return;
    const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));
    for (const file of files) {
      try {
        delete require.cache[require.resolve(path.join(commandsDir, file))];
        const cmd = require(path.join(commandsDir, file));
        if (cmd.name) {
          commands.set(cmd.name.toLowerCase(), cmd);
          if (cmd.alias) {
            for (const a of cmd.alias) commands.set(a.toLowerCase(), cmd);
          }
        }
      } catch (e) { console.log(`[CMD LOAD FAIL] ${file}:`, e.message); }
    }
    console.log(`[HANDLER] Loaded ${commands.size} commands from ${files.length} files`);
  } catch (e) { console.log('[HANDLER LOAD]', e.message); }
}
loadCommands();
global.reloadCommands = loadCommands;
global.commands = commands;

// Fancy font - for menu / fancy commands
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

      // Get text
      let text = '';
      if (m.message.conversation) text = m.message.conversation;
      else if (m.message.extendedTextMessage?.text) text = m.message.extendedTextMessage.text;
      else if (m.message.imageMessage?.caption) text = m.message.imageMessage.caption;
      else if (m.message.videoMessage?.caption) text = m.message.videoMessage.caption;
      if (!text) continue;

      // Per-session settings - live reload
      const prefix = sessionSettings?.prefix || config.prefix || '.';
      const mode = sessionSettings?.mode || config.mode || 'public';
      const ownerNumber = sessionOwner || config.ownerNumber || '2348071569915';
      const isOwner = senderNumber === ownerNumber || senderNumber === String(config.ownerNumber).replace(/[^0-9]/g, '');

      // Mode check
      if (mode === 'private' && !isOwner) continue;
      if (mode === 'self' && !isOwner) continue;

      // Banned check
      if (global.db?.banned?.includes(senderNumber)) {
        if (text.startsWith(prefix)) {
          await sock.sendMessage(from, { text: config.messages?.banned || '🚫 YOU ARE BANNED' }, { quoted: m }).catch(()=>{});
        }
        continue;
      }

      // Must start with prefix
      if (!text.startsWith(prefix)) continue;

      const args = text.slice(prefix.length).trim().split(/\s+/);
      const cmdName = (args.shift() || '').toLowerCase();
      if (!cmdName) continue;

      const cmd = commands.get(cmdName);
      if (!cmd) {
        // Don't spam "not found" for every typo - only if user typed . + 2 chars
        // await sock.sendMessage(from, { text: `❌ Command not found: ${prefix}${cmdName}\nType ${prefix}menu` }, { quoted: m }).catch(()=>{});
        continue;
      }

      // Owner only check
      if (cmd.ownerOnly && !isOwner) {
        await sock.sendMessage(from, { text: config.messages?.ownerOnly || '❌ OWNER ONLY' }, { quoted: m }).catch(()=>{});
        continue;
      }
      if (cmd.adminOnly && isGroup) {
        try {
          const meta = await sock.groupMetadata(from).catch(()=>null);
          const participant = meta?.participants?.find(p => p.id === sender);
          const isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin';
          if (!isAdmin && !isOwner) {
            await sock.sendMessage(from, { text: '❌ ONLY GROUP ADMINS CAN USE THIS' }, { quoted: m }).catch(()=>{});
            continue;
          }
        } catch {}
      }
      if (cmd.groupOnly && !isGroup) {
        await sock.sendMessage(from, { text: '❌ THIS COMMAND ONLY WORKS IN A GROUP' }, { quoted: m }).catch(()=>{});
        continue;
      }

      // React ⏳ BEFORE
      try {
        if (config.autoReact !== false) {
          await sock.sendMessage(from, { react: { text: config.reactBefore || '⏳', key: m.key } }).catch(()=>{});
        }
      } catch {}

      // Build context for command
      const ctx = {
        sock, m, from, isGroup, sender, senderNumber, isOwner,
        args, text, prefix, mode, sessionOwner, sessionSettings,
        fancy, commands, config,
        reply: async (txt, opts = {}) => {
          return await sock.sendMessage(from, { text: txt, ...opts }, { quoted: m }).catch(()=>{});
        },
        replyImage: async (image, caption) => {
          try {
            if (typeof image === 'string' && image.startsWith('http')) {
              return await sock.sendMessage(from, { image: { url: image }, caption: caption || '' }, { quoted: m });
            }
            return await sock.sendMessage(from, { image: image, caption: caption || '' }, { quoted: m });
          } catch (e) { return await sock.sendMessage(from, { text: caption || '' }, { quoted: m }).catch(()=>{}); }
        }
      };

      try {
        await cmd.execute(ctx);
        // React 💀 AFTER success
        try {
          if (config.autoReact !== false) {
            await sock.sendMessage(from, { react: { text: config.reactAfter || '💀', key: m.key } }).catch(()=>{});
          }
        } catch {}
        if (global.db) {
          global.db.stats = global.db.stats || {};
          global.db.stats.commands = (global.db.stats.commands || 0) + 1;
        }
      } catch (e) {
        console.log(`[CMD ERROR] ${cmdName}:`, e.message);
        try {
          await sock.sendMessage(from, { react: { text: config.reactError || '❌', key: m.key } }).catch(()=>{});
        } catch {}
        await sock.sendMessage(from, { text: `❌ COMMAND FAILED\n\n${e.message}\n\nType ${prefix}menu` }, { quoted: m }).catch(()=>{});
      }
    }
  } catch (e) {
    console.log('[HANDLER ERROR]', e.message);
  }
}

module.exports = { handleMessage, loadCommands, commands, fancy };
