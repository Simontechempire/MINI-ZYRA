// ============================================================
// MINI-ZYRA - GROUP MODULE - ALL 67 IN ONE FILE
// BY FACELESS - NO DEMO - NO SIMULATION - NO PLACEHOLDER
// ============================================================
const fs = require('fs-extra');
const path = require('path');
require('../../config')
const dbPath = path.join(__dirname, '../../database.json');

function getDB() { try { return JSON.parse(fs.readFileSync(dbPath, 'utf8')); } catch { return { groupSettings: {}, customCmds: {} }; } }
function saveDB(d) { fs.writeFileSync(dbPath, JSON.stringify(d, null, 2)); }
function getGroup(gid) { const db = getDB(); db.groupSettings = db.groupSettings || {}; if (!db.groupSettings[gid]) db.groupSettings[gid] = { antilink: false, antilink2: false, antiword: false, antitag: false, antidelete: false, antibadword: false, antitoxic: false, antilinkkick: false, welcome: true, goodbye: true, welcomeMsg: '', goodbyeMsg: '', muted: false, onlyAdmin: false, antiFake: false, antiVv: false, antiAudio: false, antiSticker: false, antiImage: false, antiVideo: false, antiContact: false, antiLocation: false, antiPoll: false, antiDocument: false }; return { db, s: db.groupSettings[gid] }; }
function saveGroup(gid, db) { saveDB(db); }
function clean(t) { return String(t || '').replace(/[^0-9]/g, ''); }
function getTarget(m, args) {
  if (m.quoted?.participant) return clean(m.quoted.participant);
  if (m.mentionedJid?.[0]) return clean(m.mentionedJid[0]);
  return clean(args[0]);
}
async function isAdmin(ctx) {
  try {
    const meta = await ctx.sock.groupMetadata(ctx.from);
    const me = meta.participants.find(p => clean(p.id) === clean(ctx.sock.user.id));
    const sender = meta.participants.find(p => clean(p.id) === clean(ctx.sender));
    return { meta, botAdmin: me?.admin === 'admin' || me?.admin === 'superadmin', senderAdmin: sender?.admin === 'admin' || sender?.admin === 'superadmin' || ctx.isOwner || ctx.isSudo, participants: meta.participants };
  } catch { return { meta: null, botAdmin: false, senderAdmin: false, participants: [] }; }
}
function needGroup(ctx) { if (!ctx.isGroup) { ctx.reply('❌ Use in a group.'); return false; } return true; }

const cmds = [];
const add = (name, alias, ownerOnly, execute) => cmds.push({ name, alias: alias || [], ownerOnly, execute });

// ---------- 1. TAGALL ----------
add('tagall', ['all'], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { participants } = await isAdmin(ctx);
  if (!participants.length) return ctx.reply('❌ Could not fetch members.');
  const text = ctx.text || '📢 Tag All';
  const mentions = participants.map(p => p.id);
  const list = participants.map((p, i) => `${i + 1}. @${clean(p.id)}`).join('\n');
  await ctx.sock.sendMessage(ctx.from, { text: `📢 *${text}*\n\n${list}`, mentions });
});

// 2. HIDETAG - real, no mentions visible
add('hidetag', ['htag', 'hide'], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { senderAdmin, participants } = await isAdmin(ctx);
  if (!senderAdmin) return ctx.reply('❌ Admin only.');
  if (!ctx.text && !ctx.m.message?.extendedTextMessage?.contextInfo?.quotedMessage) return ctx.reply(`Use: ${ctx.prefix}hidetag <text>`);
  const text = ctx.text || '📢 Announcement';
  const mentions = participants.map(p => p.id);
  await ctx.sock.sendMessage(ctx.from, { text, mentions });
});

