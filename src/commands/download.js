// ============================================================
// MINI-ZYRA - DOWNLOAD MODULE - ALL IN ONE FILE
// BY FACELESS - NO DEMO - NO SIMULATION - NO PLACEHOLDER
// REAL: yt-dlp for YouTube/FB/X/Pinterest + TikWM API for TikTok
// Requires: apt install yt-dlp  OR  npm i -g yt-dlp
// ============================================================
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const tmpDir = path.join(__dirname, '../../tmp');
fs.ensureDirSync(tmpDir);

function run(cmd, timeout = 120000) {
  return execAsync(cmd, { timeout, maxBuffer: 1024 * 1024 * 50 });
}
function isUrl(t) { return /^https?:\/\//i.test(t || ''); }
async function cleanTmp(file) { try { await fs.remove(file); } catch {} }

const cmds = [];
const add = (name, alias, ownerOnly, execute) => cmds.push({ name, alias: alias || [], ownerOnly, execute });

// ---------- 1. SONG / PLAY - real yt-dlp search + mp3 ----------
add('song', ['play', 'ytmp3', 'mp3'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}song <song name or YouTube link>`);
  const query = isUrl(ctx.text) ? ctx.text : `ytsearch1:${ctx.text}`;
  const out = path.join(tmpDir, `song_${Date.now()}.mp3`);
  await ctx.reply('🎵 Downloading song... please wait.');
  try {
    await run(`yt-dlp -x --audio-format mp3 --audio-quality 128K -o "${out}" "${query.replace(/"/g, '')}"`);
    const stat = await fs.stat(out).catch(() => null);
    if (!stat || stat.size < 1000) throw new Error('Download failed - file empty');
    if (stat.size > 16 * 1024 * 1024) { await ctx.reply('❌ Audio too big for WhatsApp (>16MB). Try shorter song.'); await cleanTmp(out); return; }
    await ctx.sock.sendMessage(ctx.from, { audio: { url: out }, mimetype: 'audio/mpeg', fileName: `MINI-ZYRA_${Date.now()}.mp3` }, { quoted: ctx.m });
    await cleanTmp(out);
  } catch (e) { await cleanTmp(out); await ctx.reply(`❌ Song failed: ${e.message}\nMake sure yt-dlp is installed on server.`); }
});

// 2. VIDEO / YTMP4 - real yt-dlp mp4 max 720p
add('video', ['ytmp4', 'mp4', 'ytv'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}video <video name or YouTube link>`);
  const query = isUrl(ctx.text) ? ctx.text : `ytsearch1:${ctx.text}`;
  const out = path.join(tmpDir, `video_${Date.now()}.mp4`);
  await ctx.reply('🎬 Downloading video... please wait.');
  try {
    await run(`yt-dlp -f "mp4[height<=720]/best[height<=720]" -o "${out}" "${query.replace(/"/g, '')}"`);
    const stat = await fs.stat(out).catch(() => null);
    if (!stat || stat.size < 1000) throw new Error('Download failed');
    if (stat.size > 16 * 1024 * 1024) { await ctx.reply('❌ Video too big for WhatsApp (>16MB). Try .ytmp4 with shorter video.'); await cleanTmp(out); return; }
    await ctx.sock.sendMessage(ctx.from, { video: { url: out }, caption: `🎬 MINI-ZYRA\n${ctx.text}`, mimetype: 'video/mp4' }, { quoted: ctx.m });
    await cleanTmp(out);
  } catch (e) { await cleanTmp(out); await ctx.reply(`❌ Video failed: ${e.message}`); }
});

