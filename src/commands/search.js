// ============================================================
// MINI-ZYRA - SEARCH MODULE - ALL IN ONE FILE
// BY FACELESS - NO DEMO - NO SIMULATION - NO PLACEHOLDER
// REAL: Wikipedia, Dictionary, Open-Meteo Weather, DuckDuckGo,
// LRCLIB Lyrics, Translate (MyMemory), News (Google News RSS)
// ============================================================

const cmds = [];
const add = (name, alias, ownerOnly, execute) => cmds.push({ name, alias: alias || [], ownerOnly, execute });

// ---------- 1. AI / GPT - real via Pollinations free AI ----------
add('ai', ['gpt', 'ask', 'chat'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}ai <question>\nExample: ${ctx.prefix}ai What is quantum physics?`);
  await ctx.reply('🤖 Thinking...');
  try {
    const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(ctx.text)}?model=openai`);
    const text = await res.text();
    if (!text || text.length < 2) throw new Error('Empty AI response');
    await ctx.reply(`🤖 *MINI-ZYRA AI*\n\n${text.slice(0, 3500)}`);
  } catch (e) { await ctx.reply(`❌ AI failed: ${e.message}`); }
});

// 2. GOOGLE - real DuckDuckGo Instant Answer + link
add('google', ['search', 'g'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}google <query>`);
  try {
    const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(ctx.text)}&format=json&no_html=1&skip_disambig=1`);
    const j = await res.json();
    const answer = j.AbstractText || j.Answer || '';
    const source = j.AbstractSource || 'DuckDuckGo';
    const url = j.AbstractURL || `https://www.google.com/search?q=${encodeURIComponent(ctx.text)}`;
    await ctx.reply(`🔍 *GOOGLE SEARCH*\n\nQuery: ${ctx.text}\n\n${answer ? `Answer: ${answer.slice(0, 1000)}\n\nSource: ${source}\nLink: ${url}` : `No instant answer.\n\nOpen full results:\nhttps://www.google.com/search?q=${encodeURIComponent(ctx.text)}`}`);
  } catch (e) { await ctx.reply(`❌ Search failed: ${e.message}`); }
});

// 3. WIKI - real Wikipedia REST API
add('wiki', ['wikipedia'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}wiki <topic>`);
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(ctx.text)}`);
    if (res.status === 404) { await ctx.reply(`❌ No Wikipedia page for "${ctx.text}"`); return; }
    const j = await res.json();
    await ctx.reply(`📚 *WIKIPEDIA*\n\nTitle: ${j.title}\n\n${(j.extract || '').slice(0, 1500)}\n\nLink: ${j.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(ctx.text)}`}`);
  } catch (e) { await ctx.reply(`❌ Wiki failed: ${e.message}`); }
});

// 4. DEFINE - real Dictionary API
add('define', ['meaning', 'dict'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}define <word>`);
  const word = ctx.text.split(' ')[0];
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (res.status === 404) { await ctx.reply(`❌ No definition for "${word}"`); return; }
    const j = await res.json();
    const entry = j[0];
    const defs = entry.meanings.slice(0, 3).map(m => `*${m.partOfSpeech}*: ${m.definitions[0]?.definition} ${m.definitions[0]?.example ? `\n  Example: "${m.definitions[0].example}"` : ''}`).join('\n\n');
    await ctx.reply(`📖 *DEFINE: ${word}*\n\nPhonetic: ${entry.phonetic || 'N/A'}\n\n${defs}\n\nSource: dictionaryapi.dev`);
  } catch (e) { await ctx.reply(`❌ Define failed: ${e.message}`); }
});