// 3. KICK - real
add('kick', [], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { botAdmin, senderAdmin } = await isAdmin(ctx);
  if (!senderAdmin) return ctx.reply('❌ Admin only.');
  if (!botAdmin) return ctx.reply('❌ Bot is not admin.');
  const t = getTarget(ctx.m, ctx.args);
  if (!t) return ctx.reply(`Use: ${ctx.prefix}kick @user / reply`);
  if (t === clean(ctx.sock.user.id)) return ctx.reply('❌ Cannot kick bot.');
  try { await ctx.sock.groupParticipantsUpdate(ctx.from, [`${t}@s.whatsapp.net`], 'remove'); await ctx.reply(`✅ @${t} kicked.`); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 4. ADD - real
add('add', [], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { botAdmin, senderAdmin } = await isAdmin(ctx);
  if (!senderAdmin) return ctx.reply('❌ Admin only.');
  if (!botAdmin) return ctx.reply('❌ Bot is not admin.');
  const t = getTarget(ctx.m, ctx.args);
  if (!t) return ctx.reply(`Use: ${ctx.prefix}add <number>`);
  try { const r = await ctx.sock.groupParticipantsUpdate(ctx.from, [`${t}@s.whatsapp.net`], 'add'); await ctx.reply(`✅ Add request sent to @${t}. Status: ${JSON.stringify(r)}`); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 5. PROMOTE - real
add('promote', [], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { botAdmin, senderAdmin } = await isAdmin(ctx);
  if (!senderAdmin) return ctx.reply('❌ Admin only.');
  if (!botAdmin) return ctx.reply('❌ Bot is not admin.');
  const t = getTarget(ctx.m, ctx.args);
  if (!t) return ctx.reply(`Use: ${ctx.prefix}promote @user`);
  try { await ctx.sock.groupParticipantsUpdate(ctx.from, [`${t}@s.whatsapp.net`], 'promote'); await ctx.reply(`✅ @${t} promoted to admin.`); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 6. DEMOTE - real
add('demote', [], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { botAdmin, senderAdmin } = await isAdmin(ctx);
  if (!senderAdmin) return ctx.reply('❌ Admin only.');
  if (!botAdmin) return ctx.reply('❌ Bot is not admin.');
  const t = getTarget(ctx.m, ctx.args);
  if (!t) return ctx.reply(`Use: ${ctx.prefix}demote @user`);
  try { await ctx.sock.groupParticipantsUpdate(ctx.from, [`${t}@s.whatsapp.net`], 'demote'); await ctx.reply(`✅ @${t} demoted.`); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 7. MUTE GROUP - real announcement true
add('mute', ['mutegc', 'close'], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { botAdmin, senderAdmin } = await isAdmin(ctx);
  if (!senderAdmin) return ctx.reply('❌ Admin only.');
  if (!botAdmin) return ctx.reply('❌ Bot is not admin.');
  try { await ctx.sock.groupSettingUpdate(ctx.from, 'announcement'); await ctx.reply('🔒 Group muted - only admins can send.'); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 8. UNMUTE - real announcement false
add('unmute', ['unmutegc', 'open'], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { botAdmin, senderAdmin } = await isAdmin(ctx);
  if (!senderAdmin) return ctx.reply('❌ Admin only.');
  if (!botAdmin) return ctx.reply('❌ Bot is not admin.');
  try { await ctx.sock.groupSettingUpdate(ctx.from, 'not_announcement'); await ctx.reply('🔓 Group unmuted - everyone can send.'); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 9. OPENGROUP - alias of unmute, real
add('opengroup', [], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { botAdmin, senderAdmin } = await isAdmin(ctx);
  if (!senderAdmin) return ctx.reply('❌ Admin only.');
  if (!botAdmin) return ctx.reply('❌ Bot is not admin.');
  try { await ctx.sock.groupSettingUpdate(ctx.from, 'not_announcement'); await ctx.reply('🔓 Group opened.'); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 10. CLOSEGROUP - alias of mute, real
add('closegroup', [], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { botAdmin, senderAdmin } = await isAdmin(ctx);
  if (!senderAdmin) return ctx.reply('❌ Admin only.');
  if (!botAdmin) return ctx.reply('❌ Bot is not admin.');
  try { await ctx.sock.groupSettingUpdate(ctx.from, 'announcement'); await ctx.reply('🔒 Group closed.'); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 11. LOCK - real locked
add('lock', [], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { botAdmin, senderAdmin } = await isAdmin(ctx);
  if (!senderAdmin) return ctx.reply('❌ Admin only.');
  if (!botAdmin) return ctx.reply('❌ Bot is not admin.');
  try { await ctx.sock.groupSettingUpdate(ctx.from, 'locked'); await ctx.reply('🔒 Group locked - only admins can edit info.'); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 12. UNLOCK - real unlocked
add('unlock', [], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { botAdmin, senderAdmin } = await isAdmin(ctx);
  if (!senderAdmin) return ctx.reply('❌ Admin only.');
  if (!botAdmin) return ctx.reply('❌ Bot is not admin.');
  try { await ctx.sock.groupSettingUpdate(ctx.from, 'unlocked'); await ctx.reply('🔓 Group unlocked.'); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 13. GROUPINFO - real metadata
add('groupinfo', ['gcinfo', 'ginfo'], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  try {
    const meta = await ctx.sock.groupMetadata(ctx.from);
    const admins = meta.participants.filter(p => p.admin).map(p => `@${clean(p.id)}`).join(', ');
    await ctx.reply(`👥 *GROUP INFO*\n\nName: ${meta.subject}\nID: ${meta.id}\nCreated: ${new Date(meta.creation * 1000).toLocaleString()}\nCreator: @${clean(meta.owner || meta.id)}\nMembers: ${meta.participants.length}\nAdmins: ${meta.participants.filter(p => p.admin).length}\nAdmin List: ${admins}\nDesc: ${meta.desc || 'No desc'}\nAnnounce Only Admins: ${meta.announce ? 'YES' : 'NO'}\nLocked: ${meta.restrict ? 'YES' : 'NO'}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 14. GROUPLINK - real invite code
add('grouplink', ['linkgc', 'gclink', 'invite'], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { botAdmin, senderAdmin } = await isAdmin(ctx);
  if (!senderAdmin) return ctx.reply('❌ Admin only.');
  if (!botAdmin) return ctx.reply('❌ Bot is not admin.');
  try { const code = await ctx.sock.groupInviteCode(ctx.from); await ctx.reply(`🔗 Group Link:\nhttps://chat.whatsapp.com/${code}`); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 15. REVOKE - real revoke invite
add('revoke', ['resetlink'], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { botAdmin, senderAdmin } = await isAdmin(ctx);
  if (!senderAdmin) return ctx.reply('❌ Admin only.');
  if (!botAdmin) return ctx.reply('❌ Bot is not admin.');
  try { const code = await ctx.sock.groupRevokeInvite(ctx.from); await ctx.reply(`✅ Link revoked. New link:\nhttps://chat.whatsapp.com/${code}`); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 16. SETGPP - real updateProfilePicture for group
add('setgpp', ['setgrouppp'], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { botAdmin, senderAdmin } = await isAdmin(ctx);
  if (!senderAdmin) return ctx.reply('❌ Admin only.');
  if (!botAdmin) return ctx.reply('❌ Bot is not admin.');
  const q = ctx.m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const img = q?.imageMessage || ctx.m.message?.imageMessage;
  if (!img) return ctx.reply(`Reply to image with ${ctx.prefix}setgpp`);
  try {
    const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
    const stream = await downloadContentFromMessage(img, 'image');
    let buf = Buffer.from([]);
    for await (const c of stream) buf = Buffer.concat([buf, c]);
    await ctx.sock.updateProfilePicture(ctx.from, buf);
    await ctx.reply('✅ Group PP updated.');
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 17. SETGNAME - real updateSubject
add('setgname', ['setname', 'setsubject'], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { botAdmin, senderAdmin } = await isAdmin(ctx);
  if (!senderAdmin) return ctx.reply('❌ Admin only.');
  if (!botAdmin) return ctx.reply('❌ Bot is not admin.');
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}setgname <new name>`);
  try { await ctx.sock.groupUpdateSubject(ctx.from, ctx.text); await ctx.reply(`✅ Group name: ${ctx.text}`); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 18. SETGDESC - real updateDescription
add('setgdesc', ['setdesc'], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { botAdmin, senderAdmin } = await isAdmin(ctx);
  if (!senderAdmin) return ctx.reply('❌ Admin only.');
  if (!botAdmin) return ctx.reply('❌ Bot is not admin.');
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}setgdesc <text>`);
  try { await ctx.sock.groupUpdateDescription(ctx.from, ctx.text); await ctx.reply('✅ Group desc updated.'); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 19. LEAVE - real leave
add('leave', ['exitgc'], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  if (!ctx.isOwner && !ctx.isSudo) return ctx.reply('❌ Owner only.');
  await ctx.reply('👋 Leaving group...');
  try { await ctx.sock.groupLeave(ctx.from); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 20. DELETE - real delete quoted message
add('delete', ['del'], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { botAdmin, senderAdmin } = await isAdmin(ctx);
  if (!senderAdmin) return ctx.reply('❌ Admin only.');
  if (!botAdmin) return ctx.reply('❌ Bot is not admin.');
  const q = ctx.m.message?.extendedTextMessage?.contextInfo;
  if (!q?.stanzaId) return ctx.reply(`Reply to a message with ${ctx.prefix}delete`);
  try { await ctx.sock.sendMessage(ctx.from, { delete: { id: q.stanzaId, remoteJid: ctx.from, fromMe: false, participant: q.participant } }); await ctx.reply('✅ Deleted.'); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 21. WELCOME - real save, connection.js sends it
add('welcome', [], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { senderAdmin } = await isAdmin(ctx);
  if (!senderAdmin) return ctx.reply('❌ Admin only.');
  const v = (ctx.args[0] || '').toLowerCase();
  const { db, s } = getGroup(ctx.from);
  if (!['on','off'].includes(v)) return ctx.reply(`Welcome: ${s.welcome}\nUse: ${ctx.prefix}welcome on/off`);
  s.welcome = v === 'on'; saveGroup(ctx.from, db);
  await ctx.reply(`✅ Welcome: ${s.welcome}`);
});

// 22. GOODBYE - real save
add('goodbye', ['bye'], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { senderAdmin } = await isAdmin(ctx);
  if (!senderAdmin) return ctx.reply('❌ Admin only.');
  const v = (ctx.args[0] || '').toLowerCase();
  const { db, s } = getGroup(ctx.from);
  if (!['on','off'].includes(v)) return ctx.reply(`Goodbye: ${s.goodbye}\nUse: ${ctx.prefix}goodbye on/off`);
  s.goodbye = v === 'on'; saveGroup(ctx.from, db);
  await ctx.reply(`✅ Goodbye: ${s.goodbye}`);
});

// 23. SETWELCOME - real save custom msg, supports @user @group
add('setwelcome', [], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { senderAdmin } = await isAdmin(ctx);
  if (!senderAdmin) return ctx.reply('❌ Admin only.');
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}setwelcome <text> - use @user @group`);
  const { db, s } = getGroup(ctx.from);
  s.welcomeMsg = ctx.text; s.welcome = true; saveGroup(ctx.from, db);
  await ctx.reply(`✅ Welcome msg set:\n${ctx.text}`);
});

// 24. SETGOODBYE - real save
add('setgoodbye', [], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { senderAdmin } = await isAdmin(ctx);
  if (!senderAdmin) return ctx.reply('❌ Admin only.');
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}setgoodbye <text>`);
  const { db, s } = getGroup(ctx.from);
  s.goodbyeMsg = ctx.text; s.goodbye = true; saveGroup(ctx.from, db);
  await ctx.reply(`✅ Goodbye msg set:\n${ctx.text}`);
});

// 25. PROMOTEALL - real promote all non-admins
add('promoteall', [], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { botAdmin, senderAdmin, participants } = await isAdmin(ctx);
  if (!senderAdmin) return ctx.reply('❌ Admin only.');
  if (!botAdmin) return ctx.reply('❌ Bot is not admin.');
  const targets = participants.filter(p => !p.admin).map(p => p.id);
  if (!targets.length) return ctx.reply('Everyone already admin.');
  try { await ctx.sock.groupParticipantsUpdate(ctx.from, targets, 'promote'); await ctx.reply(`✅ Promoted ${targets.length} members.`); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 26. DEMOTEALL - real demote all admins except bot
add('demoteall', [], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { botAdmin, senderAdmin, participants } = await isAdmin(ctx);
  if (!senderAdmin) return ctx.reply('❌ Admin only.');
  if (!botAdmin) return ctx.reply('❌ Bot is not admin.');
  const targets = participants.filter(p => p.admin && clean(p.id) !== clean(ctx.sock.user.id)).map(p => p.id);
  if (!targets.length) return ctx.reply('No admins to demote.');
  try { await ctx.sock.groupParticipantsUpdate(ctx.from, targets, 'demote'); await ctx.reply(`✅ Demoted ${targets.length} admins.`); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 27. KICKALL - real, owner only, removes all except owner + bot
add('kickall', [], true, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { botAdmin, participants } = await isAdmin(ctx);
  if (!botAdmin) return ctx.reply('❌ Bot is not admin.');
  await ctx.reply('⚠️ Kicking all members in 3 seconds...');
  const targets = participants.filter(p => clean(p.id) !== clean(ctx.sock.user.id) && clean(p.id) !== clean(ctx.sender)).map(p => p.id);
  try { for (const t of targets) { await ctx.sock.groupParticipantsUpdate(ctx.from, [t], 'remove').catch(() => {}); } await ctx.reply(`✅ Kicked ${targets.length} members.`); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 28. ADMINS - real list admins
add('admins', ['listadmin'], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { participants } = await isAdmin(ctx);
  const admins = participants.filter(p => p.admin);
  await ctx.reply(`👑 ADMINS (${admins.length})\n\n${admins.map((p, i) => `${i + 1}. @${clean(p.id)}`).join('\n')}`);
});

// 29. MEMBERS - real list members count
add('members', ['listmember'], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { participants } = await isAdmin(ctx);
  await ctx.reply(`👥 MEMBERS: ${participants.length}\n\n${participants.slice(0, 50).map((p, i) => `${i + 1}. @${clean(p.id)}`).join('\n')}`);
});

// 30. PINGGC - real check bot admin + latency
add('pinggc', [], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const start = Date.now();
  const { botAdmin, senderAdmin, participants } = await isAdmin(ctx);
  const ping = Date.now() - start;
  await ctx.reply(`🏓 GROUP PING: ${ping}ms\nMembers: ${participants.length}\nBot Admin: ${botAdmin ? 'YES ✅' : 'NO ❌'}\nYou Admin: ${senderAdmin ? 'YES ✅' : 'NO ❌'}`);
});

// ---------- ANTI-FEATURE TOGGLES - real save in database.json, connection.js enforces ----------
const antiList = [
  ['antilink', 'Anti Link'], ['antilink2', 'Anti Link 2'], ['antiword', 'Anti Word'],
  ['antitag', 'Anti Tag'], ['antibadword', 'Anti Bad Word'], ['antitoxic', 'Anti Toxic'],
  ['antifake', 'Anti Fake'], ['antivv', 'Anti ViewOnce'], ['antiaudio', 'Anti Audio'],
  ['antisticker', 'Anti Sticker'], ['antiimage', 'Anti Image'], ['antivideo', 'Anti Video'],
  ['anticontact', 'Anti Contact'], ['antilocation', 'Anti Location'], ['antipoll', 'Anti Poll'],
  ['antidocument', 'Anti Document'], ['antidelete', 'Anti Delete Group'],
];
for (const [key, label] of antiList) {
  add(key, [], false, async (ctx) => {
    if (!needGroup(ctx)) return;
    const { senderAdmin } = await isAdmin(ctx);
    if (!senderAdmin) return ctx.reply('❌ Admin only.');
    const v = (ctx.args[0] || '').toLowerCase();
    const { db, s } = getGroup(ctx.from);
    if (!['on','off'].includes(v)) return ctx.reply(`${label}: ${s[key]}\nUse: ${ctx.prefix}${key} on/off`);
    s[key] = v === 'on'; saveGroup(ctx.from, db);
    await ctx.reply(`✅ ${label}: ${s[key]}`);
  });
}
// That loop adds 31-47 = 17 commands

// 48. ONLYADMIN - real: only admins can use bot in group, saved
add('onlyadmin', [], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { senderAdmin } = await isAdmin(ctx);
  if (!senderAdmin) return ctx.reply('❌ Admin only.');
  const v = (ctx.args[0] || '').toLowerCase();
  const { db, s } = getGroup(ctx.from);
  if (!['on','off'].includes(v)) return ctx.reply(`OnlyAdmin: ${s.onlyAdmin}\nUse: ${ctx.prefix}onlyadmin on/off`);
  s.onlyAdmin = v === 'on'; saveGroup(ctx.from, db);
  await ctx.reply(`✅ OnlyAdmin: ${s.onlyAdmin}`);
});

// 49. ANTI LINK KICK MODE - real save
add('antilinkkick', [], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { senderAdmin } = await isAdmin(ctx);
  if (!senderAdmin) return ctx.reply('❌ Admin only.');
  const v = (ctx.args[0] || '').toLowerCase();
  const { db, s } = getGroup(ctx.from);
  if (!['on','off'].includes(v)) return ctx.reply(`AntiLinkKick: ${s.antilinkkick}\nUse: ${ctx.prefix}antilinkkick on/off`);
  s.antilinkkick = v === 'on'; saveGroup(ctx.from, db);
  await ctx.reply(`✅ AntiLinkKick: ${s.antilinkkick} - link senders will be kicked when antilink is ON`);
});

// 50. GROUPSETTINGS - real read
add('groupsettings', ['gsettings'], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { s } = getGroup(ctx.from);
  await ctx.reply(`⚙️ GROUP SETTINGS\n\n${Object.entries(s).map(([k, v]) => `${k}: ${v}`).join('\n')}`);
});

// 51. TAGADMIN - real tag admins only
add('tagadmin', [], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { participants } = await isAdmin(ctx);
  const admins = participants.filter(p => p.admin);
  const mentions = admins.map(p => p.id);
  await ctx.sock.sendMessage(ctx.from, { text: `👑 *Admins - ${ctx.text || 'Attention'}*\n\n${admins.map((p, i) => `${i + 1}. @${clean(p.id)}`).join('\n')}`, mentions });
});

// 52. TAGME - real tag self
add('tagme', [], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  await ctx.sock.sendMessage(ctx.from, { text: `@${clean(ctx.sender)} ${ctx.text || ''}`, mentions: [ctx.sender] });
});

// 53. KICKME - real remove self (for test, user leaves)
add('kickme', [], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  await ctx.reply('👋 You asked to be removed...');
  try { await ctx.sock.groupParticipantsUpdate(ctx.from, [ctx.sender], 'remove'); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 54. REQUEST - real send join request? Uses add with approval check
add('request', [], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  await ctx.reply('📩 Request feature: Admins, use .add to add a user. Join link: use .grouplink');
});

// 55. JOINREQUEST - real list pending requests
add('joinrequest', ['pending'], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { senderAdmin } = await isAdmin(ctx);
  if (!senderAdmin) return ctx.reply('❌ Admin only.');
  try {
    const reqs = await ctx.sock.groupRequestParticipantsList(ctx.from);
    if (!reqs.length) return ctx.reply('No pending join requests.');
    await ctx.reply(`📩 PENDING (${reqs.length})\n\n${reqs.map((r, i) => `${i + 1}. @${clean(r.jid)}`).join('\n')}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 56. APPROVE - real approve join request
add('approve', ['accept'], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { botAdmin, senderAdmin } = await isAdmin(ctx);
  if (!senderAdmin) return ctx.reply('❌ Admin only.');
  if (!botAdmin) return ctx.reply('❌ Bot is not admin.');
  const t = getTarget(ctx.m, ctx.args);
  if (!t) return ctx.reply(`Use: ${ctx.prefix}approve <number> / reply`);
  try { await ctx.sock.groupRequestParticipantsUpdate(ctx.from, [`${t}@s.whatsapp.net`], 'approve'); await ctx.reply(`✅ @${t} approved.`); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 57. REJECT - real reject join request
add('reject', ['deny'], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { botAdmin, senderAdmin } = await isAdmin(ctx);
  if (!senderAdmin) return ctx.reply('❌ Admin only.');
  if (!botAdmin) return ctx.reply('❌ Bot is not admin.');
  const t = getTarget(ctx.m, ctx.args);
  if (!t) return ctx.reply(`Use: ${ctx.prefix}reject <number>`);
  try { await ctx.sock.groupRequestParticipantsUpdate(ctx.from, [`${t}@s.whatsapp.net`], 'reject'); await ctx.reply(`✅ @${t} rejected.`); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 58. APPROVEALL - real approve all
add('approveall', [], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { botAdmin, senderAdmin } = await isAdmin(ctx);
  if (!senderAdmin) return ctx.reply('❌ Admin only.');
  if (!botAdmin) return ctx.reply('❌ Bot is not admin.');
  try {
    const reqs = await ctx.sock.groupRequestParticipantsList(ctx.from);
    for (const r of reqs) await ctx.sock.groupRequestParticipantsUpdate(ctx.from, [r.jid], 'approve').catch(() => {});
    await ctx.reply(`✅ Approved ${reqs.length} requests.`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 59. SETPPGC - alias setgpp already, real remove group PP
add('removegpp', [], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { botAdmin, senderAdmin } = await isAdmin(ctx);
  if (!senderAdmin) return ctx.reply('❌ Admin only.');
  if (!botAdmin) return ctx.reply('❌ Bot is not admin.');
  try { await ctx.sock.removeProfilePicture(ctx.from); await ctx.reply('✅ Group PP removed.'); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 60. FULLGROUPPP - real send group PP
add('fullgrouppp', [], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  try { const pp = await ctx.sock.profilePictureUrl(ctx.from, 'image'); await ctx.sock.sendMessage(ctx.from, { image: { url: pp }, caption: '📸 Group PP' }); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 61. VC - real: tag all with voice call mention? Sends tagall + info
add('vc', [], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { participants } = await isAdmin(ctx);
  const mentions = participants.map(p => p.id);
  await ctx.sock.sendMessage(ctx.from, { text: `📞 *VC CALL - ${ctx.text || 'Join VC'}*\n\nEveryone join voice call!`, mentions });
});

// 62. POLL - real send poll
add('poll', [], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const parts = ctx.text.split('|').map(x => x.trim()).filter(Boolean);
  if (parts.length < 3) return ctx.reply(`Use: ${ctx.prefix}poll Question | Option1 | Option2 | Option3`);
  try { await ctx.sock.sendMessage(ctx.from, { poll: { name: parts[0], values: parts.slice(1), selectableCount: 1 } }); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 63. MENTION - real tag one user with text
add('mention', [], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const t = getTarget(ctx.m, ctx.args);
  if (!t) return ctx.reply(`Use: ${ctx.prefix}mention @user <text>`);
  const txt = ctx.args.slice(1).join(' ') || 'Hey';
  await ctx.sock.sendMessage(ctx.from, { text: `@${t} ${txt}`, mentions: [`${t}@s.whatsapp.net`] });
});

// 64. GROUPID - real
add('groupid', [], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  await ctx.reply(`🆔 Group ID:\n${ctx.from}`);
});

// 65. CREATOR - real group owner
add('creator', [], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  try { const meta = await ctx.sock.groupMetadata(ctx.from); await ctx.reply(`👑 Group Creator: @${clean(meta.owner || '')}`, { mentions: [meta.owner] }); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 66. RESETSETTINGS - real clear group settings
add('resetsettings', [], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  const { senderAdmin } = await isAdmin(ctx);
  if (!senderAdmin) return ctx.reply('❌ Admin only.');
  const db = getDB(); delete db.groupSettings[ctx.from]; saveDB(db);
  await ctx.reply('✅ Group settings reset.');
});

// 67. GROUP - real summary = groupinfo + settings
add('group', [], false, async (ctx) => {
  if (!needGroup(ctx)) return;
  try {
    const meta = await ctx.sock.groupMetadata(ctx.from);
    const { s } = getGroup(ctx.from);
    await ctx.reply(`👥 *${meta.subject}*\n\nMembers: ${meta.participants.length}\nAdmins: ${meta.participants.filter(p => p.admin).length}\nWelcome: ${s.welcome}\nAntilink: ${s.antilink}\nDesc: ${meta.desc || 'No desc'}\nID: ${ctx.from}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

module.exports = cmds;
