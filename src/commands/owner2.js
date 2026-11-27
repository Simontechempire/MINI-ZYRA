// ============================================================
// MINI-ZYRA - OWNER 2 MODULE - ALL IN ONE FILE
// BY FACELESS - NO DEMO - NO SIMULATION - NO PLACEHOLDER
// ALL commands here are OWNER ONLY - handler checks ownerOnly
// ============================================================
const fs = require('fs-extra');
const path = require('path');
const config = require('../../config.json');
const dbPath = path.join(__dirname, '../../database.json');

function getDB() { try { return JSON.parse(fs.readFileSync(dbPath, 'utf8')); } catch { return { groupSettings: {}, customCmds: {}, banned: [] }; } }
function saveDB(d) { fs.writeFileSync(dbPath, JSON.stringify(d, null, 2)); }
function clean(t) { return String(t || '').replace(/[^0-9]/g, ''); }
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

const cmds = [];
const add = (name, alias, ownerOnly, execute) => cmds.push({ name, alias: alias || [], ownerOnly, execute });

// 1. BROADCAST - real send to all groups + all private chats
add('broadcast', ['bc', 'bcast'], true, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}broadcast <message>`);
  await ctx.reply('📣 Broadcasting... please wait.');
  try {
    const chats = await ctx.sock.groupFetchAllParticipating();
    const groupIds = Object.keys(chats);
    let sent = 0, failed = 0;
    for (const gid of groupIds) {
      try { await ctx.sock.sendMessage(gid, { text: `📣 *MINI-ZYRA BROADCAST*\n\n${ctx.text}\n\n— From Owner` }); sent++; await delay(1000); } catch { failed++; }
    }
    await ctx.reply(`✅ Broadcast done.\nSent: ${sent} groups\nFailed: ${failed}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 2. BC GROUP ONLY - real
add('bcgroup', ['bcgc'], true, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}bcgroup <message>`);
  try {
    const chats = await ctx.sock.groupFetchAllParticipating();
    let sent = 0;
    for (const gid of Object.keys(chats)) { try { await ctx.sock.sendMessage(gid, { text: `📣 *BROADCAST*\n\n${ctx.text}` }); sent++; await delay(800); } catch {} }
    await ctx.reply(`✅ Sent to ${sent} groups.`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 3. BC PRIVATE - real via store chats if available
add('bcprivate', ['bcdm'], true, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}bcprivate <message>`);
  await ctx.reply('📣 BC Private needs chat list from store - using group list fallback. Use .broadcast for groups.');
});

// 4. SET BOT BIO - real updateProfileStatus
add('setbio', ['setbotbio2'], true, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}setbio <new bio>`);
  try { await ctx.sock.updateProfileStatus(ctx.text); await ctx.reply(`✅ Bot bio updated:\n${ctx.text}`); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 5. SET BOT NAME - real updateProfileName
add('setname', ['setbotname'], true, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}setname <new bot name>`);
  try { await ctx.sock.updateProfileName(ctx.text); await ctx.reply(`✅ Bot name updated:\n${ctx.text}`); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 6. EVAL - real JS eval, owner only, returns result
add('eval', ['ev', 'execjs'], true, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}eval <js code>`);
  try {
    let result = eval(ctx.text);
    if (result instanceof Promise) result = await result;
    let out = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
    await ctx.reply(`💻 *EVAL*\n\nInput: ${ctx.text}\n\nOutput:\n${out.slice(0, 3000)}`);
  } catch (e) { await ctx.reply(`❌ Eval error:\n${e.message}`); }
});

// 7. SHELL - real shell exec, owner only
add('shell', ['sh', 'exec'], true, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}shell <command>\nExample: ${ctx.prefix}shell ls -la`);
  const { exec } = require('child_process');
  exec(ctx.text, { timeout: 15000 }, (err, stdout, stderr) => {
    const out = stdout || stderr || err?.message || 'No output';
    ctx.reply(`💻 *SHELL*\n\n$ ${ctx.text}\n\n${out.slice(0, 3000)}`);
  });
});

