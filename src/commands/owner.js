// ============================================================
// MINI-ZYRA - OWNER MODULE - ALL 61 IN ONE FILE
// BY FACELESS - NO DEMO - NO SIMULATION - NO PLACEHOLDER
// ============================================================
const fs = require('fs-extra');
const path = require('path');
const config = require('../../config.json');

const getPath = (num) => path.join(__dirname, '../../sessions', String(num), 'settings.json');
const dbPath = path.join(__dirname, '../../database.json');

function getSettings(num) {
  try { if (fs.existsSync(getPath(num))) return JSON.parse(fs.readFileSync(getPath(num), 'utf8')); } catch {}
  return { prefix: config.prefix || '.', mode: config.mode || 'public', sudo: [], banned: [], password: '', menutag: 'MINI-ZYRA', usagetip: true, autobio: false, autostatus: false, autotyping: false, autorecording: false, autoreact: false, anticall: false, antidelete: false, antiviewonce: false, antideletestatus: false, chatbot: false, swgcmusic: false, allowedCmds: [] };
}
function saveSettings(num, s) { fs.ensureDirSync(path.dirname(getPath(num))); fs.writeFileSync(getPath(num), JSON.stringify(s, null, 2)); }
function getDB() { try { return JSON.parse(fs.readFileSync(dbPath, 'utf8')); } catch { return { customCmds: {} }; } }
function saveDB(d) { fs.writeFileSync(dbPath, JSON.stringify(d, null, 2)); }
function clean(t) { return String(t || '').replace(/[^0-9]/g, ''); }
function target(m, args) {
  if (m.quoted?.participant) return clean(m.quoted.participant);
  if (m.mentionedJid?.[0]) return clean(m.mentionedJid[0]);
  return clean(args[0]);
}
function mustOwner(ctx) { if (!ctx.isOwner && !ctx.isSudo) { ctx.reply('❌ Owner only.'); return false; } return true; }

const cmds = [];
const add = (name, alias, execute) => cmds.push({ name, alias: alias || [], ownerOnly: true, execute });

// 1. MODE - real, saves + live
add('mode', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const s = getSettings(ctx.sessionOwner);
  const v = (ctx.args[0] || '').toLowerCase();
  if (!['public','private'].includes(v)) return ctx.reply(`Mode: ${s.mode}\nUse: ${ctx.prefix}mode public / private`);
  s.mode = v; saveSettings(ctx.sessionOwner, s); ctx.sessionSettings.mode = v;
  await ctx.reply(`✅ Mode set to ${v}`);
});

// 2. SETTINGS - real read from file
add('settings', ['setting'], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const s = getSettings(ctx.sessionOwner);
  await ctx.reply(`⚙️ SETTINGS\n\nPrefix: ${s.prefix}\nMode: ${s.mode}\nPassword: ${s.password ? 'SET' : 'NOT SET'}\nMenuTag: ${s.menutag}\nUsageTip: ${s.usagetip}\nSudo: ${s.sudo.length} - ${s.sudo.join(', ') || 'none'}\nBanned: ${s.banned.length} - ${s.banned.join(', ') || 'none'}\nAutobio: ${s.autobio}\nAutostatus: ${s.autostatus}\nAutotyping: ${s.autotyping}\nAutorecording: ${s.autorecording}\nAutoreact: ${s.autoreact}\nAnticall: ${s.anticall}\nAntidelete: ${s.antidelete}\nAntiviewonce: ${s.antiviewonce}\nAntideleteStatus: ${s.antideletestatus}\nChatbot: ${s.chatbot}\nSwgcMusic: ${s.swgcmusic}`);
});

// 3. PASSWORD - real save
add('password', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const s = getSettings(ctx.sessionOwner);
  if (!ctx.args[0]) return ctx.reply(`Use: ${ctx.prefix}password <newpass>`);
  s.password = ctx.args.join(' '); saveSettings(ctx.sessionOwner, s);
  await ctx.reply('✅ Password saved.');
});

// 4. INFO - real sock.user
add('info', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const s = getSettings(ctx.sessionOwner);
  const me = ctx.sock.user;
  await ctx.reply(`💀 INFO\n\nBot Name: ${me?.name || config.botName}\nBot Number: ${clean(me?.id)}\nOwner: ${ctx.sessionOwner}\nPrefix: ${s.prefix}\nMode: ${s.mode}\nVersion: ${config.version || '2.0.0'}`);
});

