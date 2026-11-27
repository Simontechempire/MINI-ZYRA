// ============================================================
// MINI-ZYRA - RELIGION MODULE - ALL IN ONE FILE
// BY FACELESS - NO DEMO - NO SIMULATION - NO PLACEHOLDER
// REAL: AlQuran Cloud, Bible-API, Aladhan Prayer Times, Hadith API
// ============================================================

const cmds = [];
const add = (name, alias, ownerOnly, execute) => cmds.push({ name, alias: alias || [], ownerOnly, execute });

// ---------- ISLAM ----------

// 1. QURAN AYAH - real AlQuran Cloud
add('quran2', ['ayah2', 'quranayah'], false, async (ctx) => {
  const ref = ctx.text || '1:1';
  try {
    const res = await fetch(`https://api.alquran.cloud/v1/ayah/${encodeURIComponent(ref)}/en.asad`);
    const j = await res.json();
    if (j.code !== 200) return ctx.reply(`❌ Ayah not found. Use: ${ctx.prefix}quran2 2:255`);
    const d = j.data;
    await ctx.reply(`📖 *QURAN - ${d.surah.englishName} ${d.surah.number}:${d.numberInSurah}*\n\n${d.text}\n\nSurah: ${d.surah.englishName} - ${d.surah.englishNameTranslation}\nRevelation: ${d.surah.revelationType}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 2. QURAN ARABIC - real Arabic text
add('quranarabic', ['quranar'], false, async (ctx) => {
  const ref = ctx.text || '1:1';
  try {
    const res = await fetch(`https://api.alquran.cloud/v1/ayah/${encodeURIComponent(ref)}`);
    const j = await res.json();
    if (j.code !== 200) return ctx.reply(`❌ Ayah not found. Use: ${ctx.prefix}quranarabic 2:255`);
    const d = j.data;
    await ctx.reply(`📖 *QURAN ARABIC - ${d.surah.englishName} ${d.surah.number}:${d.numberInSurah}*\n\n${d.text}\n\nSurah: ${d.surah.englishName}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 3. QURAN AUDIO - real audio from AlQuran Cloud CDN
add('quranaudio', ['quranmp3'], false, async (ctx) => {
  const ref = ctx.text || '1:1';
  try {
    const res = await fetch(`https://api.alquran.cloud/v1/ayah/${encodeURIComponent(ref)}/ar.alafasy`);
    const j = await res.json();
    if (j.code !== 200) return ctx.reply(`❌ Ayah not found.`);
    const audio = j.data.audio;
    await ctx.sock.sendMessage(ctx.from, { audio: { url: audio }, mimetype: 'audio/mpeg', fileName: `quran_${ref.replace(':', '_')}.mp3` }, { quoted: ctx.m });
    await ctx.reply(`📖 Quran ${j.data.surah.englishName} ${j.data.surah.number}:${j.data.numberInSurah} - Mishary Alafasy`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 4. SURAH INFO - real Surah list
add('surah', ['surahinfo'], false, async (ctx) => {
  const num = parseInt(ctx.args[0]);
  if (isNaN(num) || num < 1 || num > 114) return ctx.reply(`Use: ${ctx.prefix}surah <1-114>\nExample: ${ctx.prefix}surah 2`);
  try {
    const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}`);
    const j = await res.json();
    if (j.code !== 200) return ctx.reply('❌ Surah not found.');
    const d = j.data;
    await ctx.reply(`📖 *SURAH ${d.number}: ${d.englishName} (${d.name})*\n\nMeaning: ${d.englishNameTranslation}\nRevelation: ${d.revelationType}\nAyahs: ${d.numberOfAyahs}\n\nFirst Ayah:\n${d.ayahs[0]?.text || ''}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 5. SURAH LIST - real all 114
add('surahlist', ['allsurah'], false, async (ctx) => {
  try {
    const res = await fetch('https://api.alquran.cloud/v1/meta');
    const j = await res.json();
    const surahs = j.data.surahs.references;
    await ctx.reply(`📖 *ALL SURAHS (114)*\n\n${surahs.slice(0, 50).map(s => `${s.number}. ${s.englishName} - ${s.englishNameTranslation}`).join('\n')}\n\n... Use ${ctx.prefix}surah <number> for details`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 6. HADITH - real Hadith API (Sunnah.com via hadithapi.com needs key, use random hadith from free API)
add('hadith', [], false, async (ctx) => {
  const book = (ctx.args[0] || 'bukhari').toLowerCase();
  const valid = ['bukhari', 'muslim', 'tirmidhi', 'abudawud', 'nasai', 'ibnmajah'];
  const use = valid.includes(book) ? book : 'bukhari';
  try {
    // Free random hadith API - hadithapi.com public endpoint
    const res = await fetch(`https://api.hadith.gading.dev/books/${use}?range=1-5`);
    const j = await res.json();
    if (!j.data?.hadiths?.length) throw new Error('No hadith');
    const h = j.data.hadiths[Math.floor(Math.random() * j.data.hadiths.length)];
    await ctx.reply(`📜 *HADITH - ${use.toUpperCase()} #${h.number}*\n\nArabic:\n${h.arab?.slice(0, 500) || ''}\n\nEnglish:\n${h.id || ''}\n\nBook: ${j.data.name || use}`);
  } catch (e) {
    // Fallback - real well-known hadiths list
    const list = [
      'Actions are but by intentions, and every man shall have only that which he intended. - Bukhari',
      'None of you truly believes until he loves for his brother what he loves for himself. - Bukhari & Muslim',
      'The best among you are those who learn the Quran and teach it. - Bukhari',
      'Kindness is not found in anything except that it adds beauty to it. - Muslim',
      'Whoever believes in Allah and the Last Day, let him speak good or remain silent. - Bukhari'
    ];
    await ctx.reply(`📜 *HADITH*\n\n${list[Math.floor(Math.random() * list.length)]}`);
  }
});

// 7. PRAYER TIMES - real Aladhan API, Lagos default
add('prayer', ['prayertime', 'salah'], false, async (ctx) => {
  const city = ctx.text || 'Lagos';
  const country = 'Nigeria';
  try {
    const res = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=5`);
    const j = await res.json();
    if (j.code !== 200) return ctx.reply(`❌ City not found: ${city}`);
    const t = j.data.timings;
    const date = j.data.date.readable;
    const hijri = j.data.date.hijri;
    await ctx.reply(`🕌 *PRAYER TIMES - ${city}, ${country}*\n\n📅 ${date}\nHijri: ${hijri.day} ${hijri.month.en} ${hijri.year} AH\n\nFajr: ${t.Fajr}\nSunrise: ${t.Sunrise}\nDhuhr: ${t.Dhuhr}\nAsr: ${t.Asr}\nMaghrib: ${t.Maghrib}\nIsha: ${t.Isha}\n\nMethod: Muslim World League`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 8. PRAYER NIGERIA CITIES - shortcut
add('prayerng', [], false, async (ctx) => {
  const cities = ['Lagos', 'Abuja', 'Kano', 'Warri', 'Ibadan', 'Port Harcourt', 'Kaduna', 'Enugu'];
  const city = ctx.text || 'Warri';
  if (!cities.map(c => c.toLowerCase()).includes(city.toLowerCase())) return ctx.reply(`Cities: ${cities.join(', ')}\nUse: ${ctx.prefix}prayerng <city>`);
  try {
    const res = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=Nigeria&method=5`);
    const j = await res.json();
    const t = j.data.timings;
    await ctx.reply(`🕌 *PRAYER - ${city}*\n\nFajr: ${t.Fajr} | Dhuhr: ${t.Dhuhr} | Asr: ${t.Asr} | Maghrib: ${t.Maghrib} | Isha: ${t.Isha}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 9. QIBLA - real direction via Aladhan
add('qibla', [], false, async (ctx) => {
  const lat = parseFloat(ctx.args[0]) || 6.5244; // Lagos default
  const lon = parseFloat(ctx.args[1]) || 3.3792;
  try {
    const res = await fetch(`https://api.aladhan.com/v1/qibla/${lat}/${lon}`);
    const j = await res.json();
    await ctx.reply(`🧭 *QIBLA*\n\nFrom: ${lat}, ${lon}\nDirection: ${j.data.direction}° from North\n\nFace ${j.data.direction}° to pray towards Kaaba.`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// ---------- CHRISTIANITY ----------

// 10. BIBLE VERSE - real bible-api.com
add('bible2', ['verse2'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}bible2 <verse>\nExample: ${ctx.prefix}bible2 John 3:16`);
  try {
    const res = await fetch(`https://bible-api.com/${encodeURIComponent(ctx.text)}`);
    const j = await res.json();
    if (j.error) return ctx.reply(`❌ ${j.error}`);
    await ctx.reply(`📖 *BIBLE: ${j.reference}*\n\n${j.text}\n\nTranslation: ${j.translation_name || j.translation_id || 'WEB'}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 11. BIBLE RANDOM - real random verse
add('bibleverse', ['randomverse'], false, async (ctx) => {
  const verses = ['John 3:16', 'Psalm 23:1', 'Jeremiah 29:11', 'Philippians 4:13', 'Romans 8:28', 'Proverbs 3:5', 'Isaiah 41:10', 'Matthew 11:28', 'Psalm 46:1', 'Romans 10:9'];
  const pick = verses[Math.floor(Math.random() * verses.length)];
  try {
    const res = await fetch(`https://bible-api.com/${encodeURIComponent(pick)}`);
    const j = await res.json();
    await ctx.reply(`📖 *BIBLE: ${j.reference}*\n\n${j.text}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 12. BIBLE CHAPTER - real full chapter via bible-api
add('biblechapter', [], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}biblechapter <Book Chapter>\nExample: ${ctx.prefix}biblechapter Psalm 23`);
  try {
    const res = await fetch(`https://bible-api.com/${encodeURIComponent(ctx.text)}`);
    const j = await res.json();
    if (j.error) return ctx.reply(`❌ ${j.error}`);
    await ctx.reply(`📖 *BIBLE: ${j.reference}*\n\n${j.text.slice(0, 3500)}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 13. DEVOTIONAL - real daily verse + message
add('devotional', ['devotion'], false, async (ctx) => {
  const verses = [
    { ref: 'Jeremiah 29:11', msg: 'God has a plan for you - a plan to prosper you, not to harm you.' },
    { ref: 'Psalm 46:1', msg: 'God is your refuge and strength, an ever-present help in trouble.' },
    { ref: 'Isaiah 41:10', msg: 'Do not fear, for God is with you. Do not be dismayed, He will strengthen you.' },
  ];
  const v = verses[Math.floor(Math.random() * verses.length)];
  try {
    const res = await fetch(`https://bible-api.com/${encodeURIComponent(v.ref)}`);
    const j = await res.json();
    await ctx.reply(`🙏 *DEVOTIONAL*\n\n${v.msg}\n\n📖 ${j.reference}:\n${j.text}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 14. PRAYER CHRISTIAN - real list
add('christianprayer', ['prayerchristian'], false, async (ctx) => {
  const prayers = [
    'Our Father, who art in heaven, hallowed be thy name. Thy kingdom come, thy will be done, on earth as it is in heaven.',
    'Lord, grant me the serenity to accept the things I cannot change, courage to change the things I can, and wisdom to know the difference.',
    'Dear God, thank you for this day, for my family, for my health. Guide my steps and protect me. Amen.'
  ];
  await ctx.reply(`🙏 *CHRISTIAN PRAYER*\n\n${prayers[Math.floor(Math.random() * prayers.length)]}`);
});

// 15. DUA - real Islamic duas list
add('dua', ['islamicdua'], false, async (ctx) => {
  const duas = [
    { title: 'Before Eating', arab: 'Bismillah wa ala barakatillah', eng: 'In the name of Allah and upon His blessings.' },
    { title: 'For Knowledge', arab: 'Rabbi zidni ilma', eng: 'My Lord, increase me in knowledge.' },
    { title: 'For Parents', arab: 'Rabbir hamhuma kama rabbayani sagheera', eng: 'My Lord, have mercy on them as they raised me when I was small.' },
    { title: 'For Forgiveness', arab: 'Astaghfirullah al-azeem', eng: 'I seek forgiveness from Allah, the Almighty.' },
  ];
  const d = duas[Math.floor(Math.random() * duas.length)];
  await ctx.reply(`🤲 *DUA - ${d.title}*\n\nArabic: ${d.arab}\nMeaning: ${d.eng}`);
});

// 16. NAMES OF ALLAH - real 99 names list (first 20 + full link)
add('allah99', ['namesofallah'], false, async (ctx) => {
  const names = ['Ar-Rahman - The Most Gracious', 'Ar-Rahim - The Most Merciful', 'Al-Malik - The King', 'Al-Quddus - The Most Holy', 'As-Salam - The Source of Peace', 'Al-Mumin - The Giver of Faith', 'Al-Muhaymin - The Guardian', 'Al-Aziz - The Almighty', 'Al-Jabbar - The Compeller', 'Al-Mutakabbir - The Supreme', 'Al-Khaliq - The Creator', 'Al-Bari - The Originator', 'Al-Musawwir - The Fashioner', 'Al-Ghaffar - The Great Forgiver', 'Al-Qahhar - The Irresistible', 'Al-Wahhab - The Supreme Bestower', 'Ar-Razzaq - The Provider', 'Al-Fattah - The Opener', 'Al-Alim - The All-Knowing', 'Al-Qabid - The Withholder'];
  await ctx.reply(`☪️ *99 NAMES OF ALLAH (1-20)*\n\n${names.map((n, i) => `${i + 1}. ${n}`).join('\n')}\n\nFull list: https://99namesofallah.name/`);
});

module.exports = cmds;
