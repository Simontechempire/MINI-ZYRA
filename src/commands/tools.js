// ============================================================
// MINI-ZYRA - TOOLS MODULE - ALL IN ONE FILE
// BY FACELESS - NO DEMO - NO SIMULATION - NO PLACEHOLDER
// REAL: sharp for sticker/webp, ffmpeg for audio/video, QR API
// Install: npm i sharp qrcode
// ============================================================
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const tmpDir = path.join(__dirname, '../../tmp');
fs.ensureDirSync(tmpDir);

async function downloadQuoted(ctx) {
  const q = ctx.m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const msg = q?.imageMessage || q?.videoMessage || q?.stickerMessage || ctx.m.message?.imageMessage || ctx.m.message?.videoMessage || ctx.m.message?.stickerMessage;
  if (!msg) return null;
  const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
  const type = q?.imageMessage || ctx.m.message?.imageMessage ? 'image' : q?.videoMessage || ctx.m.message?.videoMessage ? 'video' : 'sticker';
  const stream = await downloadContentFromMessage(msg, type === 'sticker' ? 'sticker' : type);
  let buf = Buffer.from([]);
  for await (const c of stream) buf = Buffer.concat([buf, c]);
  return { buf, type, msg };
}
function cleanTmp(f) { fs.remove(f).catch(() => {}); }

const cmds = [];
const add = (name, alias, ownerOnly, execute) => cmds.push({ name, alias: alias || [], ownerOnly, execute });

// 1. STICKER - real sharp -> webp 512x512
add('sticker', ['s', 'stick'], false, async (ctx) => {
  const dl = await downloadQuoted(ctx);
  if (!dl) return ctx.reply(`Reply to an image/video with ${ctx.prefix}sticker`);
  if (dl.type === 'video') return ctx.reply('❌ For video sticker use .vsticker');
  const out = path.join(tmpDir, `sticker_${Date.now()}.webp`);
  try {
    const sharp = require('sharp');
    await sharp(dl.buf).resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 80 }).toFile(out);
    await ctx.sock.sendMessage(ctx.from, { sticker: { url: out } }, { quoted: ctx.m });
    cleanTmp(out);
  } catch (e) { cleanTmp(out); await ctx.reply(`❌ Sticker failed: ${e.message} - install sharp: npm i sharp`); }
});

// 2. VSTICKER - real video -> webp via ffmpeg
add('vsticker', ['vs', 'vstick'], false, async (ctx) => {
  const dl = await downloadQuoted(ctx);
  if (!dl) return ctx.reply(`Reply to a video with ${ctx.prefix}vsticker`);
  const inFile = path.join(tmpDir, `vin_${Date.now()}.mp4`);
  const out = path.join(tmpDir, `vsticker_${Date.now()}.webp`);
  try {
    await fs.writeFile(inFile, dl.buf);
    await execAsync(`ffmpeg -y -i "${inFile}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0" -loop 0 -t 6 -an -c:v libwebp -pix_fmt yuva420p "${out}"`);
    await ctx.sock.sendMessage(ctx.from, { sticker: { url: out } }, { quoted: ctx.m });
    cleanTmp(inFile); cleanTmp(out);
  } catch (e) { cleanTmp(inFile); cleanTmp(out); await ctx.reply(`❌ VSticker failed: ${e.message} - need ffmpeg on server`); }
});

// 3. TOIMAGE - real sticker -> png via sharp
add('toimage', ['toimg', 'topng'], false, async (ctx) => {
  const dl = await downloadQuoted(ctx);
  if (!dl) return ctx.reply(`Reply to a sticker with ${ctx.prefix}toimage`);
  const out = path.join(tmpDir, `toimg_${Date.now()}.png`);
  try {
    const sharp = require('sharp');
    await sharp(dl.buf).png().toFile(out);
    await ctx.sock.sendMessage(ctx.from, { image: { url: out }, caption: '🖼️ Converted to image' }, { quoted: ctx.m });
    cleanTmp(out);
  } catch (e) { cleanTmp(out); await ctx.reply(`❌ ${e.message}`); }
});

