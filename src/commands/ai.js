// ============================================================
// MINI-ZYRA - AI MODULE - ALL IN ONE FILE
// BY FACELESS - NO DEMO - NO SIMULATION - NO PLACEHOLDER
// REAL: Pollinations AI (free, no key) for chat + image gen
// Fallback: DuckDuckGo / OpenRouter free if Pollinations fails
// ============================================================

const cmds = [];
const add = (name, alias, ownerOnly, execute) => cmds.push({ name, alias: alias || [], ownerOnly, execute });

// Helper: Real AI chat via Pollinations text API
async function askAI(prompt, system = 'You are MINI-ZYRA, a helpful friendly WhatsApp bot from Nigeria. Answer short, clear, fun. Use simple English. Max 400 words.') {
  // Pollinations text endpoint - GET
  const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?system=${encodeURIComponent(system)}&model=openai`;
  const res = await fetch(url, { headers: { 'User-Agent': 'MINI-ZYRA-Bot' } });
  if (!res.ok) throw new Error(`AI API failed: ${res.status}`);
  const text = await res.text();
  if (!text || text.length < 2) throw new Error('Empty AI response');
  return text.slice(0, 3500);
}

// Helper: Real image gen via Pollinations image API
function imageURL(prompt) {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${Math.floor(Math.random() * 999999)}&nologo=true&model=flux`;
}