// 5. TRANSLATE - real MyMemory API
add('translate', ['tr', 'trans'], false, async (ctx) => {
  // .translate en|fr Hello world  OR  .translate fr Hello
  const parts = ctx.text.split(' ');
  if (parts.length < 2) return ctx.reply(`Use: ${ctx.prefix}translate <lang> <text>\nExample: ${ctx.prefix}translate fr Hello how are you\nLangs: fr, es, de, ha, yo, ig, ar, zh, pt, etc.`);
  let target = parts[0].toLowerCase();
  let text = parts.slice(1).join(' ');
  // Support en|fr format
  if (target.includes('|')) { const [from, to] = target.split('|'); target = to; text = parts.slice(1).join(' '); }
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${target}`);
    const j = await res.json();
    const translated = j.responseData?.translatedText;
    if (!translated) throw new Error('No translation');
    await ctx.reply(`🌐 *TRANSLATE to ${target.toUpperCase()}*\n\nOriginal: ${text}\nTranslated: ${translated}`);
  } catch (e) { await ctx.reply(`❌ Translate failed: ${e.message}`); }
});

// 6. WEATHER - real Open-Meteo + Geocoding, no API key
add('weather', ['w'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}weather <city>\nExample: ${ctx.prefix}weather Warri\nExample: ${ctx.prefix}weather Lagos`);
  try {
    const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(ctx.text)}&count=1&language=en&format=json`);
    const gj = await geo.json();
    if (!gj.results?.length) { await ctx.reply(`❌ City "${ctx.text}" not found.`); return; }
    const { latitude, longitude, name, country, admin1 } = gj.results[0];
    const w = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m&timezone=auto`);
    const wj = await w.json();
    const c = wj.current;
    const codes = { 0: 'Clear sky ☀️', 1: 'Mainly clear 🌤️', 2: 'Partly cloudy ⛅', 3: 'Overcast ☁️', 45: 'Fog 🌫️', 48: 'Fog 🌫️', 51: 'Light drizzle 🌦️', 61: 'Rain 🌧️', 71: 'Snow 🌨️', 95: 'Thunderstorm ⛈️' };
    await ctx.reply(`🌤️ *WEATHER: ${name}, ${admin1 || ''} ${country}*\n\nCondition: ${codes[c.weather_code] || `Code ${c.weather_code}`}\nTemp: ${c.temperature_2m}°C (Feels ${c.apparent_temperature}°C)\nHumidity: ${c.relative_humidity_2m}%\nPrecipitation: ${c.precipitation} mm\nWind: ${c.wind_speed_10m} km/h, ${c.wind_direction_10m}°\nTime: ${c.time}\n\nSource: Open-Meteo`);
  } catch (e) { await ctx.reply(`❌ Weather failed: ${e.message}`); }
});

// 7. LYRICS - real LRCLIB API
add('lyrics', ['lyric'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}lyrics <song - artist>\nExample: ${ctx.prefix}lyrics Asake - Why Love`);
  try {
    const res = await fetch(`https://lrclib.net/api/get?track_name=${encodeURIComponent(ctx.text)}&artist_name=&album_name=&duration=`);
    // LRCLIB get needs track+artist, use search instead
    const sres = await fetch(`https://lrclib.net/api/search?track_name=${encodeURIComponent(ctx.text)}`);
    const arr = await sres.json();
    if (!arr?.length) { await ctx.reply(`❌ No lyrics found for "${ctx.text}"`); return; }
    const best = arr[0];
    const lyrics = best.plainLyrics || best.syncedLyrics || '';
    if (!lyrics) { await ctx.reply(`❌ Lyrics not available for "${ctx.text}"`); return; }
    await ctx.reply(`🎵 *LYRICS: ${best.trackName} - ${best.artistName}*\nAlbum: ${best.albumName || 'N/A'}\n\n${lyrics.slice(0, 3500)}`);
  } catch (e) { await ctx.reply(`❌ Lyrics failed: ${e.message}`); }
});

// 8. NEWS - real Google News RSS via fetch
add('news', ['headline'], false, async (ctx) => {
  const topic = ctx.text || 'Nigeria';
  try {
    const res = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(topic)}&hl=en-NG&gl=NG&ceid=NG:en`);
    const xml = await res.text();
    const items = [...xml.matchAll(/<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<pubDate>(.*?)<\/pubDate>/g)].slice(0, 5);
    if (!items.length) { await ctx.reply(`❌ No news for "${topic}"`); return; }
    const cleanXml = (s) => s.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
    await ctx.reply(`📰 *NEWS: ${topic}*\n\n${items.map((m, i) => `${i + 1}. ${cleanXml(m[1])}\n   📅 ${cleanXml(m[3])}\n   🔗 ${cleanXml(m[2])}`).join('\n\n')}`);
  } catch (e) { await ctx.reply(`❌ News failed: ${e.message}`); }
});

// 9. CRYPTO - real CoinGecko free API
add('crypto', ['btc', 'coin'], false, async (ctx) => {
  const coin = (ctx.text || 'bitcoin').toLowerCase().split(' ')[0];
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coin)}&vs_currencies=usd,ngn&include_24hr_change=true`);
    const j = await res.json();
    if (!j[coin]) { await ctx.reply(`❌ Coin "${coin}" not found. Try: bitcoin, ethereum, solana, dogecoin, usdt`); return; }
    const d = j[coin];
    await ctx.reply(`💰 *CRYPTO: ${coin.toUpperCase()}*\n\nUSD: $${d.usd?.toLocaleString()}\nNGN: ₦${d.ngn?.toLocaleString()}\n24h Change: ${d.usd_24h_change?.toFixed(2)}%\n\nSource: CoinGecko`);
  } catch (e) { await ctx.reply(`❌ Crypto failed: ${e.message}`); }
});