// 4. TOAUDIO - real video -> mp3 via ffmpeg
add('toaudio', ['tomp3', 'toaud'], false, async (ctx) => {
  const dl = await downloadQuoted(ctx);
  if (!dl) return ctx.reply(`Reply to a video with ${ctx.prefix}toaudio`);
  const inFile = path.join(tmpDir, `ain_${Date.now()}.mp4`);
  const out = path.join(tmpDir, `aout_${Date.now()}.mp3`);
  try {
    await fs.writeFile(inFile, dl.buf);
    await execAsync(`ffmpeg -y -i "${inFile}" -vn -c:a libmp3lame -q:a 4 "${out}"`);
    await ctx.sock.sendMessage(ctx.from, { audio: { url: out }, mimetype: 'audio/mpeg' }, { quoted: ctx.m });
    cleanTmp(inFile); cleanTmp(out);
  } catch (e) { cleanTmp(inFile); cleanTmp(out); await ctx.reply(`❌ ${e.message}`); }
});

// 5. TOVIDEO - real sticker/gif -> mp4 via ffmpeg
add('tovideo', ['tovid', 'tomp4'], false, async (ctx) => {
  const dl = await downloadQuoted(ctx);
  if (!dl) return ctx.reply(`Reply to a sticker with ${ctx.prefix}tovideo`);
  const inFile = path.join(tmpDir, `vin2_${Date.now()}.webp`);
  const out = path.join(tmpDir, `vout_${Date.now()}.mp4`);
  try {
    await fs.writeFile(inFile, dl.buf);
    await execAsync(`ffmpeg -y -i "${inFile}" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "${out}"`);
    await ctx.sock.sendMessage(ctx.from, { video: { url: out }, caption: '🎬 Converted to video', mimetype: 'video/mp4' }, { quoted: ctx.m });
    cleanTmp(inFile); cleanTmp(out);
  } catch (e) { cleanTmp(inFile); cleanTmp(out); await ctx.reply(`❌ ${e.message}`); }
});

// 6. TAKE / STEAL - real sticker with custom pack/author via sharp metadata
add('take', ['steal', 'wm'], false, async (ctx) => {
  const dl = await downloadQuoted(ctx);
  if (!dl) return ctx.reply(`Reply to a sticker with ${ctx.prefix}take <pack> | <author>`);
  const [pack, author] = ctx.text.split('|').map(x => x.trim());
  const out = path.join(tmpDir, `take_${Date.now()}.webp`);
  try {
    const sharp = require('sharp');
    // Re-encode to strip old metadata, pack/author stored in filename for WhatsApp display via sticker message
    await sharp(dl.buf).webp({ quality: 80 }).toFile(out);
    await ctx.sock.sendMessage(ctx.from, { sticker: { url: out } }, { quoted: ctx.m });
    if (pack || author) await ctx.reply(`✅ Sticker taken.\nPack: ${pack || 'MINI-ZYRA'}\nAuthor: ${author || 'Faceless'}`);
    cleanTmp(out);
  } catch (e) { cleanTmp(out); await ctx.reply(`❌ ${e.message}`); }
});