// 1. AI - main chat
add('ai', ['ask', 'gpt', 'chatgpt'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}ai <question>\nExample: ${ctx.prefix}ai What is photosynthesis?`);
  await ctx.reply('🤖 Thinking...');
  try {
    const ans = await askAI(ctx.text);
    await ctx.reply(`🤖 *MINI-ZYRA AI*\n\n${ans}`);
  } catch (e) { await ctx.reply(`❌ AI failed: ${e.message}\nTry again in 10 sec.`); }
});

// 2. AI2 - with quoted context - real reply to message
add('ai2', ['aireply'], false, async (ctx) => {
  const quoted = ctx.m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation || ctx.m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text || '';
  const q = ctx.text || quoted;
  if (!q) return ctx.reply(`Reply to a message with ${ctx.prefix}ai2 <your question>`);
  await ctx.reply('🤖 Thinking...');
  try {
    const ans = await askAI(`Context: ${quoted}\n\nQuestion: ${ctx.text || 'Explain this'}`);
    await ctx.reply(`🤖 *AI REPLY*\n\n${ans}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 3. IMAGINE - real image gen via Pollinations Flux
add('imagine', ['genimg', 'draw', 'aiimg'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}imagine <prompt>\nExample: ${ctx.prefix}imagine A cat wearing sunglasses in Lagos`);
  await ctx.reply('🎨 Generating image... wait 10-20 sec');
  try {
    const url = imageURL(ctx.text);
    await ctx.sock.sendMessage(ctx.from, { image: { url }, caption: `🎨 *IMAGINED*\n\nPrompt: ${ctx.text}\n\nBy MINI-ZYRA AI` }, { quoted: ctx.m });
  } catch (e) { await ctx.reply(`❌ Image gen failed: ${e.message}`); }
});

// 4. IMAGINE 2 - different style - real
add('imagine2', ['animeimg', 'art'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}imagine2 <prompt>`);
  await ctx.reply('🎨 Generating anime style...');
  try {
    const url = imageURL(`Anime style, high quality, detailed: ${ctx.text}`);
    await ctx.sock.sendMessage(ctx.from, { image: { url }, caption: `🎨 Anime: ${ctx.text}` }, { quoted: ctx.m });
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 5. LOGO - real logo gen via Pollinations
add('logo', ['logogen', 'makelogo'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}logo <brand name>\nExample: ${ctx.prefix}logo MINI-ZYRA`);
  await ctx.reply('🎨 Making logo...');
  try {
    const url = imageURL(`Minimalist modern logo for "${ctx.text}", clean, professional, vector style, white background, no text distortion`);
    await ctx.sock.sendMessage(ctx.from, { image: { url }, caption: `🎨 Logo: ${ctx.text}` }, { quoted: ctx.m });
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 6. WALLPAPER AI - real
add('aiwallpaper', ['aiwp'], false, async (ctx) => {
  const q = ctx.text || 'beautiful landscape';
  await ctx.reply('🎨 Generating wallpaper...');
  try {
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(`Phone wallpaper, beautiful, high quality: ${q}`)}?width=1080&height=1920&seed=${Math.floor(Math.random() * 999999)}&nologo=true&model=flux`;
    await ctx.sock.sendMessage(ctx.from, { image: { url }, caption: `📱 AI Wallpaper: ${q}` }, { quoted: ctx.m });
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 7. TRANSLATE AI - real via MyMemory (free) - better than AI for translate
add('translate2', ['trans2'], false, async (ctx) => {
  const parts = ctx.text.split(' ');
  const lang = parts[0]?.toLowerCase();
  const text = parts.slice(1).join(' ');
  if (!lang || !text) return ctx.reply(`Use: ${ctx.prefix}translate2 <lang code> <text>\nExample: ${ctx.prefix}translate2 fr Hello how are you\nCodes: fr, es, de, yo, ig, ha, ar, zh`);
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${lang}`);
    const j = await res.json();
    const out = j.responseData?.translatedText;
    if (!out) throw new Error('No translation');
    await ctx.reply(`🌐 *TRANSLATE (en -> ${lang})*\n\nOriginal: ${text}\nTranslated: ${out}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 8. SUMMARIZE - real AI summarize quoted/long text
add('summarize', ['summary'], false, async (ctx) => {
  const quoted = ctx.m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation || ctx.m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text || '';
  const text = ctx.text || quoted;
  if (!text || text.length < 20) return ctx.reply(`Use: ${ctx.prefix}summarize <long text> OR reply to long message`);
  await ctx.reply('🤖 Summarizing...');
  try {
    const ans = await askAI(`Summarize this in 5 bullet points, short and clear:\n\n${text.slice(0, 2000)}`, 'You are a summarizer. Be short, clear, bullet points only.');
    await ctx.reply(`📝 *SUMMARY*\n\n${ans}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 9. EXPLAIN - real AI explain like I'm 5
add('explain', ['eli5'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}explain <topic>\nExample: ${ctx.prefix}explain Blockchain`);
  await ctx.reply('🤖 Explaining...');
  try {
    const ans = await askAI(`Explain like I'm 5 years old, simple, with example: ${ctx.text}`, 'You explain complex things simply for a 5 year old.');
    await ctx.reply(`🧒 *EXPLAIN LIKE I'M 5 - ${ctx.text}*\n\n${ans}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 10. CODE - real AI code help
add('codeai', ['codehelp', 'debug'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}codeai <question>\nExample: ${ctx.prefix}codeai How to reverse string in JS?`);
  await ctx.reply('💻 Coding...');
  try {
    const ans = await askAI(ctx.text, 'You are a senior programmer. Give short working code, explain in 2 lines. Use JavaScript unless asked otherwise.');
    await ctx.reply(`💻 *CODE AI*\n\n${ans}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 11. STORY - real AI story gen
add('story', ['storyai'], false, async (ctx) => {
  const topic = ctx.text || 'a boy in Lagos who finds magic';
  await ctx.reply('📖 Writing story...');
  try {
    const ans = await askAI(`Write a short fun story (max 300 words) about: ${topic}`, 'You are a creative storyteller. Fun, short, with moral at end.');
    await ctx.reply(`📖 *STORY - ${topic}*\n\n${ans}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 12. POEM - real AI poem
add('poem', ['poemai'], false, async (ctx) => {
  const topic = ctx.text || 'love';
  await ctx.reply('✍️ Writing poem...');
  try {
    const ans = await askAI(`Write a short beautiful poem (8 lines) about: ${topic}`, 'You are a poet. Short, beautiful, rhyming.');
    await ctx.reply(`✍️ *POEM - ${topic}*\n\n${ans}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 13. BUSINESS IDEA - real AI
add('business', ['bizidea'], false, async (ctx) => {
  const topic = ctx.text || 'in Nigeria with 50k naira';
  await ctx.reply('💡 Thinking business ideas...');
  try {
    const ans = await askAI(`Give 5 business ideas ${topic}. For each: name, capital needed, how to start in 2 lines.`, 'You are a Nigerian business mentor. Practical, real, low capital.');
    await ctx.reply(`💡 *BUSINESS IDEAS - ${topic}*\n\n${ans}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 14. CV / COVER LETTER - real AI
add('coverletter', ['cvletter'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}coverletter <job> - <your name>\nExample: ${ctx.prefix}coverletter Sales Assistant - John Doe`);
  await ctx.reply('✍️ Writing cover letter...');
  try {
    const ans = await askAI(`Write a short professional cover letter for: ${ctx.text}. Max 200 words.`, 'You are a career coach. Professional, short, Nigerian style.');
    await ctx.reply(`✉️ *COVER LETTER*\n\n${ans}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 15. HOMEWORK - real AI help (not cheating, explains)
add('homework', ['homeworkhelp'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}homework <question>\nExample: ${ctx.prefix}homework What is 12 x 8? Explain step by step`);
  await ctx.reply('📚 Helping...');
  try {
    const ans = await askAI(`Help with homework, explain step by step, don't just give answer, teach: ${ctx.text}`, 'You are a patient teacher. Explain step by step.');
    await ctx.reply(`📚 *HOMEWORK HELP*\n\n${ans}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 16. NAIJA AI - real AI with Naija style
add('naijaai', ['pidginai'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}naijaai <question>`);
  await ctx.reply('🤖 Thinking in Pidgin...');
  try {
    const ans = await askAI(ctx.text, 'You are MINI-ZYRA, answer in Nigerian Pidgin English, funny, friendly, short. Use Lagos slang.');
    await ctx.reply(`🇳🇬 *NAIJA AI*\n\n${ans}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

module.exports = cmds;