// 10. MOVIE - real OMDb needs key, use Wikipedia fallback + IMDb search link
add('movie', ['film'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}movie <movie name>`);
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(ctx.text + ' film')}`);
    const j = await res.json();
    if (j.type === 'disambiguation' || !j.extract) throw new Error('Not found');
    await ctx.reply(`🎬 *MOVIE: ${j.title}*\n\n${j.extract.slice(0, 1500)}\n\nIMDb: https://www.imdb.com/find/?q=${encodeURIComponent(ctx.text)}\nWiki: ${j.content_urls?.desktop?.page || ''}`);
  } catch (e) { await ctx.reply(`🎬 *MOVIE: ${ctx.text}*\n\nSearch:\nIMDb: https://www.imdb.com/find/?q=${encodeURIComponent(ctx.text)}\nGoogle: https://www.google.com/search?q=${encodeURIComponent(ctx.text + ' movie')}`); }
});

// 11. GITHUB - real GitHub API
add('github', ['gh'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}github <username>`);
  const user = ctx.text.split(' ')[0];
  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(user)}`);
    if (res.status === 404) { await ctx.reply(`❌ GitHub user "${user}" not found.`); return; }
    const j = await res.json();
    await ctx.reply(`🐙 *GITHUB: @${j.login}*\n\nName: ${j.name || 'N/A'}\nBio: ${j.bio || 'No bio'}\nFollowers: ${j.followers} | Following: ${j.following}\nRepos: ${j.public_repos}\nLocation: ${j.location || 'N/A'}\nCreated: ${new Date(j.created_at).toLocaleDateString()}\nLink: ${j.html_url}`);
  } catch (e) { await ctx.reply(`❌ GitHub failed: ${e.message}`); }
});

// 12. IP - real ip-api.com
add('ip', ['iplookup'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}ip <ip address>\nExample: ${ctx.prefix}ip 8.8.8.8`);
  const ip = ctx.text.split(' ')[0];
  try {
    const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,query`);
    const j = await res.json();
    if (j.status !== 'success') { await ctx.reply(`❌ IP lookup failed: ${j.message}`); return; }
    await ctx.reply(`🌐 *IP: ${j.query}*\n\nCountry: ${j.country} (${j.countryCode})\nRegion: ${j.regionName}\nCity: ${j.city} ${j.zip}\nCoords: ${j.lat}, ${j.lon}\nTimezone: ${j.timezone}\nISP: ${j.isp}\nOrg: ${j.org}\nAS: ${j.as}`);
  } catch (e) { await ctx.reply(`❌ IP failed: ${e.message}`); }
});

// 13. QURAN / BIBLE - real AlQuran Cloud API
add('quran', ['ayah'], false, async (ctx) => {
  const ref = ctx.text || '1:1';
  try {
    const res = await fetch(`https://api.alquran.cloud/v1/ayah/${encodeURIComponent(ref)}/en.asad`);
    const j = await res.json();
    if (j.code !== 200) { await ctx.reply(`❌ Ayah not found. Use: ${ctx.prefix}quran 2:255`); return; }
    const d = j.data;
    await ctx.reply(`📖 *QURAN ${d.surah.englishName} ${d.surah.number}:${d.numberInSurah}*\n\n${d.text}\n\nSurah: ${d.surah.englishName} - ${d.surah.englishNameTranslation}`);
  } catch (e) { await ctx.reply(`❌ Quran failed: ${e.message}`); }
});

// 14. BIBLE - real bible-api.com
add('bible', ['verse'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}bible <verse>\nExample: ${ctx.prefix}bible John 3:16`);
  try {
    const res = await fetch(`https://bible-api.com/${encodeURIComponent(ctx.text)}`);
    const j = await res.json();
    if (j.error) { await ctx.reply(`❌ ${j.error}`); return; }
    await ctx.reply(`📖 *BIBLE: ${j.reference}*\n\n${j.text}\n\nTranslation: ${j.translation_name || j.translation_id || 'WEB'}`);
  } catch (e) { await ctx.reply(`❌ Bible failed: ${e.message}`); }
});

// 15. JOKE - real Official Joke API
add('joke', ['funny'], false, async (ctx) => {
  try {
    const res = await fetch('https://official-joke-api.appspot.com/random_joke');
    const j = await res.json();
    await ctx.reply(`😂 *JOKE*\n\n${j.setup}\n\n${j.punchline}`);
  } catch (e) { await ctx.reply(`❌ Joke failed: ${e.message}`); }
});

// 16. QUOTE - real Quotable API
add('quote', [], false, async (ctx) => {
  try {
    const res = await fetch('https://api.quotable.io/random');
    const j = await res.json();
    await ctx.reply(`💭 *QUOTE*\n\n"${j.content}"\n\n— ${j.author}`);
  } catch (e) { await ctx.reply(`❌ Quote failed: ${e.message}`); }
});

// 17. FACT - real Useless Facts API
add('fact', [], false, async (ctx) => {
  try {
    const res = await fetch('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en');
    const j = await res.json();
    await ctx.reply(`🧠 *FACT*\n\n${j.text}\n\nSource: ${j.source || 'uselessfacts'}`);
  } catch (e) { await ctx.reply(`❌ Fact failed: ${e.message}`); }
});

module.exports = cmds;