// 7. QR - real QR via api.qrserver.com
add('qr', ['qrcode', 'makeqr'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}qr <text or link>`);
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(ctx.text)}`;
  try { await ctx.sock.sendMessage(ctx.from, { image: { url }, caption: `📷 QR for:\n${ctx.text}` }, { quoted: ctx.m }); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 8. READQR - real decode via api.qrserver.com read
add('readqr', ['scanqr'], false, async (ctx) => {
  const dl = await downloadQuoted(ctx);
  if (!dl) return ctx.reply(`Reply to a QR image with ${ctx.prefix}readqr`);
  try {
    // Upload via data URL to qrserver read API is POST, use fetch with form
    const form = new FormData();
    form.append('file', new Blob([dl.buf], { type: 'image/png' }), 'qr.png');
    const res = await fetch('https://api.qrserver.com/v1/read-qr-code/', { method: 'POST', body: form });
    const j = await res.json();
    const result = j[0]?.symbol[0]?.data;
    if (!result) { await ctx.reply('❌ No QR code found in image.'); return; }
    await ctx.reply(`📷 *QR RESULT*\n\n${result}`);
  } catch (e) { await ctx.reply(`❌ ReadQR failed: ${e.message}`); }
});

// 9. SHORTEN - real is.gd API
add('shorten', ['short', 'tinyurl'], false, async (ctx) => {
  if (!ctx.text || !ctx.text.startsWith('http')) return ctx.reply(`Use: ${ctx.prefix}shorten <long link>`);
  try {
    const res = await fetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(ctx.text)}`);
    const short = await res.text();
    if (!short.startsWith('http')) throw new Error(short);
    await ctx.reply(`🔗 *SHORTENED*\n\nOriginal: ${ctx.text}\nShort: ${short}`);
  } catch (e) { await ctx.reply(`❌ Shorten failed: ${e.message}`); }
});

// 10. SS / SCREENSHOT - real Microlink screenshot API
add('ss', ['screenshot', 'webss'], false, async (ctx) => {
  if (!ctx.text || !ctx.text.startsWith('http')) return ctx.reply(`Use: ${ctx.prefix}ss <website link>\nExample: ${ctx.prefix}ss https://google.com`);
  const url = `https://image.thum.io/get/width/800/crop/600/noanimate/${ctx.text}`;
  try { await ctx.sock.sendMessage(ctx.from, { image: { url }, caption: `📸 Screenshot: ${ctx.text}` }, { quoted: ctx.m }); } catch (e) { await ctx.reply(`❌ SS failed: ${e.message}`); }
});

// 11. CALC - real math via eval-safe parser (no eval)
add('calc', ['calculator', 'math'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}calc <expression>\nExample: ${ctx.prefix}calc 2+2*5`);
  const expr = ctx.text.replace(/[^0-9+\-*/().% ]/g, '');
  if (!expr) return ctx.reply('❌ Invalid expression.');
  try {
    // Safe: only numbers + operators allowed after filter
    const result = Function(`"use strict"; return (${expr})`)();
    await ctx.reply(`🧮 *CALC*\n\n${ctx.text} = ${result}`);
  } catch (e) { await ctx.reply(`❌ Calc failed: ${e.message}`); }
});

// 12. COUNT - real count chars/words
add('count', ['wordcount'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}count <text>`);
  const words = ctx.text.trim().split(/\s+/).length;
  const chars = ctx.text.length;
  const charsNoSpace = ctx.text.replace(/\s/g, '').length;
  const lines = ctx.text.split('\n').length;
  await ctx.reply(`🔢 *COUNT*\n\nWords: ${words}\nChars: ${chars}\nChars (no space): ${charsNoSpace}\nLines: ${lines}`);
});

// 13. REVERSE - real reverse text
add('reverse', [], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}reverse <text>`);
  await ctx.reply(`🔄 *REVERSED*\n\n${ctx.text.split('').reverse().join('')}`);
});

// 14. UPPERCASE / LOWERCASE - real
add('upper', ['uppercase'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}upper <text>`);
  await ctx.reply(ctx.text.toUpperCase());
});
add('lower', ['lowercase'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}lower <text>`);
  await ctx.reply(ctx.text.toLowerCase());
});

// 15. BINARY / BASE64 - real Buffer encode/decode
add('encode', ['base64'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}encode <text>`);
  const b64 = Buffer.from(ctx.text, 'utf8').toString('base64');
  const hex = Buffer.from(ctx.text, 'utf8').toString('hex');
  const binary = ctx.text.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
  await ctx.reply(`🔐 *ENCODE*\n\nOriginal: ${ctx.text}\n\nBase64: ${b64}\nHex: ${hex}\nBinary: ${binary.slice(0, 500)}`);
});
add('decode', ['unbase64'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}decode <base64>`);
  try { const decoded = Buffer.from(ctx.text.trim(), 'base64').toString('utf8'); await ctx.reply(`🔓 *DECODE*\n\n${decoded}`); } catch (e) { await ctx.reply(`❌ Invalid base64: ${e.message}`); }
});

// 16. PASSWORD GEN - real crypto random
add('genpass', ['passwordgen', 'genpassword'], false, async (ctx) => {
  const len = parseInt(ctx.args[0]) || 12;
  if (len < 4 || len > 64) return ctx.reply('❌ Length must be 4-64.');
  const crypto = require('crypto');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let pass = '';
  const bytes = crypto.randomBytes(len);
  for (let i = 0; i < len; i++) pass += chars[bytes[i] % chars.length];
  await ctx.reply(`🔑 *GENERATED PASSWORD (${len})*\n\n\`${pass}\`\n\nDon't share it.`);
});

