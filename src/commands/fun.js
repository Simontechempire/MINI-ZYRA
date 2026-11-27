// ============================================================
// MINI-ZYRA - FUN MODULE - ALL IN ONE FILE
// BY FACELESS - NO DEMO - NO SIMULATION - NO PLACEHOLDER
// REAL: crypto random, real APIs for anime/cat/dog/meme
// ============================================================
const crypto = require('crypto');

function rand(n) { return crypto.randomInt(0, n); }
function pick(arr) { return arr[rand(arr.length)]; }
function clean(t) { return String(t || '').replace(/[^0-9]/g, ''); }
function getTarget(ctx) {
  if (ctx.m.quoted?.participant) return ctx.m.quoted.participant;
  if (ctx.m.mentionedJid?.[0]) return ctx.m.mentionedJid[0];
  return null;
}

const cmds = [];
const add = (name, alias, ownerOnly, execute) => cmds.push({ name, alias: alias || [], ownerOnly, execute });

// 1. COINFLIP - real crypto random
add('coinflip', ['coin', 'flip'], false, async (ctx) => {
  const res = pick(['Heads 🪙', 'Tails 🪙']);
  await ctx.reply(`🪙 *COINFLIP*\n\nResult: ${res}`);
});

// 2. DICE - real crypto random 1-6
add('dice', ['roll'], false, async (ctx) => {
  const n = rand(6) + 1;
  const faces = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  await ctx.reply(`🎲 *DICE*\n\nYou rolled: ${faces[n]} (${n})`);
});

// 3. RPS - real vs bot
add('rps', ['rockpaperscissors'], false, async (ctx) => {
  const user = (ctx.args[0] || '').toLowerCase();
  const valid = ['rock', 'paper', 'scissors', 'r', 'p', 's'];
  if (!valid.includes(user)) return ctx.reply(`Use: ${ctx.prefix}rps <rock/paper/scissors>`);
  const map = { r: 'rock', p: 'paper', s: 'scissors' };
  const u = map[user] || user;
  const bot = pick(['rock', 'paper', 'scissors']);
  const em = { rock: '🪨', paper: '📄', scissors: '✂️' };
  let result = 'Draw 🤝';
  if ((u === 'rock' && bot === 'scissors') || (u === 'paper' && bot === 'rock') || (u === 'scissors' && bot === 'paper')) result = 'You WIN! 🎉';
  if ((bot === 'rock' && u === 'scissors') || (bot === 'paper' && u === 'rock') || (bot === 'scissors' && u === 'paper')) result = 'Bot WINS! 🤖';
  await ctx.reply(`🎮 *RPS*\n\nYou: ${em[u]} ${u}\nBot: ${em[bot]} ${bot}\n\nResult: ${result}`);
});

// 4. 8BALL - real random answer
add('8ball', ['magic8'], false, async (ctx) => {
  if (!ctx.text) return ctx.reply(`Use: ${ctx.prefix}8ball <question>`);
  const answers = ['Yes ✅', 'No ❌', 'Maybe 🤔', 'Definitely YES! 🎉', 'Ask again later 🔮', 'Absolutely NOT 🚫', 'Signs point to YES ✨', 'I doubt it 🤨', 'Without a doubt 💯', 'Better not tell you now 🤫'];
  await ctx.reply(`🎱 *8BALL*\n\nQuestion: ${ctx.text}\nAnswer: ${pick(answers)}`);
});

// 5. TRUTH - real list
add('truth', [], false, async (ctx) => {
  const list = [
    'What is your biggest secret?', 'Who is your crush right now?', 'What is the most embarrassing thing you have done?', 'Have you ever lied to your best friend?', 'What is one thing you would change about yourself?', 'Who was your last search on WhatsApp?', 'Have you ever cheated in a game?', 'What is your biggest fear?', 'What is the last lie you told?', 'Who do you stalk on social media?'
  ];
  await ctx.reply(`💡 *TRUTH*\n\n${pick(list)}`);
});

// 6. DARE - real list
add('dare', [], false, async (ctx) => {
  const list = [
    'Send a voice note singing your favourite song.', 'Change your DP to a funny face for 1 hour.', 'Text your crush "Hi" right now.', 'Do 10 push-ups and send proof.', 'Send the last photo in your gallery to the group.', 'Speak in an accent for the next 5 messages.', 'Call the last person you chatted with.', 'Dance for 30 seconds on video.', 'Send a selfie with a funny face.', 'Say "I love MINI-ZYRA" in voice note.'
  ];
  await ctx.reply(`🔥 *DARE*\n\n${pick(list)}`);
});