// 5. MENUTAG - real save
add('menutag', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const s = getSettings(ctx.sessionOwner);
  if (!ctx.args[0]) return ctx.reply(`Current: ${s.menutag}\nUse: ${ctx.prefix}menutag <text>`);
  s.menutag = ctx.args.join(' '); saveSettings(ctx.sessionOwner, s);
  await ctx.reply(`✅ MenuTag: ${s.menutag}`);
});

// 6. USAGETIP - real save
add('usagetip', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const s = getSettings(ctx.sessionOwner);
  const v = (ctx.args[0] || '').toLowerCase();
  if (!['on','off'].includes(v)) return ctx.reply(`Usagetip: ${s.usagetip}\nUse: ${ctx.prefix}usagetip on/off`);
  s.usagetip = v === 'on'; saveSettings(ctx.sessionOwner, s); ctx.sessionSettings.usagetip = s.usagetip;
  await ctx.reply(`✅ Usagetip: ${s.usagetip}`);
});

// 7. SETPREFIX - real, live change
add('setprefix', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const s = getSettings(ctx.sessionOwner);
  if (!ctx.args[0]) return ctx.reply(`Current: ${s.prefix}\nUse: ${ctx.prefix}setprefix !`);
  s.prefix = ctx.args[0]; saveSettings(ctx.sessionOwner, s); ctx.sessionSettings.prefix = s.prefix;
  await ctx.reply(`✅ Prefix now: ${s.prefix}\nTry: ${s.prefix}menu`);
});

// 8. DELPREFIX - real reset to config
add('delprefix', ['resetprefix'], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const s = getSettings(ctx.sessionOwner);
  s.prefix = config.prefix || '.'; saveSettings(ctx.sessionOwner, s); ctx.sessionSettings.prefix = s.prefix;
  await ctx.reply(`✅ Prefix reset to ${s.prefix}`);
});

// 9. SETPP - real updateProfilePicture, needs replied image
add('setpp', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const quotedMsg = ctx.m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const img = quotedMsg?.imageMessage || ctx.m.message?.imageMessage;
  if (!img) return ctx.reply(`Reply to an image with ${ctx.prefix}setpp`);
  try {
    const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
    const stream = await downloadContentFromMessage(img, 'image');
    let buf = Buffer.from([]);
    for await (const c of stream) buf = Buffer.concat([buf, c]);
    await ctx.sock.updateProfilePicture(ctx.sock.user.id, buf);
    await ctx.reply('✅ Bot PP updated.');
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 10. POSTCH - real send to channel JID
add('postch', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const [ch, ...rest] = ctx.args;
  if (!ch || !rest.length) return ctx.reply(`Use: ${ctx.prefix}postch <channel_jid> <text>`);
  try { await ctx.sock.sendMessage(ch, { text: rest.join(' ') }); await ctx.reply('✅ Posted.'); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 11. SETCMD - real save to database.json
add('setcmd', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const [name, ...rest] = ctx.args;
  if (!name || !rest.length) return ctx.reply(`Use: ${ctx.prefix}setcmd <name> <reply>`);
  const db = getDB(); db.customCmds = db.customCmds || {}; db.customCmds[name.toLowerCase()] = rest.join(' '); saveDB(db);
  await ctx.reply(`✅ Custom .${name.toLowerCase()} saved.`);
});

// 12. DELCMD - real delete
add('delcmd', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  if (!ctx.args[0]) return ctx.reply(`Use: ${ctx.prefix}delcmd <name>`);
  const db = getDB();
  if (!db.customCmds?.[ctx.args[0].toLowerCase()]) return ctx.reply('❌ Not found.');
  delete db.customCmds[ctx.args[0].toLowerCase()]; saveDB(db);
  await ctx.reply('✅ Deleted.');
});

// 13. LISTCMD - real list
add('listcmd', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const db = getDB(); const keys = Object.keys(db.customCmds || {});
  if (!keys.length) return ctx.reply('No custom commands.');
  await ctx.reply(`📋 CUSTOM\n\n${keys.map(k => `.${k} -> ${db.customCmds[k]}`).join('\n')}`);
});

// 14. ALLOWCMD - real save allowed list, handler enforces
add('allowcmd', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const s = getSettings(ctx.sessionOwner);
  const name = (ctx.args[0] || '').toLowerCase();
  if (!name) return ctx.reply(`Allowed: ${s.allowedCmds.join(', ') || 'none'}\nUse: ${ctx.prefix}allowcmd <cmd>`);
  if (s.allowedCmds.includes(name)) s.allowedCmds = s.allowedCmds.filter(x => x !== name);
  else s.allowedCmds.push(name);
  saveSettings(ctx.sessionOwner, s);
  await ctx.reply(`Allowed now: ${s.allowedCmds.join(', ') || 'none'}`);
});

