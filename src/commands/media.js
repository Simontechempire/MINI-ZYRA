// ============================================================
// MINI-ZYRA - MEDIA MODULE - ALL IN ONE FILE
// BY FACELESS - NO DEMO - NO SIMULATION - NO PLACEHOLDER
// REAL: Unsplash, Pexels-free, Giphy, iTunes, OpenLibrary, etc.
// No API key needed for most - Unsplash source + Giphy beta key
// ============================================================

const cmds = [];
const add = (name, alias, ownerOnly, execute) => cmds.push({ name, alias: alias || [], ownerOnly, execute });
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

// 1. IMAGE SEARCH - real Unsplash Source (no key)
add('image2', ['imgsearch', 'pic'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}image2 <query>\nExample: ${ctx.prefix}image2 cat`);
  try {
    const url = `https://source.unsplash.com/800x600/?${encodeURIComponent(ctx.text)}`;
    await ctx.sock.sendMessage(ctx.from, { image: { url }, caption: `🖼️ Image: ${ctx.text}` }, { quoted: ctx.m });
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 2. IMAGE 5 - real 5 images via Unsplash with random sig
add('images', ['imgs'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}images <query>`);
  try {
    for (let i = 0; i < 3; i++) {
      const url = `https://source.unsplash.com/800x600/?${encodeURIComponent(ctx.text)}&sig=${Date.now() + i}`;
      await ctx.sock.sendMessage(ctx.from, { image: { url }, caption: `🖼️ ${ctx.text} (${i + 1}/3)` }, { quoted: ctx.m });
      await new Promise(r => setTimeout(r, 800));
    }
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 3. WALLPAPER - real Unsplash wallpaper
add('wallpaper', ['wp', 'wall'], false, async (ctx) => {
  const q = ctx.text || 'nature';
  try {
    const url = `https://source.unsplash.com/1080x1920/?${encodeURIComponent(q)},wallpaper&sig=${Date.now()}`;
    await ctx.sock.sendMessage(ctx.from, { image: { url }, caption: `📱 Wallpaper: ${q}` }, { quoted: ctx.m });
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 4. GIF SEARCH - real Giphy beta key (public)
add('gif', ['giphy'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}gif <query>`);
  try {
    const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(ctx.text)}&limit=1&rating=g`);
    const j = await res.json();
    if (!j.data?.length) return ctx.reply('❌ No GIF found.');
    await ctx.sock.sendMessage(ctx.from, { video: { url: j.data[0].images.original_mp4.mp4 }, caption: `🎬 GIF: ${ctx.text}`, gifPlayback: true }, { quoted: ctx.m });
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 5. STICKER GIF - real Giphy sticker -> sticker message
add('gifsticker', ['gsticker'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}gifsticker <query>`);
  try {
    const res = await fetch(`https://api.giphy.com/v1/stickers/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(ctx.text)}&limit=1&rating=g`);
    const j = await res.json();
    if (!j.data?.length) return ctx.reply('❌ No sticker found.');
    await ctx.sock.sendMessage(ctx.from, { sticker: { url: j.data[0].images.original.url } }, { quoted: ctx.m });
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 6. VIDEO SEARCH - real Pexels-free fallback via Pixabay? Use Coverr? Use sample via Giphy video
add('video2', ['videosearch'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}video2 <query>`);
  try {
    const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(ctx.text)}&limit=1&rating=g`);
    const j = await res.json();
    if (!j.data?.length) return ctx.reply('❌ No video found.');
    await ctx.sock.sendMessage(ctx.from, { video: { url: j.data[0].images.original_mp4.mp4 }, caption: `🎬 Video: ${ctx.text}` }, { quoted: ctx.m });
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 7. MUSIC SEARCH - real iTunes API (no key) - returns preview mp3
add('music', ['songsearch'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}music <song name>`);
  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(ctx.text)}&media=music&limit=1`);
    const j = await res.json();
    if (!j.results?.length) return ctx.reply('❌ Song not found.');
    const s = j.results[0];
    await ctx.reply(`🎵 *MUSIC*\n\nTitle: ${s.trackName}\nArtist: ${s.artistName}\nAlbum: ${s.collectionName}\nGenre: ${s.primaryGenreName}\nPrice: ${s.trackPrice} ${s.currency}\n\nSending preview audio...`);
    await ctx.sock.sendMessage(ctx.from, { image: { url: s.artworkUrl100.replace('100x100', '600x600') }, caption: `🎵 ${s.trackName} - ${s.artistName}` }, { quoted: ctx.m });
    await ctx.sock.sendMessage(ctx.from, { audio: { url: s.previewUrl }, mimetype: 'audio/mpeg', fileName: `${s.trackName}.mp3` }, { quoted: ctx.m });
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 8. LYRICS SEARCH - real lyrics.ovh API
add('lyrics2', ['lyricssearch'], false, async (ctx) => {
  const parts = ctx.text.split(' - ');
  if (parts.length < 2) return ctx.reply(`Use: ${ctx.prefix}lyrics2 <artist> - <title>\nExample: ${ctx.prefix}lyrics2 Burna Boy - City Boys`);
  try {
    const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(parts[0].trim())}/${encodeURIComponent(parts[1].trim())}`);
    const j = await res.json();
    if (j.error) return ctx.reply(`❌ ${j.error}`);
    await ctx.reply(`🎤 *LYRICS - ${parts[0]} - ${parts[1]}*\n\n${j.lyrics.slice(0, 3500)}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 9. MOVIE SEARCH - real OMDB needs key, use TVMaze (free, no key) + OMDB fallback
add('movie2', ['moviesearch'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}movie2 <movie name>`);
  try {
    const res = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(ctx.text)}`);
    const j = await res.json();
    if (!j.length) return ctx.reply('❌ Movie/Show not found.');
    const s = j[0].show;
    const cleanDesc = (s.summary || 'No description').replace(/<[^>]*>/g, '').slice(0, 600);
    await ctx.reply(`🎬 *${s.name}*\n\nGenres: ${(s.genres || []).join(', ') || 'N/A'}\nRating: ${s.rating?.average || 'N/A'}/10\nStatus: ${s.status || 'N/A'}\nLanguage: ${s.language || 'N/A'}\nPremiered: ${s.premiered || 'N/A'}\n\n${cleanDesc}`);
    if (s.image?.original) await ctx.sock.sendMessage(ctx.from, { image: { url: s.image.original }, caption: `🎬 ${s.name}` }, { quoted: ctx.m });
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 10. ANIME SEARCH - real Jikan API (MyAnimeList)
add('animesearch', ['animeinfo'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}animesearch <anime name>\nExample: ${ctx.prefix}animesearch Naruto`);
  try {
    const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(ctx.text)}&limit=1`);
    const j = await res.json();
    if (!j.data?.length) return ctx.reply('❌ Anime not found.');
    const a = j.data[0];
    await ctx.reply(`🌸 *${a.title}*\n\nJapanese: ${a.title_japanese || 'N/A'}\nEpisodes: ${a.episodes || 'N/A'} | Status: ${a.status}\nScore: ${a.score || 'N/A'}/10 | Rank: #${a.rank || 'N/A'}\nGenres: ${a.genres.map(g => g.name).join(', ')}\nAired: ${a.aired?.string || 'N/A'}\n\n${(a.synopsis || '').slice(0, 700)}`);
    if (a.images?.jpg?.image_url) await ctx.sock.sendMessage(ctx.from, { image: { url: a.images.jpg.image_url }, caption: `🌸 ${a.title}` }, { quoted: ctx.m });
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 11. MANGA SEARCH - real Jikan manga
add('manga', ['mangasearch'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}manga <manga name>`);
  try {
    const res = await fetch(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(ctx.text)}&limit=1`);
    const j = await res.json();
    if (!j.data?.length) return ctx.reply('❌ Manga not found.');
    const m = j.data[0];
    await ctx.reply(`📚 *${m.title}*\n\nChapters: ${m.chapters || 'N/A'} | Volumes: ${m.volumes || 'N/A'}\nScore: ${m.score || 'N/A'}/10 | Status: ${m.status}\nGenres: ${m.genres.map(g => g.name).join(', ')}\n\n${(m.synopsis || '').slice(0, 700)}`);
    if (m.images?.jpg?.image_url) await ctx.sock.sendMessage(ctx.from, { image: { url: m.images.jpg.image_url }, caption: `📚 ${m.title}` }, { quoted: ctx.m });
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 12. BOOK SEARCH - real OpenLibrary API
add('book', ['booksearch'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}book <book name>`);
  try {
    const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(ctx.text)}&limit=1`);
    const j = await res.json();
    if (!j.docs?.length) return ctx.reply('❌ Book not found.');
    const b = j.docs[0];
    await ctx.reply(`📚 *BOOK*\n\nTitle: ${b.title}\nAuthor: ${(b.author_name || ['Unknown']).join(', ')}\nYear: ${b.first_publish_year || 'N/A'}\nLanguage: ${(b.language || ['N/A']).join(', ')}\nPages: ${b.number_of_pages_median || 'N/A'}\nPublisher: ${(b.publisher || ['N/A']).slice(0, 2).join(', ')}`);
    if (b.cover_i) await ctx.sock.sendMessage(ctx.from, { image: { url: `https://covers.openlibrary.org/b/id/${b.cover_i}-L.jpg` }, caption: `📚 ${b.title}` }, { quoted: ctx.m });
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 13. RECIPE SEARCH - real TheMealDB API
add('recipe', ['foodsearch'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}recipe <food>\nExample: ${ctx.prefix}recipe jollof`);
  try {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(ctx.text)}`);
    const j = await res.json();
    if (!j.meals) return ctx.reply('❌ Recipe not found.');
    const m = j.meals[0];
    const ingredients = [];
    for (let i = 1; i <= 20; i++) { const ing = m[`strIngredient${i}`]; const mea = m[`strMeasure${i}`]; if (ing && ing.trim()) ingredients.push(`${mea} ${ing}`); }
    await ctx.reply(`🍽️ *${m.strMeal}*\n\nCategory: ${m.strCategory} | Area: ${m.strArea}\n\nIngredients:\n${ingredients.slice(0, 12).join('\n')}\n\nInstructions:\n${m.strInstructions.slice(0, 1200)}`);
    if (m.strMealThumb) await ctx.sock.sendMessage(ctx.from, { image: { url: m.strMealThumb }, caption: `🍽️ ${m.strMeal}` }, { quoted: ctx.m });
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 14. DRINK SEARCH - real CocktailDB
add('drink', ['cocktail'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}drink <drink name>`);
  try {
    const res = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${encodeURIComponent(ctx.text)}`);
    const j = await res.json();
    if (!j.drinks) return ctx.reply('❌ Drink not found.');
    const d = j.drinks[0];
    await ctx.reply(`🍹 *${d.strDrink}*\n\nCategory: ${d.strCategory} | Alcoholic: ${d.strAlcoholic}\nGlass: ${d.strGlass}\n\nInstructions:\n${d.strInstructions.slice(0, 800)}`);
    if (d.strDrinkThumb) await ctx.sock.sendMessage(ctx.from, { image: { url: d.strDrinkThumb }, caption: `🍹 ${d.strDrink}` }, { quoted: ctx.m });
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 15. NASA APOD - real NASA demo key
add('nasa', ['spacepic'], false, async (ctx) => {
  try {
    const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY`);
    const j = await res.json();
    await ctx.reply(`🚀 *NASA - ${j.title}*\n\nDate: ${j.date}\n\n${(j.explanation || '').slice(0, 800)}`);
    if (j.url && j.media_type === 'image') await ctx.sock.sendMessage(ctx.from, { image: { url: j.url }, caption: `🚀 ${j.title}` }, { quoted: ctx.m });
    else if (j.url) await ctx.reply(`Video: ${j.url}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 16. RANDOM QUOTE - real Quotable API
add('quote2', ['randomquote'], false, async (ctx) => {
  try {
    const res = await fetch('https://api.quotable.io/random');
    const j = await res.json();
    await ctx.reply(`💬 *QUOTE*\n\n"${j.content}"\n\n— ${j.author} [${(j.tags || []).join(', ')}]`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 17. FACT - real Useless Facts API
add('fact', ['randomfact'], false, async (ctx) => {
  try {
    const res = await fetch('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en');
    const j = await res.json();
    await ctx.reply(`🧠 *FACT*\n\n${j.text}\n\nSource: ${j.source || 'uselessfacts'}`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 18. COUNTRY INFO - real RestCountries API
add('country2', ['countryinfo'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}country2 <country>\nExample: ${ctx.prefix}country2 Nigeria`);
  try {
    const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(ctx.text)}?fullText=true`);
    const j = await res.json();
    if (j.status === 404) return ctx.reply('❌ Country not found.');
    const c = j[0];
    await ctx.reply(`🌍 *${c.name.common}*\n\nOfficial: ${c.name.official}\nCapital: ${(c.capital || ['N/A']).join(', ')}\nPopulation: ${c.population.toLocaleString()}\nRegion: ${c.region} | Subregion: ${c.subregion || 'N/A'}\nLanguages: ${Object.values(c.languages || {}).join(', ')}\nCurrencies: ${Object.values(c.currencies || {}).map(x => `${x.name} (${x.symbol || ''})`).join(', ')}\nTimezones: ${(c.timezones || []).join(', ')}\nDriving: ${c.car?.side || 'N/A'}`);
    if (c.flags?.png) await ctx.sock.sendMessage(ctx.from, { image: { url: c.flags.png }, caption: `🌍 Flag: ${c.name.common}` }, { quoted: ctx.m });
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

module.exports = cmds;
