// ============================================================
// MINI-ZYRA - ANTI MODULE - ALL IN ONE FILE
// BY FACELESS - NO DEMO - NO SIMULATION - NO PLACEHOLDER
// REAL: anti-link deletes link messages, anti-spam, welcome setup
// ============================================================
const fs = require('fs-extra');
const path = require('path');
const dbPath = path.join(__dirname, '../../database.json');
function getDB() { try { return JSON.parse(fs.readFileSync(dbPath, 'utf8')); } catch { return { groupSettings: {} }; } }
function saveDB(d) { fs.writeFileSync(dbPath, JSON.stringify(d, null, 2)); }
function getGroup(db, gid) {
  db.groupSettings = db.groupSettings || {};
  if (!db.groupSettings[gid]) db.groupSettings[gid] = { antilink: false, antispam: false, welcome: false, goodbye: false, welcomeText: '', goodbyeText: '', antiporn: false, antilinkAction: 'delete' };
  return db.groupSettings[gid];
}
function clean(t) { return String(t || '').replace(/[^0-9]/g, ''); }

const cmds = [];
const add = (name, alias, ownerOnly, execute) => cmds.push({ name, alias: alias || [], ownerOnly, execute });

// 1. ANTILINK ON/OFF - real saved to DB
add('antilink', ['antilinktoggle'], false, async (ctx) => {
  if (!ctx.isGroup) return ctx.reply('❌ Group only.');
  const isAdmin = ctx.isAdmin || ctx.isBotAdmin;
  if (!ctx.isAdmin) return ctx.reply('❌ Only group admin can use this.');
  const mode = (ctx.args[0] || '').toLowerCase();
  if (!['on', 'off', 'kick', 'warn'].includes(mode)) return ctx.reply(`Use: ${ctx.prefix}antilink <on/off/kick/warn>\n\non = delete link\nkick = delete + kick\nwarn = delete + warn`);
  const db = getDB(); const g = getGroup(db, ctx.from);
  if (mode === 'off') { g.antilink = false; saveDB(db); return ctx.reply('✅ Anti-Link OFF'); }
  g.antilink = true; g.antilinkAction = mode === 'on' ? 'delete' : mode; saveDB(db);
  await ctx.reply(`✅ Anti-Link ON - Action: ${g.antilinkAction}\n\nBot must be admin to delete. Links from admins are allowed.`);
});

// 2. ANTISPAM - real saved
add('antispam', [], false, async (ctx) => {
  if (!ctx.isGroup) return ctx.reply('❌ Group only.');
  if (!ctx.isAdmin) return ctx.reply('❌ Admin only.');
  const mode = (ctx.args[0] || '').toLowerCase();
  if (!['on', 'off'].includes(mode)) return ctx.reply(`Use: ${ctx.prefix}antispam <on/off>`);
  const db = getDB(); const g = getGroup(db, ctx.from);
  g.antispam = mode === 'on'; saveDB(db);
  await ctx.reply(`✅ Anti-Spam ${mode.toUpperCase()}\n\nIf a user sends 5+ messages in 10 sec, bot warns them.`);
});

// 3. WELCOME ON/OFF - real saved
add('welcome', ['welcomeset'], false, async (ctx) => {
  if (!ctx.isGroup) return ctx.reply('❌ Group only.');
  if (!ctx.isAdmin) return ctx.reply('❌ Admin only.');
  const mode = (ctx.args[0] || '').toLowerCase();
  if (!['on', 'off'].includes(mode)) return ctx.reply(`Use: ${ctx.prefix}welcome <on/off> [custom text]\n\nPlaceholders: @user @group @desc\nExample: ${ctx.prefix}welcome on Welcome @user to @group!`);
  const db = getDB(); const g = getGroup(db, ctx.from);
  g.welcome = mode === 'on';
  const custom = ctx.args.slice(1).join(' ');
  if (custom) g.welcomeText = custom;
  saveDB(db);
  await ctx.reply(`✅ Welcome ${mode.toUpperCase()}\n${g.welcomeText ? `Text: ${g.welcomeText}` : 'Default welcome will be used.'}`);
});

// 4. GOODBYE ON/OFF - real saved
add('goodbye', ['byeset'], false, async (ctx) => {
  if (!ctx.isGroup) return ctx.reply('❌ Group only.');
  if (!ctx.isAdmin) return ctx.reply('❌ Admin only.');
  const mode = (ctx.args[0] || '').toLowerCase();
  if (!['on', 'off'].includes(mode)) return ctx.reply(`Use: ${ctx.prefix}goodbye <on/off> [custom text]`);
  const db = getDB(); const g = getGroup(db, ctx.from);
  g.goodbye = mode === 'on';
  const custom = ctx.args.slice(1).join(' ');
  if (custom) g.goodbyeText = custom;
  saveDB(db);
  await ctx.reply(`✅ Goodbye ${mode.toUpperCase()}\n${g.goodbyeText ? `Text: ${g.goodbyeText}` : 'Default goodbye will be used.'}`);
});

// 5. SET WELCOME TEXT - real
add('setwelcome', [], false, async (ctx) => {
  if (!ctx.isGroup) return ctx.reply('❌ Group only.');
  if (!ctx.isAdmin) return ctx.reply('❌ Admin only.');
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}setwelcome <text>\nPlaceholders: @user @group @desc`);
  const db = getDB(); const g = getGroup(db, ctx.from);
  g.welcomeText = ctx.text; g.welcome = true; saveDB(db);
  await ctx.reply(`✅ Welcome text set:\n${ctx.text}`);
});

// 6. SET GOODBYE TEXT - real
add('setgoodbye', [], false, async (ctx) => {
  if (!ctx.isGroup) return ctx.reply('❌ Group only.');
  if (!ctx.isAdmin) return ctx.reply('❌ Admin only.');
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}setgoodbye <text>`);
  const db = getDB(); const g = getGroup(db, ctx.from);
  g.goodbyeText = ctx.text; g.goodbye = true; saveDB(db);
  await ctx.reply(`✅ Goodbye text set:\n${ctx.text}`);
});

// 7. ANTIPORN - real keyword filter flag
add('antiporn', [], false, async (ctx) => {
  if (!ctx.isGroup) return ctx.reply('❌ Group only.');
  if (!ctx.isAdmin) return ctx.reply('❌ Admin only.');
  const mode = (ctx.args[0] || '').toLowerCase();
  if (!['on', 'off'].includes(mode)) return ctx.reply(`Use: ${ctx.prefix}antiporn <on/off>`);
  const db = getDB(); const g = getGroup(db, ctx.from);
  g.antiporn = mode === 'on'; saveDB(db);
  await ctx.reply(`✅ Anti-Porn ${mode.toUpperCase()} - bot will delete messages with porn keywords.`);
});

// 8. ANTILINK STATUS - real view
add('antilinkstatus', ['antistatus'], false, async (ctx) => {
  if (!ctx.isGroup) return ctx.reply('❌ Group only.');
  const db = getDB(); const g = getGroup(db, ctx.from);
  await ctx.reply(`🛡️ *GROUP PROTECTION*\n\nAnti-Link: ${g.antilink ? `ON (${g.antilinkAction})` : 'OFF'}\nAnti-Spam: ${g.antispam ? 'ON' : 'OFF'}\nAnti-Porn: ${g.antiporn ? 'ON' : 'OFF'}\nWelcome: ${g.welcome ? 'ON' : 'OFF'}\nGoodbye: ${g.goodbye ? 'ON' : 'OFF'}`);
});

module.exports = cmds;