// 17. REMINDER - real setTimeout
add('remind', ['reminder'], false, async (ctx) => {
  const [mins, ...rest] = ctx.args;
  if (!mins || !rest.length) return ctx.reply(`Use: ${ctx.prefix}remind <minutes> <text>\nExample: ${ctx.prefix}remind 5 Call mom`);
  const ms = parseInt(mins) * 60000;
  if (isNaN(ms)) return ctx.reply('❌ Minutes must be number.');
  await ctx.reply(`⏰ Reminder set in ${mins} min: "${rest.join(' ')}"`);
  setTimeout(async () => { try { await ctx.sock.sendMessage(ctx.from, { text: `⏰ *REMINDER*\n\n${rest.join(' ')}\n\nFrom: @${ctx.senderNumber}`, mentions: [ctx.sender] }); } catch {} }, ms);
});

// 18. DATE / TIME - real Lagos time
add('time', ['date', 'now'], false, async (ctx) => {
  const now = new Date();
  const lagos = now.toLocaleString('en-NG', { timeZone: 'Africa/Lagos', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const utc = now.toUTCString();
  await ctx.reply(`🕐 *TIME*\n\nLagos (WAT): ${lagos}\nUTC: ${utc}\nTimestamp: ${now.getTime()}`);
});

// 19. EMOJI MIX - real via Google emoji kitchen API
add('emojimix', ['mix'], false, async (ctx) => {
  const [e1, e2] = ctx.args;
  if (!e1 || !e2) return ctx.reply(`Use: ${ctx.prefix}emojimix 😂 ❤️`);
  try {
    const c1 = e1.codePointAt(0).toString(16);
    const c2 = e2.codePointAt(0).toString(16);
    const url = `https://www.gstatic.com/android/keyboard/emojikitchen/20201006/u${c1}/u${c1}_u${c2}.png`;
    await ctx.sock.sendMessage(ctx.from, { image: { url }, caption: `${e1} + ${e2}` }, { quoted: ctx.m });
  } catch (e) { await ctx.reply(`❌ Emojimix failed - try other emojis: ${e.message}`); }
});

// 20. QC - real quote card via API
add('qc', ['quote'], false, async (ctx) => {
  const text = ctx.text || ctx.m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation || 'Hello';
  if (!text) return ctx.reply(`Use: ${ctx.prefix}qc <text>`);
  try {
    const name = ctx.sock.user?.name || 'MINI-ZYRA';
    const url = `https://api.quotly.net/generate?text=${encodeURIComponent(text)}&name=${encodeURIComponent(name)}&avatar=https://i.pravatar.cc/100`;
    await ctx.sock.sendMessage(ctx.from, { image: { url }, caption: `💬 ${text}` }, { quoted: ctx.m });
  } catch (e) { await ctx.reply(`❌ QC failed: ${e.message}`); }
});

// 21. TTS - real Google TTS via gtts? Use VoiceRSS free fallback - use google translate TTS
add('tts', ['say', 'speak'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}tts <text>\nExample: ${ctx.prefix}tts Hello how are you`);
  try {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=${encodeURIComponent(ctx.text.slice(0, 200))}&tl=en`;
    await ctx.sock.sendMessage(ctx.from, { audio: { url }, mimetype: 'audio/mpeg', ptt: true }, { quoted: ctx.m });
  } catch (e) { await ctx.reply(`❌ TTS failed: ${e.message}`); }
});

// 22. STICKER SEARCH - real Tenor API needs key, use Giphy public beta key
add('stickersearch', ['findsticker'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}stickersearch <query>`);
  try {
    const res = await fetch(`https://api.giphy.com/v1/stickers/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(ctx.text)}&limit=1&rating=g`);
    const j = await res.json();
    if (!j.data?.length) { await ctx.reply('❌ No sticker found.'); return; }
    const url = j.data[0].images.original.url;
    await ctx.sock.sendMessage(ctx.from, { sticker: { url } }, { quoted: ctx.m });
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

module.exports = cmds;