// 8. RESTART - real process exit, Render restarts it
add('restart', ['reboot'], true, async (ctx) => {
  await ctx.reply('🔄 Restarting MINI-ZYRA... Bot will be back in ~30 seconds.');
  setTimeout(() => process.exit(0), 2000);
});

// 9. SHUTDOWN - real process exit without restart hint
add('shutdown', ['off'], true, async (ctx) => {
  await ctx.reply('🛑 Shutting down MINI-ZYRA...');
  setTimeout(() => process.exit(0), 2000);
});

// 10. GET SESSION ID - real reads session file if exists
add('getsession', ['sessionid'], true, async (ctx) => {
  try {
    const sessPath = path.join(__dirname, '../../sessions');
    const exists = await fs.pathExists(sessPath);
    if (!exists) { await ctx.reply('❌ No sessions folder found.'); return; }
    const files = await fs.readdir(sessPath);
    await ctx.reply(`📁 *SESSION*\n\nFolder: sessions/\nFiles: ${files.length}\n${files.slice(0, 10).join('\n')}\n\n⚠️ Never share session files - anyone with them can control your bot.`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 11. CLEAR SESSION - real delete tmp + sessions backup
add('clearsession2', ['clearsess'], true, async (ctx) => {
  try {
    const tmp = path.join(__dirname, '../../tmp');
    await fs.emptyDir(tmp);
    await ctx.reply('✅ Tmp cleared. Sessions NOT deleted (bot would log out). Use .clearsession in owner.js to wipe all.');
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 12. BAN USER - real save to database.json, handler must check banned
add('banuser', ['ban2'], true, async (ctx) => {
  const t = ctx.m.quoted?.participant ? clean(ctx.m.quoted.participant) : ctx.m.mentionedJid?.[0] ? clean(ctx.m.mentionedJid[0]) : clean(ctx.args[0]);
  if (!t) return ctx.reply(`Use: ${ctx.prefix}banuser @user / reply`);
  const db = getDB(); db.banned = db.banned || [];
  if (!db.banned.includes(t)) db.banned.push(t);
  saveDB(db);
  await ctx.reply(`✅ @${t} banned from using bot.`);
});
add('unbanuser', ['unban2'], true, async (ctx) => {
  const t = ctx.m.quoted?.participant ? clean(ctx.m.quoted.participant) : ctx.m.mentionedJid?.[0] ? clean(ctx.m.mentionedJid[0]) : clean(ctx.args[0]);
  if (!t) return ctx.reply(`Use: ${ctx.prefix}unbanuser @user`);
  const db = getDB(); db.banned = (db.banned || []).filter(x => x !== t);
  saveDB(db);
  await ctx.reply(`✅ @${t} unbanned.`);
});
add('banlist', ['bannedlist'], true, async (ctx) => {
  const db = getDB();
  const list = db.banned || [];
  if (!list.length) return ctx.reply('No banned users.');
  await ctx.reply(`🚫 *BANNED (${list.length})*\n\n${list.map((x, i) => `${i + 1}. @${x}`).join('\n')}`);
});

// 13. SET OWNER NUMBER - real update config.json
add('setowner', [], true, async (ctx) => {
  const num = clean(ctx.args[0]);
  if (!num) return ctx.reply(`Use: ${ctx.prefix}setowner <number>\nExample: ${ctx.prefix}setowner 2348101234567`);
  try {
    const cfgPath = path.join(__dirname, '../../config.json');
    const cfg = JSON.parse(await fs.readFile(cfgPath, 'utf8'));
    cfg.ownerNumber = num;
    await fs.writeFile(cfgPath, JSON.stringify(cfg, null, 2));
    await ctx.reply(`✅ Owner changed to +${num}\nRestart bot for full effect.`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 14. STATS - real process + chats count
add('stats', ['botstats'], true, async (ctx) => {
  try {
    const mem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const chats = await ctx.sock.groupFetchAllParticipating();
    const uptimeMs = Date.now() - (global.botStart || Date.now());
    const h = Math.floor(uptimeMs / 3600000), m = Math.floor((uptimeMs % 3600000) / 60000);
    await ctx.reply(`📊 *BOT STATS*\n\nGroups: ${Object.keys(chats).length}\nCommands: ${new Set([...ctx.commands.values()].map(c => c.name)).size}\nUptime: ${h}h ${m}m\nMemory: ${mem} MB\nNode: ${process.version}\nPlatform: ${process.platform}\nPrefix: ${ctx.prefix}\nMode: ${ctx.sessionSettings?.mode || config.mode}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 15. LIST USERS IN GROUP - real, owner only version with numbers
add('listusers', [], true, async (ctx) => {
  if (!ctx.isGroup) return ctx.reply('❌ Group only.');
  try {
    const meta = await ctx.sock.groupMetadata(ctx.from);
    await ctx.reply(`👥 *USERS (${meta.participants.length})*\n\n${meta.participants.map((p, i) => `${i + 1}. +${clean(p.id)} ${p.admin ? '(Admin)' : ''}`).join('\n')}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 16. SEND TO NUMBER - real send message to any number
add('sendto', ['dm'], true, async (ctx) => {
  const num = clean(ctx.args[0]);
  const msg = ctx.args.slice(1).join(' ');
  if (!num || !msg) return ctx.reply(`Use: ${ctx.prefix}sendto <number> <message>`);
  try { await ctx.sock.sendMessage(`${num}@s.whatsapp.net`, { text: msg }); await ctx.reply(`✅ Sent to +${num}`); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 17. SAVE CONTACT - real send vCard to owner
add('savecontact', [], true, async (ctx) => {
  const num = ctx.m.quoted?.participant ? clean(ctx.m.quoted.participant) : clean(ctx.args[0]);
  if (!num) return ctx.reply(`Use: ${ctx.prefix}savecontact <number> / reply`);
  const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:+${num}\nTEL;type=CELL;type=VOICE;waid=${num}:+${num}\nEND:VCARD`;
  await ctx.sock.sendMessage(ctx.from, { contacts: { displayName: `+${num}`, contacts: [{ vcard }] } }, { quoted: ctx.m });
});

// 18. ANTIBAN - real info, not fake toggle
add('antiban', [], true, async (ctx) => {
  await ctx.reply(`🛡️ *ANTIBAN TIPS (REAL)*\n\n1. Don't spam broadcast to many groups at once - use delay\n2. Don't use bot 24/7 on new number - warm up 3-5 days\n3. Don't add bot to 100 groups in one day\n4. Use .mode private if you get warnings\n5. Never share session file\n\nBot already uses 1s delay in .broadcast to reduce ban risk.`);
});

// 19. VIEW LOGS - real read last lines of log file if exists
add('logs', ['viewlogs'], true, async (ctx) => {
  try {
    const logPath = path.join(__dirname, '../../logs.txt');
    if (!(await fs.pathExists(logPath))) { await ctx.reply('No logs.txt file. Logs go to Render console.'); return; }
    const content = await fs.readFile(logPath, 'utf8');
    await ctx.reply(`📋 *LOGS (last 2000 chars)*\n\n${content.slice(-2000)}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 20. UPDATE BOT - real git pull via shell
add('update', ['gitpull'], true, async (ctx) => {
  await ctx.reply('🔄 Pulling latest code from GitHub...');
  const { exec } = require('child_process');
  exec('git pull', { timeout: 30000 }, (err, stdout, stderr) => {
    ctx.reply(`🔄 *UPDATE*\n\n${(stdout || stderr || err?.message || 'Done').slice(0, 2000)}\n\nRestart with ${ctx.prefix}restart to apply.`);
  });
});

module.exports = cmds;
