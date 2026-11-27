// ============================================================
// MINI-ZYRA - WELCOME / ANTILINK ENGINE
// This file MUST be loaded in index.js - see bottom
// ============================================================
const fs = require('fs-extra');
const path = require('path');
const dbPath = path.join(__dirname, '../../database.json');
function getDB() { try { return JSON.parse(fs.readFileSync(dbPath, 'utf8')); } catch { return { groupSettings: {} }; } }

const spamMap = new Map(); // user -> [timestamps]

async function handleGroupUpdate(sock, update) {
  const db = getDB();
  const gid = update.id;
  const g = db.groupSettings?.[gid] || {};
  if (!g.welcome && !g.goodbye) return;

  try {
    const meta = await sock.groupMetadata(gid);
    const groupName = meta.subject || 'Group';
    const desc = meta.desc || '';

    for (const participant of update.participants) {
      const num = participant.replace(/[^0-9]/g, '');
      // JOIN
      if (update.action === 'add' && g.welcome) {
        let text = g.welcomeText || `👋 Welcome @${num} to ${groupName}!\n\nPlease read group rules and enjoy! 🎉\n\nMembers: ${meta.participants.length}`;
        text = text.replace(/@user/g, `@${num}`).replace(/@group/g, groupName).replace(/@desc/g, desc);
        await sock.sendMessage(gid, { text, mentions: [participant] });
        // Try send group DP as welcome image
        try {
          const pp = await sock.profilePictureUrl(participant, 'image');
          await sock.sendMessage(gid, { image: { url: pp }, caption: `Welcome @${num}! 🎉` }, { quoted: undefined });
        } catch {}
      }
      // LEAVE / REMOVE
      if ((update.action === 'remove' || update.action === 'leave') && g.goodbye) {
        let text = g.goodbyeText || `😢 Goodbye @${num}, we will miss you!\n\nMembers left: ${meta.participants.length}`;
        text = text.replace(/@user/g, `@${num}`).replace(/@group/g, groupName).replace(/@desc/g, desc);
        await sock.sendMessage(gid, { text, mentions: [participant] });
      }
    }
  } catch (e) { console.log('Welcome error:', e.message); }
}

async function handleAntiLink(sock, m, ctx) {
  if (!ctx.isGroup) return false;
  const db = getDB();
  const g = db.groupSettings?.[ctx.from] || {};
  const text = ctx.text || '';
  const lower = text.toLowerCase();

  // ANTILINK - real delete
  if (g.antilink && !ctx.isAdmin) {
    const hasLink = /(https?:\/\/|www\.|chat\.whatsapp\.com|t\.me\/|instagram\.com|facebook\.com|youtube\.com|bit\.ly|tinyurl)/i.test(text);
    if (hasLink) {
      try {
        // Delete message - needs bot admin
        await sock.sendMessage(ctx.from, { delete: { remoteJid: ctx.from, fromMe: false, id: m.key.id, participant: ctx.sender } });
        await sock.sendMessage(ctx.from, { text: `⚠️ @${ctx.senderNumber} Links are not allowed here! Message deleted.`, mentions: [ctx.sender] });
        if (g.antilinkAction === 'kick') {
          await sock.groupParticipantsUpdate(ctx.from, [ctx.sender], 'remove');
          await sock.sendMessage(ctx.from, { text: `🚫 @${ctx.senderNumber} kicked for sending link.` });
        }
        if (g.antilinkAction === 'warn') {
          await sock.sendMessage(ctx.from, { text: `⚠️ @${ctx.senderNumber} warned for link. Next time = kick.` });
        }
        return true; // stop command processing
      } catch (e) { console.log('Antilink delete failed (bot not admin?):', e.message); }
    }
  }

  // ANTISPAM - real 5 msgs in 10 sec
  if (g.antispam && !ctx.isAdmin) {
    const key = `${ctx.from}_${ctx.sender}`;
    const now = Date.now();
    const arr = (spamMap.get(key) || []).filter(t => now - t < 10000);
    arr.push(now); spamMap.set(key, arr);
    if (arr.length >= 5) {
      spamMap.delete(key);
      await sock.sendMessage(ctx.from, { text: `⚠️ @${ctx.senderNumber} Stop spamming! Slow down.`, mentions: [ctx.sender] });
      return true;
    }
  }

  // ANTIPORN - real keyword filter
  if (g.antiporn && !ctx.isAdmin) {
    const bad = ['porn', 'xxx', 'sex video', 'nude', 'onlyfans'];
    if (bad.some(w => lower.includes(w))) {
      try { await sock.sendMessage(ctx.from, { delete: { remoteJid: ctx.from, fromMe: false, id: m.key.id, participant: ctx.sender } }); } catch {}
      await sock.sendMessage(ctx.from, { text: `🚫 @${ctx.senderNumber} Inappropriate content deleted.`, mentions: [ctx.sender] });
      return true;
    }
  }
  return false;
}

module.exports = { handleGroupUpdate, handleAntiLink };