// 3. YTINFO - real yt-dlp json
add('ytinfo', ['ytdetails'], false, async (ctx) => {
  if (!ctx.text || !isUrl(ctx.text)) return ctx.reply(`Use: ${ctx.prefix}ytinfo <YouTube link>`);
  try {
    const { stdout } = await run(`yt-dlp --dump-json --no-playlist "${ctx.text.replace(/"/g, '')}"`);
    const j = JSON.parse(stdout);
    await ctx.reply(`🎬 *YT INFO*\n\nTitle: ${j.title}\nChannel: ${j.uploader}\nDuration: ${Math.floor((j.duration || 0) / 60)}:${String((j.duration || 0) % 60).padStart(2, '0')}\nViews: ${j.view_count || 'N/A'}\nLikes: ${j.like_count || 'N/A'}\nUpload: ${j.upload_date || 'N/A'}\nDesc: ${(j.description || '').slice(0, 300)}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 4. TIKTOK - real TikWM API, no login
add('tiktok', ['ttdl', 'tt'], false, async (ctx) => {
  if (!ctx.text || !isUrl(ctx.text)) return ctx.reply(`Use: ${ctx.prefix}tiktok <TikTok link>`);
  await ctx.reply('🎵 Downloading TikTok... please wait.');
  try {
    const res = await fetch(`https://api.tikwm.com/api/?url=${encodeURIComponent(ctx.text)}`);
    const j = await res.json();
    if (j.code !== 0 || !j.data) throw new Error('TikTok API failed');
    const d = j.data;
    const caption = `🎵 *TIKTOK*\n\nAuthor: @${d.author?.unique_id || 'unknown'}\nTitle: ${(d.title || '').slice(0, 200)}\nLikes: ${d.digg_count}\nComments: ${d.comment_count}\nViews: ${d.play_count}`;
    const videoUrl = d.play || d.wmplay;
    if (!videoUrl) throw new Error('No video URL');
    await ctx.sock.sendMessage(ctx.from, { video: { url: videoUrl }, caption, mimetype: 'video/mp4' }, { quoted: ctx.m });
  } catch (e) { await ctx.reply(`❌ TikTok failed: ${e.message}`); }
});

// 5. TIKTOK MP3 - real audio from TikWM
add('ttmp3', ['tiktokmp3', 'ttaudio'], false, async (ctx) => {
  if (!ctx.text || !isUrl(ctx.text)) return ctx.reply(`Use: ${ctx.prefix}ttmp3 <TikTok link>`);
  try {
    const res = await fetch(`https://api.tikwm.com/api/?url=${encodeURIComponent(ctx.text)}`);
    const j = await res.json();
    if (j.code !== 0) throw new Error('API failed');
    const audio = j.data?.music_info?.play;
    if (!audio) throw new Error('No audio found');
    await ctx.sock.sendMessage(ctx.from, { audio: { url: audio }, mimetype: 'audio/mpeg', fileName: 'tiktok.mp3' }, { quoted: ctx.m });
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 6. FACEBOOK - real yt-dlp
add('fb', ['fbdl', 'facebook'], false, async (ctx) => {
  if (!ctx.text || !isUrl(ctx.text)) return ctx.reply(`Use: ${ctx.prefix}fb <Facebook video link>`);
  const out = path.join(tmpDir, `fb_${Date.now()}.mp4`);
  await ctx.reply('📘 Downloading Facebook video...');
  try {
    await run(`yt-dlp -f "mp4/best" -o "${out}" "${ctx.text.replace(/"/g, '')}"`);
    const stat = await fs.stat(out).catch(() => null);
    if (!stat || stat.size < 1000) throw new Error('Download failed - video may be private');
    if (stat.size > 16 * 1024 * 1024) { await ctx.reply('❌ Video too big (>16MB)'); await cleanTmp(out); return; }
    await ctx.sock.sendMessage(ctx.from, { video: { url: out }, caption: '📘 MINI-ZYRA FB', mimetype: 'video/mp4' }, { quoted: ctx.m });
    await cleanTmp(out);
  } catch (e) { await cleanTmp(out); await ctx.reply(`❌ FB failed: ${e.message}`); }
});

// 7. INSTAGRAM - real yt-dlp
add('insta', ['igdl', 'ig', 'instagram'], false, async (ctx) => {
  if (!ctx.text || !isUrl(ctx.text)) return ctx.reply(`Use: ${ctx.prefix}insta <Instagram link>`);
  const out = path.join(tmpDir, `ig_${Date.now()}.mp4`);
  await ctx.reply('📸 Downloading Instagram...');
  try {
    await run(`yt-dlp -f "mp4/best" -o "${out}" "${ctx.text.replace(/"/g, '')}"`);
    const stat = await fs.stat(out).catch(() => null);
    if (!stat || stat.size < 1000) throw new Error('Download failed - post may be private / login required');
    if (stat.size > 16 * 1024 * 1024) { await ctx.reply('❌ Too big (>16MB)'); await cleanTmp(out); return; }
    await ctx.sock.sendMessage(ctx.from, { video: { url: out }, caption: '📸 MINI-ZYRA IG', mimetype: 'video/mp4' }, { quoted: ctx.m });
    await cleanTmp(out);
  } catch (e) { await cleanTmp(out); await ctx.reply(`❌ IG failed: ${e.message}`); }
});

// 8. TWITTER / X - real yt-dlp
add('twitter', ['xdl', 'x', 'twdl'], false, async (ctx) => {
  if (!ctx.text || !isUrl(ctx.text)) return ctx.reply(`Use: ${ctx.prefix}twitter <X / Twitter link>`);
  const out = path.join(tmpDir, `x_${Date.now()}.mp4`);
  await ctx.reply('𝕏 Downloading X video...');
  try {
    await run(`yt-dlp -f "mp4/best" -o "${out}" "${ctx.text.replace(/"/g, '')}"`);
    const stat = await fs.stat(out).catch(() => null);
    if (!stat || stat.size < 1000) throw new Error('Download failed');
    if (stat.size > 16 * 1024 * 1024) { await ctx.reply('❌ Too big (>16MB)'); await cleanTmp(out); return; }
    await ctx.sock.sendMessage(ctx.from, { video: { url: out }, caption: '𝕏 MINI-ZYRA X', mimetype: 'video/mp4' }, { quoted: ctx.m });
    await cleanTmp(out);
  } catch (e) { await cleanTmp(out); await ctx.reply(`❌ X failed: ${e.message}`); }
});

// 9. PINTEREST - real yt-dlp
add('pinterest', ['pindl', 'pin'], false, async (ctx) => {
  if (!ctx.text || !isUrl(ctx.text)) return ctx.reply(`Use: ${ctx.prefix}pinterest <Pinterest link>`);
  const out = path.join(tmpDir, `pin_${Date.now()}.mp4`);
  await ctx.reply('📌 Downloading Pinterest...');
  try {
    await run(`yt-dlp -f "mp4/best" -o "${out}" "${ctx.text.replace(/"/g, '')}"`);
    const stat = await fs.stat(out).catch(() => null);
    if (!stat || stat.size < 1000) throw new Error('Download failed');
    await ctx.sock.sendMessage(ctx.from, { video: { url: out }, caption: '📌 MINI-ZYRA PIN', mimetype: 'video/mp4' }, { quoted: ctx.m });
    await cleanTmp(out);
  } catch (e) { await cleanTmp(out); await ctx.reply(`❌ Pin failed: ${e.message}`); }
});

// 10. IMAGE - real download image from direct link
add('image', ['imgdl', 'getimage'], false, async (ctx) => {
  if (!ctx.text || !isUrl(ctx.text)) return ctx.reply(`Use: ${ctx.prefix}image <direct image link>`);
  try {
    await ctx.sock.sendMessage(ctx.from, { image: { url: ctx.text }, caption: '🖼️ MINI-ZYRA IMAGE' }, { quoted: ctx.m });
  } catch (e) { await ctx.reply(`❌ Image failed: ${e.message}`); }
});

// 11. MEDIAFIRE - real direct file download via fetch + send as document
add('mediafire', ['mfdl'], false, async (ctx) => {
  if (!ctx.text || !isUrl(ctx.text)) return ctx.reply(`Use: ${ctx.prefix}mediafire <MediaFire link>`);
  await ctx.reply('📁 MediaFire: Use yt-dlp method - trying direct...');
  try {
    const out = path.join(tmpDir, `mf_${Date.now()}.bin`);
    await run(`yt-dlp -o "${out}" "${ctx.text.replace(/"/g, '')}"`);
    const stat = await fs.stat(out).catch(() => null);
    if (!stat || stat.size < 1000) throw new Error('Download failed');
    await ctx.sock.sendMessage(ctx.from, { document: { url: out }, fileName: `mediafire_${Date.now()}`, mimetype: 'application/octet-stream', caption: '📁 MINI-ZYRA MediaFire' }, { quoted: ctx.m });
    await cleanTmp(out);
  } catch (e) { await cleanTmp(out); await ctx.reply(`❌ MediaFire failed: ${e.message}`); }
});

// 12. APK - real search via yt-dlp? No - use real APK site search link
add('apk', ['apkdl'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}apk <app name>\nExample: ${ctx.prefix}apk whatsapp`);
  await ctx.reply(`📱 *APK SEARCH*\n\nApp: ${ctx.text}\n\nSearch here (real links):\n• APKPure: https://apkpure.com/search?q=${encodeURIComponent(ctx.text)}\n• APKMirror: https://www.apkmirror.com/?post_type=app_release&searchtype=apk&s=${encodeURIComponent(ctx.text)}`);
});

module.exports = cmds;