// 15. SWGCMUSIC - real save, handler / status uses it
add('swgcmusic', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const s = getSettings(ctx.sessionOwner);
  const v = (ctx.args[0] || '').toLowerCase();
  if (!['on','off'].includes(v)) return ctx.reply(`SwgcMusic: ${s.swgcmusic}\nUse: ${ctx.prefix}swgcmusic on/off`);
  s.swgcmusic = v === 'on'; saveSettings(ctx.sessionOwner, s); ctx.sessionSettings.swgcmusic = s.swgcmusic;
  await ctx.reply(`✅ SwgcMusic: ${s.swgcmusic}`);
});

// 16. SETBOTBIO - real updateProfileStatus
add('setbotbio', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  if (!ctx.args.length) return ctx.reply(`Use: ${ctx.prefix}setbotbio <text>`);
  try { await ctx.sock.updateProfileStatus(ctx.args.join(' ')); await ctx.reply('✅ Bio updated.'); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 17. AUTOBIO - real: saves + sets bio now to time
add('autobio', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const s = getSettings(ctx.sessionOwner);
  const v = (ctx.args[0] || '').toLowerCase();
  if (!['on','off'].includes(v)) return ctx.reply(`Autobio: ${s.autobio}\nUse: ${ctx.prefix}autobio on/off`);
  s.autobio = v === 'on'; saveSettings(ctx.sessionOwner, s); ctx.sessionSettings.autobio = s.autobio;
  if (s.autobio) { try { await ctx.sock.updateProfileStatus(`💀 MINI-ZYRA ONLINE | ${new Date().toLocaleTimeString('en-NG',{timeZone:'Africa/Lagos'})}`); } catch {} }
  await ctx.reply(`✅ Autobio: ${s.autobio}`);
});

// 18. AUTOSTATUS - real: saves, connection.js auto-views status when true
add('autostatus', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const s = getSettings(ctx.sessionOwner);
  const v = (ctx.args[0] || '').toLowerCase();
  if (!['on','off'].includes(v)) return ctx.reply(`Autostatus: ${s.autostatus}\nUse: ${ctx.prefix}autostatus on/off`);
  s.autostatus = v === 'on'; saveSettings(ctx.sessionOwner, s); ctx.sessionSettings.autostatus = s.autostatus;
  await ctx.reply(`✅ Autostatus: ${s.autostatus}`);
});

// 19. AUTOTYPING - real: saves, handler sends composing on next command
add('autotyping', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const s = getSettings(ctx.sessionOwner);
  const v = (ctx.args[0] || '').toLowerCase();
  if (!['on','off'].includes(v)) return ctx.reply(`Autotyping: ${s.autotyping}\nUse: ${ctx.prefix}autotyping on/off`);
  s.autotyping = v === 'on'; saveSettings(ctx.sessionOwner, s); ctx.sessionSettings.autotyping = s.autotyping;
  if (s.autotyping) await ctx.sock.sendPresenceUpdate('composing', ctx.from);
  await ctx.reply(`✅ Autotyping: ${s.autotyping}`);
});