// 7. SHIP - real deterministic from two numbers (same pair = same % always)
add('ship', ['love'], false, async (ctx) => {
  const t = getTarget(ctx);
  const other = t || ctx.args[0];
  if (!other && !ctx.args[0]) return ctx.reply(`Use: ${ctx.prefix}ship @user  OR  ${ctx.prefix}ship Name1 Name2`);
  const name1 = ctx.senderNumber || 'You';
  const name2 = other ? clean(other) : ctx.args.join(' ');
  // Deterministic hash: same pair always same %
  const hash = crypto.createHash('md5').update(`${name1}-${name2}`).digest('hex');
  const pct = parseInt(hash.slice(0, 2), 16) % 101;
  const bar = '❤️'.repeat(Math.floor(pct / 10)) + '🤍'.repeat(10 - Math.floor(pct / 10));
  const msg = pct > 80 ? 'Perfect match! 💍' : pct > 50 ? 'Good match! 💕' : pct > 30 ? 'Maybe... 🤔' : 'Not compatible 😅';
  await ctx.reply(`💘 *SHIP*\n\n@${name1} ❤️ @${name2}\n\nLove: ${pct}%\n${bar}\n\n${msg}`, { mentions: [ctx.sender, t || ctx.sender] });
});

// 8. RATE - real deterministic from text hash
add('rate', ['rateuser'], false, async (ctx) => {
  const target = ctx.text || 'You';
  const hash = crypto.createHash('md5').update(target).digest('hex');
  const pct = parseInt(hash.slice(0, 2), 16) % 101;
  await ctx.reply(`⭐ *RATE*\n\n${target} is ${pct}% cool 😎\n${'⭐'.repeat(Math.floor(pct / 20) + 1)}`);
});

// 9. GAY / LESBIAN / STRAIGHT - fun deterministic, not real identity
add('gay', [], false, async (ctx) => {
  const t = getTarget(ctx) || ctx.sender;
  const hash = crypto.createHash('md5').update(clean(t) + 'gay').digest('hex');
  const pct = parseInt(hash.slice(0, 2), 16) % 101;
  await ctx.reply(`🏳️‍🌈 *GAY METER*\n\n@${clean(t)} is ${pct}% gay 😂`, { mentions: [t] });
});
add('beauty', ['beautiful'], false, async (ctx) => {
  const t = getTarget(ctx) || ctx.sender;
  const hash = crypto.createHash('md5').update(clean(t) + 'beauty').digest('hex');
  const pct = parseInt(hash.slice(0, 2), 16) % 101;
  await ctx.reply(`💅 *BEAUTY METER*\n\n@${clean(t)} is ${pct}% beautiful ✨`, { mentions: [t] });
});

// 10. INSULT - fun list, not targeted harassment
add('insult', ['roast'], false, async (ctx) => {
  const list = ['You are so slow, your internet is faster than your brain.', 'You have the personality of a loading screen.', 'If laziness was a job, you would be CEO.', 'Your WiFi is stronger than your comebacks.', 'You are like a software update - nobody asked for you but here you are.'];
  await ctx.reply(`🔥 *ROAST*\n\n${pick(list)}`);
});

// 11. COMPLIMENT - real list
add('compliment', ['praise'], false, async (ctx) => {
  const t = getTarget(ctx);
  const list = ['You have a great smile! 😊', 'You are smarter than you think! 🧠', 'Your vibe is amazing! ✨', 'You make the group better! 💪', 'You are one of a kind! 🌟'];
  await ctx.reply(`💐 *COMPLIMENT*\n\n${t ? `@${clean(t)} ` : ''}${pick(list)}`, { mentions: t ? [t] : [] });
});

// 12. MEME - real Meme API
add('meme', ['funnypic'], false, async (ctx) => {
  try {
    const res = await fetch('https://meme-api.com/gimme');
    const j = await res.json();
    await ctx.sock.sendMessage(ctx.from, { image: { url: j.url }, caption: `😂 *MEME*\n\n${j.title}\nSub: r/${j.subreddit} | 👍 ${j.ups}` }, { quoted: ctx.m });
  } catch (e) { await ctx.reply(`❌ Meme failed: ${e.message}`); }
});

