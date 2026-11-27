// ============================================================
// MINI-ZYRA - UTILITY 2 MODULE - ALL IN ONE FILE
// BY FACELESS - NO DEMO - NO SIMULATION - NO PLACEHOLDER
// REAL: Screenshot API, IP lookup, URL check, PDF via text, etc.
// ============================================================
const fs = require('fs-extra');
const path = require('path');
const tmpDir = path.join(__dirname, '../../tmp');
fs.ensureDirSync(tmpDir);

const cmds = [];
const add = (name, alias, ownerOnly, execute) => cmds.push({ name, alias: alias || [], ownerOnly, execute });
function clean(t) { return String(t || '').replace(/[^0-9]/g, ''); }

// 1. SCREENSHOT HD - real Thum.io HD
add('sshd', ['screenshot2', 'webshot'], false, async (ctx) => {
  if (!ctx.text || !ctx.text.startsWith('http')) return ctx.reply(`Use: ${ctx.prefix}sshd <link>\nExample: ${ctx.prefix}sshd https://google.com`);
  try {
    const url = `https://image.thum.io/get/width/1200/crop/800/noanimate/${ctx.text}`;
    await ctx.sock.sendMessage(ctx.from, { image: { url }, caption: `📸 HD Screenshot: ${ctx.text}` }, { quoted: ctx.m });
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 2. IP LOOKUP - real ip-api.com
add('iplookup', ['ipinfo', 'iptrack'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}iplookup <IP>\nExample: ${ctx.prefix}iplookup 8.8.8.8`);
  try {
    const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ctx.text)}`);
    const j = await res.json();
    if (j.status === 'fail') return ctx.reply(`❌ ${j.message}`);
    await ctx.reply(`🌐 *IP INFO - ${j.query}*\n\nCountry: ${j.country} (${j.countryCode})\nRegion: ${j.regionName}\nCity: ${j.city}\nZIP: ${j.zip}\nTimezone: ${j.timezone}\nISP: ${j.isp}\nOrg: ${j.org}\nAS: ${j.as}\nLat/Lon: ${j.lat}, ${j.lon}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 3. MY IP - real checkip
add('myip', ['myipaddress'], false, async (ctx) => {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const j = await res.json();
    await ctx.reply(`🌐 *YOUR BOT SERVER IP*\n\nIP: ${j.ip}\n\nThis is Render server IP, not your phone IP.`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 4. URL CHECK - real HEAD request, check if site is up
add('urlcheck', ['isup', 'websitecheck'], false, async (ctx) => {
  if (!ctx.text || !ctx.text.startsWith('http')) return ctx.reply(`Use: ${ctx.prefix}urlcheck <link>`);
  try {
    const start = Date.now();
    const res = await fetch(ctx.text, { method: 'HEAD' });
    const ms = Date.now() - start;
    await ctx.reply(`🌐 *URL CHECK*\n\nURL: ${ctx.text}\nStatus: ${res.status} ${res.statusText}\nSpeed: ${ms}ms\nServer: ${res.headers.get('server') || 'Unknown'}\nContent-Type: ${res.headers.get('content-type') || 'Unknown'}\n\n${res.ok ? '✅ Site is UP' : '❌ Site is DOWN / Error'}`);
  } catch (e) { await ctx.reply(`❌ Site DOWN or blocked: ${e.message}`); }
});

// 5. WHOIS - real via whois API (free)
add('whois', ['domaininfo'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}whois <domain>\nExample: ${ctx.prefix}whois google.com`);
  try {
    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(ctx.text.replace('https://', '').replace('http://', '').split('/')[0])}`);
    const j = await res.json();
    if (j.errorCode) return ctx.reply(`❌ ${j.title || 'Domain not found'}`);
    await ctx.reply(`🌐 *WHOIS - ${ctx.text}*\n\nStatus: ${(j.status || []).join(', ')}\nCreated: ${j.events?.find(e => e.eventAction === 'registration')?.eventDate || 'N/A'}\nExpires: ${j.events?.find(e => e.eventAction === 'expiration')?.eventDate || 'N/A'}\nRegistrar: ${j.entities?.[0]?.vcardArray?.[1]?.find(x => x[0] === 'fn')?.[3] || 'N/A'}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 6. PASSWORD STRENGTH - real entropy calc
add('passcheck', ['passwordcheck'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}passcheck <password>\n⚠️ Don't send your real password, test a similar one.`);
  const p = ctx.text;
  let score = 0;
  if (p.length >= 8) score += 2; if (p.length >= 12) score += 2;
  if (/[a-z]/.test(p)) score += 1; if (/[A-Z]/.test(p)) score += 1;
  if (/[0-9]/.test(p)) score += 1; if (/[^a-zA-Z0-9]/.test(p)) score += 2;
  const entropy = Math.log2(Math.pow(94, p.length)).toFixed(0);
  const verdict = score >= 8 ? 'Strong 💪' : score >= 5 ? 'Medium ⚠️' : 'Weak ❌';
  await ctx.reply(`🔐 *PASSWORD CHECK*\n\nLength: ${p.length}\nEntropy: ~${entropy} bits\nScore: ${score}/9\nVerdict: ${verdict}\n\nTips: Use 12+ chars, mix upper/lower/numbers/symbols.`);
});

// 7. TEXT TO PDF - real via creating text file and sending as document (WhatsApp shows as doc)
add('topdf', ['textpdf', 'makepdf'], false, async (ctx) => {
  const text = ctx.text || ctx.m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation || '';
  if (!text) return ctx.reply(`Use: ${ctx.prefix}topdf <text>`);
  try {
    const file = path.join(tmpDir, `doc_${Date.now()}.txt`);
    await fs.writeFile(file, `MINI-ZYRA DOCUMENT\n\n${text}\n\nGenerated: ${new Date().toLocaleString()}`);
    await ctx.sock.sendMessage(ctx.from, { document: { url: file }, mimetype: 'text/plain', fileName: 'MINI-ZYRA-Document.txt' }, { quoted: ctx.m });
    await fs.remove(file);
    await ctx.reply(`📄 Document created from your text.`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 8. VCF - real create contact file from number
add('vcf', ['makevcf'], false, async (ctx) => {
  const num = clean(ctx.args[0]) || clean(ctx.sender);
  const name = ctx.args.slice(1).join(' ') || `+${num}`;
  try {
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL;type=CELL;type=VOICE;waid=${num}:+${num}\nEND:VCARD`;
    const file = path.join(tmpDir, `${num}.vcf`);
    await fs.writeFile(file, vcard);
    await ctx.sock.sendMessage(ctx.from, { document: { url: file }, mimetype: 'text/vcard', fileName: `${name}.vcf` }, { quoted: ctx.m });
    await fs.remove(file);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 9. STICKER PACK - real 3 stickers from search
add('stickerpack', ['spack'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}stickerpack <query>`);
  try {
    const res = await fetch(`https://api.giphy.com/v1/stickers/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(ctx.text)}&limit=3&rating=g`);
    const j = await res.json();
    if (!j.data?.length) return ctx.reply('❌ No stickers found.');
    await ctx.reply(`📦 Sending ${j.data.length} stickers for: ${ctx.text}`);
    for (const s of j.data) {
      await ctx.sock.sendMessage(ctx.from, { sticker: { url: s.images.original.url } }, { quoted: ctx.m });
      await new Promise(r => setTimeout(r, 800));
    }
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 10. REACT - real react to quoted message
add('react', ['reactemoji'], false, async (ctx) => {
  const emoji = ctx.args[0] || '❤️';
  const quoted = ctx.m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (!quoted) return ctx.reply(`Reply to a message with ${ctx.prefix}react <emoji>`);
  try {
    await ctx.sock.sendMessage(ctx.from, { react: { text: emoji, key: { remoteJid: ctx.from, fromMe: false, id: ctx.m.message.extendedTextMessage.contextInfo.stanzaId, participant: ctx.m.message.extendedTextMessage.contextInfo.participant } } });
    await ctx.reply(`✅ Reacted ${emoji}`);
  } catch (e) { await ctx.reply(`❌ React failed (WhatsApp may block): ${e.message}`); }
});

// 11. POLL - real WhatsApp poll
add('poll', ['vote'], false, async (ctx) => {
  const parts = ctx.text.split('|').map(s => s.trim()).filter(Boolean);
  if (parts.length < 3) return ctx.reply(`Use: ${ctx.prefix}poll <question> | <option1> | <option2> | <option3>\nExample: ${ctx.prefix}poll Best food? | Jollof | Fried Rice | Amala`);
  try {
    await ctx.sock.sendMessage(ctx.from, { poll: { name: parts[0], values: parts.slice(1), selectableCount: 1 } }, { quoted: ctx.m });
  } catch (e) { await ctx.reply(`❌ Poll failed: ${e.message}`); }
});

// 12. LOCATION - real send location (Lagos default or args)
add('location', ['sendlocation'], false, async (ctx) => {
  const lat = parseFloat(ctx.args[0]) || 6.5244;
  const lon = parseFloat(ctx.args[1]) || 3.3792;
  const name = ctx.args.slice(2).join(' ') || 'Lagos, Nigeria';
  try {
    await ctx.sock.sendMessage(ctx.from, { location: { degreesLatitude: lat, degreesLongitude: lon, name, address: name } }, { quoted: ctx.m });
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 13. CONTACT - real send contact of quoted user
add('contact', ['getcontact'], false, async (ctx) => {
  const t = ctx.m.quoted?.participant || ctx.m.mentionedJid?.[0] || ctx.sender;
  const num = clean(t);
  const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:+${num}\nTEL;type=CELL;type=VOICE;waid=${num}:+${num}\nEND:VCARD`;
  await ctx.sock.sendMessage(ctx.from, { contacts: { displayName: `+${num}`, contacts: [{ vcard }] } }, { quoted: ctx.m });
});

// 14. FORWARD - real forward quoted message to number
add('forward', ['fwd'], false, async (ctx) => {
  const num = clean(ctx.args[0]);
  if (!num) return ctx.reply(`Reply to a message with ${ctx.prefix}forward <number>`);
  // WhatsApp forward is just re-sending text - we use quoted text
  const quoted = ctx.m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation || ctx.m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text || '';
  if (!quoted) return ctx.reply('❌ Reply to a text message to forward.');
  try { await ctx.sock.sendMessage(`${num}@s.whatsapp.net`, { text: `📩 *Forwarded from MINI-ZYRA*\n\n${quoted}` }); await ctx.reply(`✅ Forwarded to +${num}`); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 15. DELETE FOR ALL - real delete quoted bot message
add('delete', ['delbot'], false, async (ctx) => {
  const q = ctx.m.message?.extendedTextMessage?.contextInfo;
  if (!q?.stanzaId) return ctx.reply(`Reply to a bot message with ${ctx.prefix}delete`);
  try {
    await ctx.sock.sendMessage(ctx.from, { delete: { remoteJid: ctx.from, fromMe: true, id: q.stanzaId, participant: ctx.sender } });
    await ctx.reply('✅ Deleted (if it was bot message).');
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 16. EDIT - real edit bot message (WhatsApp edit)
add('edit', ['editmsg'], false, async (ctx) => {
  const q = ctx.m.message?.extendedTextMessage?.contextInfo;
  if (!q?.stanzaId || !ctx.text) return ctx.reply(`Reply to a bot message with ${ctx.prefix}edit <new text>`);
  try {
    await ctx.sock.sendMessage(ctx.from, { edit: { remoteJid: ctx.from, fromMe: true, id: q.stanzaId, participant: ctx.sender }, text: ctx.text });
  } catch (e) { await ctx.reply(`❌ Edit failed: ${e.message}`); }
});

// 17. TIMEZONE - real time in any city via worldtimeapi
add('timezone', ['worldtime'], false, async (ctx) => {
  const zone = ctx.text || 'Africa/Lagos';
  try {
    const res = await fetch(`https://worldtimeapi.org/api/timezone/${encodeURIComponent(zone)}`);
    const j = await res.json();
    if (j.error) return ctx.reply(`❌ Timezone not found. Try: Africa/Lagos, Europe/London, America/New_York, Asia/Dubai`);
    await ctx.reply(`🕐 *TIMEZONE - ${j.timezone}*\n\nLocal: ${j.datetime}\nDay: ${j.day_of_week} | Week: ${j.week_number}\nUTC Offset: ${j.utc_offset}\nAbbreviation: ${j.abbreviation}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 18. HOLIDAY - real Nager.Date API for Nigeria
add('holiday', ['holidays'], false, async (ctx) => {
  const year = parseInt(ctx.args[0]) || new Date().getFullYear();
  try {
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/NG`);
    const j = await res.json();
    await ctx.reply(`🇳🇬 *NIGERIA HOLIDAYS ${year}*\n\n${j.slice(0, 15).map(h => `${h.date} - ${h.localName} (${h.name})`).join('\n')}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

module.exports = cmds;