// 20. AUTORECORDING - real: saves + sends recording presence now
add('autorecording', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const s = getSettings(ctx.sessionOwner);
  const v = (ctx.args[0] || '').toLowerCase();
  if (!['on','off'].includes(v)) return ctx.reply(`Autorecording: ${s.autorecording}\nUse: ${ctx.prefix}autorecording on/off`);
  s.autorecording = v === 'on'; saveSettings(ctx.sessionOwner, s); ctx.sessionSettings.autorecording = s.autorecording;
  if (s.autorecording) await ctx.sock.sendPresenceUpdate('recording', ctx.from);
  await ctx.reply(`✅ Autorecording: ${s.autorecording}`);
});

// 21. AUTOREACT - real: saves + reacts to this message now
add('autoreact', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const s = getSettings(ctx.sessionOwner);
  const v = (ctx.args[0] || '').toLowerCase();
  if (!['on','off'].includes(v)) return ctx.reply(`Autoreact: ${s.autoreact}\nUse: ${ctx.prefix}autoreact on/off`);
  s.autoreact = v === 'on'; saveSettings(ctx.sessionOwner, s); ctx.sessionSettings.autoreact = s.autoreact;
  if (s.autoreact) await ctx.sock.sendMessage(ctx.from, { react: { text: '💀', key: ctx.m.key } });
  await ctx.reply(`✅ Autoreact: ${s.autoreact}`);
});

// 22. ANTICALL - real: saves, connection.js rejects calls when true
add('anticall', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const s = getSettings(ctx.sessionOwner);
  const v = (ctx.args[0] || '').toLowerCase();
  if (!['on','off'].includes(v)) return ctx.reply(`Anticall: ${s.anticall}\nUse: ${ctx.prefix}anticall on/off`);
  s.anticall = v === 'on'; saveSettings(ctx.sessionOwner, s); ctx.sessionSettings.anticall = s.anticall;
  await ctx.reply(`✅ Anticall: ${s.anticall} - calls will be rejected by connection.js`);
});

// 23. ANTIDELETE - real: saves, connection.js restores deleted msgs when true
add('antidelete', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const s = getSettings(ctx.sessionOwner);
  const v = (ctx.args[0] || '').toLowerCase();
  if (!['on','off'].includes(v)) return ctx.reply(`Antidelete: ${s.antidelete}\nUse: ${ctx.prefix}antidelete on/off`);
  s.antidelete = v === 'on'; saveSettings(ctx.sessionOwner, s); ctx.sessionSettings.antidelete = s.antidelete;
  await ctx.reply(`✅ Antidelete: ${s.antidelete}`);
});

// 24. ANTIVIEWONCE - real: saves, connection.js forwards viewonce when true
add('antiviewonce', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const s = getSettings(ctx.sessionOwner);
  const v = (ctx.args[0] || '').toLowerCase();
  if (!['on','off'].includes(v)) return ctx.reply(`Antiviewonce: ${s.antiviewonce}\nUse: ${ctx.prefix}antiviewonce on/off`);
  s.antiviewonce = v === 'on'; saveSettings(ctx.sessionOwner, s); ctx.sessionSettings.antiviewonce = s.antiviewonce;
  await ctx.reply(`✅ Antiviewonce: ${s.antiviewonce}`);
});

// 25. ANTIDELETESTATUS - real: saves
add('antideletestatus', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const s = getSettings(ctx.sessionOwner);
  const v = (ctx.args[0] || '').toLowerCase();
  if (!['on','off'].includes(v)) return ctx.reply(`AntideleteStatus: ${s.antideletestatus}\nUse: ${ctx.prefix}antideletestatus on/off`);
  s.antideletestatus = v === 'on'; saveSettings(ctx.sessionOwner, s); ctx.sessionSettings.antideletestatus = s.antideletestatus;
  await ctx.reply(`✅ AntideleteStatus: ${s.antideletestatus}`);
});

// 26. ADDSUDO - real save
add('addsudo', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const t = target(ctx.m, ctx.args);
  if (!t) return ctx.reply(`Use: ${ctx.prefix}addsudo <number> / reply / tag`);
  const s = getSettings(ctx.sessionOwner);
  if (s.sudo.includes(t)) return ctx.reply('Already sudo.');
  s.sudo.push(t); saveSettings(ctx.sessionOwner, s);
  await ctx.reply(`✅ @${t} is now sudo.`);
});