// 13. CAT - real Cataas API
add('cat', ['kitty'], false, async (ctx) => {
  try { await ctx.sock.sendMessage(ctx.from, { image: { url: 'https://cataas.com/cat?width=500&height=500' }, caption: '🐱 Random Cat' }, { quoted: ctx.m }); } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 14. DOG - real Dog CEO API
add('dog', ['doggy'], false, async (ctx) => {
  try {
    const res = await fetch('https://dog.ceo/api/breeds/image/random');
    const j = await res.json();
    await ctx.sock.sendMessage(ctx.from, { image: { url: j.message }, caption: '🐶 Random Dog' }, { quoted: ctx.m });
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 15. ANIME - real Waifu.pics API
add('anime', ['waifu'], false, async (ctx) => {
  const type = (ctx.args[0] || 'waifu').toLowerCase();
  const valid = ['waifu', 'neko', 'shinobu', 'megumin', 'bully', 'cuddle', 'cry', 'hug', 'kiss', 'lick', 'pat', 'smug', 'bonk', 'yeet', 'blush', 'smile', 'wave', 'highfive', 'handhold', 'nom', 'bite', 'glomp', 'slap', 'kill', 'kick', 'happy', 'wink', 'poke', 'dance', 'cringe'];
  const use = valid.includes(type) ? type : 'waifu';
  try {
    const res = await fetch(`https://api.waifu.pics/sfw/${use}`);
    const j = await res.json();
    await ctx.sock.sendMessage(ctx.from, { image: { url: j.url }, caption: `🌸 Anime: ${use}` }, { quoted: ctx.m });
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 16. ANIMEQUOTE - real AnimeChan API
add('animequote', ['aq'], false, async (ctx) => {
  try {
    const res = await fetch('https://api.animechan.io/v1/quotes/random');
    const j = await res.json();
    const q = j.data || j;
    await ctx.reply(`🌸 *ANIME QUOTE*\n\n"${q.content || q.quote}"\n\n— ${q.character?.name || q.character || 'Unknown'} (${q.anime?.name || q.anime || ''})`);
  } catch (e) { await ctx.reply(`❌ ${e.message}`); }
});

// 17. PICKUP - real list
add('pickup', ['pickupline'], false, async (ctx) => {
  const list = ['Are you WiFi? Because I am really feeling the connection.', 'Are you a magician? Every time I look at you, everyone else disappears.', 'Do you have a map? I keep getting lost in your eyes.', 'Are you Google? You have everything I have been searching for.', 'Is your name ChapGPT? Because you answer all my questions.'];
  await ctx.reply(`💘 *PICKUP LINE*\n\n${pick(list)}`);
});

// 18. WOULD YOU RATHER - real list
add('wyr', ['wouldyourather'], false, async (ctx) => {
  const list = ['Would you rather have unlimited money or unlimited time?', 'Would you rather be famous or rich?', 'Would you rather never use WhatsApp again or never eat your favourite food again?', 'Would you rather fly or be invisible?', 'Would you rather live in Lagos forever or travel the world with no phone?'];
  await ctx.reply(`🤔 *WOULD YOU RATHER*\n\n${pick(list)}`);
});

// 19. JOKES NAIJA - real list
add('naijajoke', ['ngjoke'], false, async (ctx) => {
  const list = ['Why did the Lagos driver carry a ladder? To climb the traffic! 😂', 'NEPA took light, my neighbour said "at least we have moonlight" - moonlight also went off. 😭', 'In Nigeria, "I am coming" means 3 things: I am on my way, I am still at home, I have forgotten. 😂', 'My phone battery is like Nigerian politician - it promises 100% but dies at 20%. 📱'];
  await ctx.reply(`🇳🇬 *NAIJA JOKE*\n\n${pick(list)}`);
});

// 20. SLAP / HUG / KISS - real anime action via waifu.pics
for (const [name, emoji, action] of [['slap', '👋', 'slap'], ['hug', '🤗', 'hug'], ['kiss', '😘', 'kiss'], ['pat', '🐾', 'pat'], ['poke', '👉', 'poke']]) {
  add(name, [], false, async (ctx) => {
    const t = getTarget(ctx);
    if (!t) return ctx.reply(`Use: ${ctx.prefix}${name} @user`);
    try {
      const res = await fetch(`https://api.waifu.pics/sfw/${action}`);
      const j = await res.json();
      await ctx.sock.sendMessage(ctx.from, { image: { url: j.url }, caption: `${emoji} @${clean(ctx.sender)} ${name}ed @${clean(t)}` }, { quoted: ctx.m });
    } catch (e) { await ctx.reply(`❌ ${e.message}`); }
  });
}

// 21. TIC TAC TOE - real game state in memory
const tttGames = new Map();
function tttBoard(b) { return `\n${b[0] || '1'} | ${b[1] || '2'} | ${b[2] || '3'}\n---------\n${b[3] || '4'} | ${b[4] || '5'} | ${b[5] || '6'}\n---------\n${b[7] || '7'} | ${b[7] || '8'} | ${b[8] || '9'}\n`; }
add('ttt', ['tictactoe'], false, async (ctx) => {
  if (!ctx.isGroup) return ctx.reply('❌ TTT works in group only.');
  const t = getTarget(ctx);
  if (!t) return ctx.reply(`Use: ${ctx.prefix}ttt @user to start game`);
  const game = { p1: ctx.sender, p2: t, board: Array(9).fill(''), turn: ctx.sender, over: false };
  tttGames.set(ctx.from, game);
  await ctx.reply(`🎮 *TIC TAC TOE*\n\n@${clean(game.p1)} (❌) vs @${clean(game.p2)} (⭕)\n\n${tttBoard(game.board)}\n\n@${clean(game.turn)} your turn! Use: ${ctx.prefix}tttmove <1-9>`, { mentions: [game.p1, game.p2] });
});
add('tttmove', ['tttplay'], false, async (ctx) => {
  const game = tttGames.get(ctx.from);
  if (!game) return ctx.reply(`No game. Start with ${ctx.prefix}ttt @user`);
  if (game.over) { tttGames.delete(ctx.from); return ctx.reply('Game over. Start new.'); }
  if (ctx.sender !== game.turn) return ctx.reply('❌ Not your turn.');
  const pos = parseInt(ctx.args[0]) - 1;
  if (isNaN(pos) || pos < 0 || pos > 8 || game.board[pos]) return ctx.reply('❌ Invalid move. Use 1-9 empty cell.');
  const mark = ctx.sender === game.p1 ? '❌' : '⭕';
  game.board[pos] = mark;
  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  const won = wins.some(w => w.every(i => game.board[i] === mark));
  if (won) { game.over = true; await ctx.reply(`🎉 *WINNER!*\n\n@${clean(ctx.sender)} wins!\n${tttBoard(game.board)}`, { mentions: [ctx.sender] }); tttGames.delete(ctx.from); return; }
  if (game.board.every(c => c)) { game.over = true; await ctx.reply(`🤝 *DRAW!*\n${tttBoard(game.board)}`); tttGames.delete(ctx.from); return; }
  game.turn = game.turn === game.p1 ? game.p2 : game.p1;
  await ctx.reply(`🎮 *TTT*\n${tttBoard(game.board)}\n\n@${clean(game.turn)} your turn!`, { mentions: [game.turn] });
});

// 22. GUESS NUMBER - real game
const guessGames = new Map();
add('guess', [], false, async (ctx) => {
  const num = rand(100) + 1;
  guessGames.set(ctx.from + ctx.sender, num);
  await ctx.reply(`🎯 *GUESS NUMBER*\n\nI picked 1-100. Guess with: ${ctx.prefix}guessnum <number>`);
});
add('guessnum', [], false, async (ctx) => {
  const key = ctx.from + ctx.sender;
  const target = guessGames.get(key);
  if (!target) return ctx.reply(`Start with ${ctx.prefix}guess first`);
  const g = parseInt(ctx.args[0]);
  if (isNaN(g)) return ctx.reply('❌ Send a number.');
  if (g === target) { guessGames.delete(key); await ctx.reply(`🎉 CORRECT! It was ${target}! You win!`); return; }
  await ctx.reply(g < target ? `📈 Too LOW! Try higher.` : `📉 Too HIGH! Try lower.`);
});

// 23. MATH QUIZ - real random math
const quizGames = new Map();
add('quiz', [], false, async (ctx) => {
  const a = rand(20) + 1, b = rand(20) + 1;
  const op = pick(['+', '-', '*']);
  let ans = op === '+' ? a + b : op === '-' ? a - b : a * b;
  quizGames.set(ctx.from + ctx.sender, ans);
  await ctx.reply(`🧠 *MATH QUIZ*\n\nWhat is ${a} ${op} ${b} ?\nAnswer with: ${ctx.prefix}quizans <number>`);
});
add('quizans', [], false, async (ctx) => {
  const key = ctx.from + ctx.sender;
  const ans = quizGames.get(key);
  if (ans === undefined) return ctx.reply(`Start with ${ctx.prefix}quiz`);
  const g = parseInt(ctx.args[0]);
  if (g === ans) { quizGames.delete(key); await ctx.reply(`✅ CORRECT! ${ans} is right! 🎉`); } else { await ctx.reply(`❌ Wrong! Try again.`); }
});

module.exports = cmds;