// 27. DELSUDO - real save
add('delsudo', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const t = target(ctx.m, ctx.args);
  if (!t) return ctx.reply(`Use: ${ctx.prefix}delsudo <number>`);
  const s = getSettings(ctx.sessionOwner);
  s.sudo = s.sudo.filter(x => x !== t); saveSettings(ctx.sessionOwner, s);
  await ctx.reply(`✅ @${t} removed from sudo.`);
});

// 28. SUDOLIST - real list
add('sudolist', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const s = getSettings(ctx.sessionOwner);
  if (!s.sudo.length) return ctx.reply('No sudo users.');
  await ctx.reply(`👑 SUDO\n\n${s.sudo.map((n, i) => `${i + 1}. @${n}`).join('\n')}`);
});

// 29. BLOCK - real updateBlockStatus
add('block', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const t = target(ctx.m, ctx.args);
  if (!t) return ctx.reply(`Use: ${ctx.prefix}block <number>`);
  try { await ctx.sock.updateBlockStatus(`${t}@s.whatsapp.net`, 'block'); await ctx.reply(`✅ @${t} blocked on WhatsApp.`); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 30. UNBLOCK - real updateBlockStatus
add('unblock', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const t = target(ctx.m, ctx.args);
  if (!t) return ctx.reply(`Use: ${ctx.prefix}unblock <number>`);
  try { await ctx.sock.updateBlockStatus(`${t}@s.whatsapp.net`, 'unblock'); await ctx.reply(`✅ @${t} unblocked.`); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 31. BAN - real save, handler ignores banned
add('ban', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const t = target(ctx.m, ctx.args);
  if (!t) return ctx.reply(`Use: ${ctx.prefix}ban <number>`);
  const s = getSettings(ctx.sessionOwner);
  if (!s.banned.includes(t)) s.banned.push(t);
  saveSettings(ctx.sessionOwner, s);
  await ctx.reply(`✅ @${t} banned - bot will ignore them.`);
});

// 32. UNBAN - real save
add('unban', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const t = target(ctx.m, ctx.args);
  if (!t) return ctx.reply(`Use: ${ctx.prefix}unban <number>`);
  const s = getSettings(ctx.sessionOwner);
  s.banned = s.banned.filter(x => x !== t); saveSettings(ctx.sessionOwner, s);
  await ctx.reply(`✅ @${t} unbanned.`);
});

// 33. SAVE - real vCard send
add('save', ['savecontact'], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const t = target(ctx.m, ctx.args);
  if (!t) return ctx.reply(`Use: ${ctx.prefix}save <number>`);
  const name = ctx.args.slice(1).join(' ') || t;
  await ctx.sock.sendMessage(ctx.from, { contacts: { displayName: name, contacts: [{ vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL;type=CELL;type=VOICE;waid=${t}:+${t}\nEND:VCARD` }] } });
  await ctx.reply(`✅ Contact @${t} sent.`);
});

// 34. SCHEDULESTATUS - real setTimeout + updateProfileStatus
add('schedulestatus', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const [mins, ...rest] = ctx.args;
  if (!mins || !rest.length) return ctx.reply(`Use: ${ctx.prefix}schedulestatus <minutes> <text>`);
  const ms = parseInt(mins) * 60000;
  if (isNaN(ms)) return ctx.reply('Minutes must be number.');
  await ctx.reply(`⏰ Status will change in ${mins} min.`);
  setTimeout(async () => { try { await ctx.sock.updateProfileStatus(rest.join(' ')); } catch {} }, ms);
});

// 35. RESHARE - real forward quoted
add('reshare', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const q = ctx.m.message?.extendedTextMessage?.contextInfo;
  if (!q?.quotedMessage) return ctx.reply(`Reply to a message with ${ctx.prefix}reshare`);
  try { await ctx.sock.sendMessage(ctx.from, { forward: q }); await ctx.reply('✅ Reshared.'); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 36. CHATBOT - real save, handler checks it
add('chatbot', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const s = getSettings(ctx.sessionOwner);
  const v = (ctx.args[0] || '').toLowerCase();
  if (!['on','off'].includes(v)) return ctx.reply(`Chatbot: ${s.chatbot}\nUse: ${ctx.prefix}chatbot on/off`);
  s.chatbot = v === 'on'; saveSettings(ctx.sessionOwner, s); ctx.sessionSettings.chatbot = s.chatbot;
  await ctx.reply(`✅ Chatbot: ${s.chatbot}`);
});

// 37. CLEARSESSION - real delete temp files only, keeps creds.json
add('clearsession', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  try {
    const dir = path.join(__dirname, '../../sessions', String(ctx.sessionOwner));
    const files = await fs.readdir(dir).catch(() => []);
    for (const f of files) { if (f.startsWith('app-state') || f.endsWith('.tmp')) await fs.remove(path.join(dir, f)).catch(() => {}); }
    await ctx.reply('✅ Session temp cleared. creds.json kept - bot stays linked.');
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 38. CLEARTMP - real emptyDir
add('cleartmp', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  try { await fs.emptyDir(path.join(__dirname, '../../tmp')); await ctx.reply('✅ /tmp cleared.'); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 39. PAIR - real: tells dashboard link for that number
add('pair', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const t = clean(ctx.args[0]);
  if (!t) return ctx.reply(`Use: ${ctx.prefix}pair <number>`);
  await ctx.reply(`🔑 Pair ${t} on dashboard:\n${process.env.RENDER_EXTERNAL_URL || 'Your Render URL'}/getcode?number=${t}`);
});

// 40. CHECKIDCH - real: echoes + validates JID format
add('checkidch', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  if (!ctx.args[0]) return ctx.reply(`Use: ${ctx.prefix}checkidch <channel_jid>`);
  const id = ctx.args[0];
  const isValid = id.includes('@') || id.includes('newsletter') || /^\d+$/.test(id);
  await ctx.reply(`📡 Channel ID: ${id}\nValid format: ${isValid ? 'YES ✅' : 'NO ❌'}`);
});

// 41. ARCHIVE - real chatModify
add('archive', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  try { await ctx.sock.chatModify({ archive: true }, ctx.from); await ctx.reply('✅ Archived.'); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 42. UNARCHIVE - real chatModify
add('unarchive', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  try { await ctx.sock.chatModify({ archive: false }, ctx.from); await ctx.reply('✅ Unarchived.'); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 43. CHATPIN - real chatModify pin
add('chatpin', ['pin'], async (ctx) => {
  if (!mustOwner(ctx)) return;
  try { await ctx.sock.chatModify({ pin: true }, ctx.from); await ctx.reply('✅ Pinned.'); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 44. UNPIN - real chatModify
add('unpin', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  try { await ctx.sock.chatModify({ pin: false }, ctx.from); await ctx.reply('✅ Unpinned.'); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 45. MARKREAD - real chatModify
add('markread', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  try { await ctx.sock.chatModify({ markRead: true }, ctx.from); await ctx.reply('✅ Marked read.'); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 46. MARKUNREAD - real chatModify
add('markunread', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  try { await ctx.sock.chatModify({ markRead: false }, ctx.from); await ctx.reply('✅ Marked unread.'); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 47. UNMUTECHAT - real chatModify mute null
add('unmutechat', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  try { await ctx.sock.chatModify({ mute: null }, ctx.from); await ctx.reply('✅ Unmuted.'); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 48. PROFILENAME - real updateProfileName
add('profilename', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  if (!ctx.args.length) return ctx.reply(`Use: ${ctx.prefix}profilename <name>`);
  try { await ctx.sock.updateProfileName(ctx.args.join(' ')); await ctx.reply('✅ Name updated.'); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 49. FULLPHOTO - real profilePictureUrl + send image
add('fullphoto', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  try {
    const pp = await ctx.sock.profilePictureUrl(ctx.sock.user.id, 'image');
    await ctx.sock.sendMessage(ctx.from, { image: { url: pp }, caption: '📸 Full bot photo' });
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 50. REMOVEPHOTO - real removeProfilePicture
add('removephoto', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  try { await ctx.sock.removeProfilePicture(ctx.sock.user.id); await ctx.reply('✅ PP removed.'); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 51. JOIN - real groupAcceptInvite
add('join', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const link = ctx.args[0];
  if (!link) return ctx.reply(`Use: ${ctx.prefix}join <group_link>`);
  const code = link.split('/').pop().split('?')[0];
  try { const res = await ctx.sock.groupAcceptInvite(code); await ctx.reply(`✅ Joined: ${res}`); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 52. LISTGC - real groupFetchAllParticipating
add('listgc', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  try {
    const groups = await ctx.sock.groupFetchAllParticipating();
    const list = Object.values(groups).map((g, i) => `${i + 1}. ${g.subject} - ${g.id}`).join('\n');
    await ctx.reply(`👥 GROUPS (${Object.keys(groups).length})\n\n${list || 'No groups'}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 53. EDIT - real edit via key
add('edit', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const q = ctx.m.message?.extendedTextMessage?.contextInfo;
  if (!q?.quotedMessage || !ctx.args.length) return ctx.reply(`Reply to bot message with ${ctx.prefix}edit <new text>`);
  try { await ctx.sock.sendMessage(ctx.from, { text: ctx.args.join(' '), edit: q.stanzaId ? { id: q.stanzaId, remoteJid: ctx.from, fromMe: true } : q }); await ctx.reply('✅ Edited.'); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 54. FORWARD - real forward quoted to JID
add('forward', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const jid = ctx.args[0];
  const q = ctx.m.message?.extendedTextMessage?.contextInfo;
  if (!q?.quotedMessage || !jid) return ctx.reply(`Reply with ${ctx.prefix}forward <jid_or_number>`);
  const t = jid.includes('@') ? jid : `${clean(jid)}@s.whatsapp.net`;
  try { await ctx.sock.sendMessage(t, { forward: q }); await ctx.reply('✅ Forwarded.'); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 55. GETPRIVACY - real fetchPrivacySettings
add('getprivacy', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  try {
    const p = await ctx.sock.fetchPrivacySettings(true);
    await ctx.reply(`🔒 PRIVACY\n\nLastSeen: ${p.last}\nProfile: ${p.profile}\nAbout: ${p.about}\nStatus: ${p.status}\nReadReceipts: ${p.readreceipts}\nGroupAdd: ${p.groupadd}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 56. LASTSEEN - real fetchStatus
add('lastseen', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const t = target(ctx.m, ctx.args);
  if (!t) return ctx.reply(`Use: ${ctx.prefix}lastseen <number>`);
  try {
    const s = await ctx.sock.fetchStatus(`${t}@s.whatsapp.net`);
    await ctx.reply(`👁️ LASTSEEN\n\nNumber: @${t}\nAbout: ${s?.status || 'Hidden'}\nSet At: ${s?.setAt ? new Date(s.setAt).toLocaleString() : 'Hidden'}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 57. MYPP - real profilePictureUrl
add('mypp', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  try { const pp = await ctx.sock.profilePictureUrl(ctx.sock.user.id, 'image'); await ctx.sock.sendMessage(ctx.from, { image: { url: pp }, caption: '📸 My PP' }); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 58. MYSTATUS - real fetchStatus
add('mystatus', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  try { const s = await ctx.sock.fetchStatus(ctx.sock.user.id); await ctx.reply(`📝 MY STATUS\n\n${s?.status || 'No bio'}`); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 59. READ - real readMessages
add('read', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  try { await ctx.sock.readMessages([ctx.m.key]); await ctx.reply('✅ Marked read.'); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 60. GROUPADD - real groupParticipantsUpdate add
add('groupadd', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  if (!ctx.from.endsWith('@g.us')) return ctx.reply('Use in a group.');
  const t = target(ctx.m, ctx.args);
  if (!t) return ctx.reply(`Use: ${ctx.prefix}groupadd <number>`);
  try { await ctx.sock.groupParticipantsUpdate(ctx.from, [`${t}@s.whatsapp.net`], 'add'); await ctx.reply(`✅ @${t} added.`); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 61. PRIVACY - real updatePrivacySettings
add('privacy', [], async (ctx) => {
  if (!mustOwner(ctx)) return;
  const [field, value] = ctx.args;
  if (!field || !value) return ctx.reply(`Use: ${ctx.prefix}privacy <lastseen|profile|about|status|readreceipts|groupadd> <everyone|contacts|contact_blacklist|none>`);
  try { await ctx.sock.updatePrivacySettings(field, value); await ctx.reply(`✅ Privacy ${field} = ${value}`); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
  });

module.exports = cmds;
