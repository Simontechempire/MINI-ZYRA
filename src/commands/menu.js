// ============================================================
// 💀 MINI-ZYRA - MENU - YOUR EXACT DESIGN
// BY FACELESS - Dynamic DATE / UPTIME / PING / VERSION / COMMANDS
// ============================================================
require('../../config')

module.exports = {
  name: 'menu',
  alias: ['help', 'cmd', 'commands', 'list'],
  ownerOnly: false,
  desc: 'Show bot menu',

  execute: async ({ sock, m, from, reply, prefix, senderNumber, sessionSettings, commands }) => {
    try {
      const start = Date.now();
      const myPrefix = sessionSettings?.prefix || prefix || '.';
      const mode = sessionSettings?.mode || config.mode || 'public';

      // --- DYNAMIC VALUES ---
      const date = new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const time = new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const uptimeMs = Date.now() - (global.botStart || Date.now());
      const upH = Math.floor(uptimeMs / 3600000);
      const upM = Math.floor((uptimeMs % 3600000) / 60000);
      const upS = Math.floor((uptimeMs % 60000) / 1000);
      const uptime = `${upH}h ${upM}m ${upS}s`;
      const ping = Date.now() - start;
      const version = config.version || '2.0.0';
      const totalCmds = commands ? new Set([...commands.values()].map(c => c.name)).size : 450;
      const freeBot = mode === 'public' ? 'YES ✅' : 'NO 🔒';

      // Helper: prefix + command, so if user prefix is !, menu shows !menu not .menu
      // Your design uses . - we keep . if prefix is ., else use user's prefix
      const p = myPrefix;

      const menu = `╭─[ MINI ZYRA SYSTEM ]
│
├─ ❄️ BOT      : 𝗠𝗜𝗡𝗜 𝗭𝗬𝗥𝗔
├─ 👑 OWNER    : Faceless 
├─ 🌙 DATE     : ${date}
├─ ⏱️ TIME     : ${time} (WAT)
├─ ⏱️ UPTIME   : ${uptime}
├─ 📶 PING     : ${ping}ms
├─ 🔖 VERSION  : v${version}
├─ 📚 COMMANDS : ${totalCmds}+
├─ 🌐 FREE BOT : ${freeBot}
│
╰─[ SYSTEM ONLINE ]

╭─[ 01 / 👑 OWNER CONTROL ]
│
├─ ${p}mode
├─ ${p}settings
├─ ${p}password
├─ ${p}info
├─ ${p}menutag
├─ ${p}usagetip
├─ ${p}setprefix
├─ ${p}delprefix
├─ ${p}setpp
├─ ${p}postch
├─ ${p}setcmd
├─ ${p}delcmd
├─ ${p}listcmd
├─ ${p}allowcmd
├─ ${p}swgcmusic
├─ ${p}setbotbio
├─ ${p}autobio
├─ ${p}autostatus
├─ ${p}autotyping
├─ ${p}autorecording
├─ ${p}autoreact
├─ ${p}anticall
├─ ${p}antidelete
├─ ${p}antiviewonce
├─ ${p}antideletestatus
├─ ${p}addsudo
├─ ${p}delsudo
├─ ${p}sudolist
├─ ${p}block
├─ ${p}unblock
├─ ${p}ban
├─ ${p}unban
├─ ${p}save
├─ ${p}schedulestatus
├─ ${p}reshare
├─ ${p}chatbot
├─ ${p}clearsession
├─ ${p}cleartmp
├─ ${p}pair
├─ ${p}checkidch
├─ ${p}archive
├─ ${p}unarchive
├─ ${p}chatpin
├─ ${p}unpin
├─ ${p}markread
├─ ${p}markunread
├─ ${p}unmutechat
├─ ${p}profilename
├─ ${p}fullphoto
├─ ${p}removephoto
├─ ${p}join
├─ ${p}listgc
├─ ${p}edit
├─ ${p}forward
├─ ${p}getprivacy
├─ ${p}lastseen
├─ ${p}mypp
├─ ${p}mystatus
├─ ${p}read
├─ ${p}groupadd
├─ ${p}privacy
│
╰─[ END OWNER MODULE ]

╭─[ 02 / 💻 BOT INFORMATION ]
│
├─ ${p}owner
├─ ${p}ping
├─ ${p}alive
├─ ${p}runtime
├─ ${p}repo
│
╰─[ END BOT MODULE ]

╭─[ 03 / 👥 GROUP MANAGEMENT ]
│
├─ ${p}add
├─ ${p}kick
├─ ${p}kickall
├─ ${p}promote
├─ ${p}demote
├─ ${p}mute
├─ ${p}unmute
├─ ${p}lockgroup
├─ ${p}unlockgroup
├─ ${p}revoke
├─ ${p}grouplink
├─ ${p}setname
├─ ${p}setdesc
├─ ${p}setgcpp
├─ ${p}gcstatus
├─ ${p}gctheme
├─ ${p}newgroup
├─ ${p}leavegc
├─ ${p}groupinfo
├─ ${p}staff
├─ ${p}jid
├─ ${p}tagall
├─ ${p}tag
├─ ${p}hidetag
├─ ${p}tagadmins
├─ ${p}online
├─ ${p}offline
├─ ${p}deletebot
├─ ${p}readreceipts
├─ ${p}onlineusers
├─ ${p}onlineadmins
├─ ${p}onlinestats
├─ ${p}welcome
├─ ${p}goodbye
├─ ${p}rules
├─ ${p}poll
├─ ${p}afk
├─ ${p}couple
├─ ${p}antilink
├─ ${p}antitag
├─ ${p}antigroupmention
├─ ${p}antichannelfwd
├─ ${p}antigroupstatus
├─ ${p}antibot
├─ ${p}antibadword
├─ ${p}antispam
├─ ${p}slowmode
├─ ${p}warn
├─ ${p}warnings
├─ ${p}antifakenumber
├─ ${p}adminalerts
├─ ${p}antiword
├─ ${p}enable
├─ ${p}disable
├─ ${p}lockat
├─ ${p}unlockat
├─ ${p}cancellock
├─ ${p}cancelunlock
├─ ${p}acceptall
├─ ${p}rejectall
├─ ${p}listrequest
├─ ${p}linkinfo
├─ ${p}fullgroupphoto
├─ ${p}checkwarn
├─ ${p}resetwarn
├─ ${p}gcset
├─ ${p}tagnotadmin
│
╰─[ END GROUP MODULE ]

╭─[ 04 / 🤖 ARTIFICIAL INTELLIGENCE ]
│
├─ ${p}ai
├─ ${p}gpt
├─ ${p}qwen
├─ ${p}allam
├─ ${p}imagine
├─ ${p}flux
├─ ${p}dalle
├─ ${p}txt2video
├─ ${p}sora
├─ ${p}imageedit
├─ ${p}diffusion
├─ ${p}toanime
├─ ${p}ghibli
├─ ${p}tochibi
├─ ${p}tocartoon
├─ ${p}topixar
├─ ${p}todisney
├─ ${p}tomanga
├─ ${p}tofigure
├─ ${p}toroblox
├─ ${p}topolaroid
├─ ${p}tobald
├─ ${p}editai
├─ ${p}bananagen
│
╰─[ END AI MODULE ]

╭─[ 05 / 📥 DOWNLOADER ]
│
├─ ${p}play
├─ ${p}song
├─ ${p}music
├─ ${p}ytmp3
├─ ${p}mp3
├─ ${p}ytmp4
├─ ${p}video
├─ ${p}instagram
├─ ${p}download
├─ ${p}dl
├─ ${p}tiktok
├─ ${p}tt
├─ ${p}facebook
├─ ${p}fb
├─ ${p}pinterest
├─ ${p}anime
├─ ${p}movie
├─ ${p}cinesubz
├─ ${p}fwd
├─ ${p}gitclone
├─ ${p}apk
├─ ${p}pixabay
├─ ${p}gif
├─ ${p}tourl
├─ ${p}mediafire
├─ ${p}xdown
├─ ${p}ytdoc
├─ ${p}ringtone
├─ ${p}wikimedia
├─ ${p}capcut
├─ ${p}gdrive
├─ ${p}threads
├─ ${p}spotify
├─ ${p}tiktokmp3
│
╰─[ END DOWNLOADER ]

╭─[ 06 / 🎚️ AUDIO EFFECTS ]
│
├─ ${p}bass
├─ ${p}deep
├─ ${p}blown
├─ ${p}earrape
├─ ${p}fast
├─ ${p}slow
├─ ${p}fat
├─ ${p}squirrel
├─ ${p}nightcore
├─ ${p}robot
├─ ${p}areverse
├─ ${p}8d
├─ ${p}echo
├─ ${p}reverb
├─ ${p}vibrato
├─ ${p}tremolo
├─ ${p}radio
├─ ${p}alien
├─ ${p}audiofx
├─ ${p}tomp3
├─ ${p}tts
├─ ${p}volume
├─ ${p}tempo
│
╰─[ END AUDIO MODULE ]

╭─[ 07 / 🎨 CONVERTER ]
│
├─ ${p}sticker
├─ ${p}s
├─ ${p}simage
├─ ${p}toimg
├─ ${p}removebg
├─ ${p}upscale
├─ ${p}take
├─ ${p}attp
├─ ${p}qc
├─ ${p}emojimix
├─ ${p}tgsticker
├─ ${p}blur
├─ ${p}meme
├─ ${p}getpp
├─ ${p}wasted
├─ ${p}character
├─ ${p}crop
├─ ${p}circle
├─ ${p}round
├─ ${p}ttp
├─ ${p}brat
├─ ${p}memegen
├─ ${p}tomp4
├─ ${p}tovn
├─ ${p}saudio
├─ ${p}saudioformat
│
╰─[ END CONVERTER ]

╭─[ 08 / 🔤 LOGO MAKER ]
│
├─ ${p}fancy
├─ ${p}gfx
├─ ${p}gfx2
├─ ${p}gfx3
├─ ${p}gfx4
├─ ${p}gfx5
├─ ${p}gfx6
├─ ${p}gfx7
├─ ${p}gfx8
├─ ${p}gfx9
├─ ${p}gfx10
├─ ${p}gfx11
├─ ${p}gfx12
├─ ${p}metallic
├─ ${p}ice
├─ ${p}snow
├─ ${p}impressive
├─ ${p}matrix
├─ ${p}neon
├─ ${p}light
├─ ${p}devil
├─ ${p}purple
├─ ${p}thunder
├─ ${p}leaves
├─ ${p}1917
├─ ${p}arena
├─ ${p}hacker
├─ ${p}sand
├─ ${p}blackpink
├─ ${p}glitch
├─ ${p}fire
├─ ${p}slice
├─ ${p}glow
├─ ${p}gitch1
├─ ${p}steal
├─ ${p}avenger
├─ ${p}marvel
├─ ${p}glitch2
├─ ${p}grafiti
│
╰─[ END LOGO MODULE ]

╭─[ 09 / 🛠️ TOOLS ]
│
├─ ${p}ss
├─ ${p}ssweb
├─ ${p}translate
├─ ${p}tr
├─ ${p}qrcode
├─ ${p}qr
├─ ${p}shorturl
├─ ${p}urlshortener
├─ ${p}calculator
├─ ${p}calc
├─ ${p}hash
├─ ${p}base64
├─ ${p}binary
├─ ${p}encrypt
├─ ${p}decrypt
├─ ${p}timestamp
├─ ${p}currency
├─ ${p}crypto
├─ ${p}weather
├─ ${p}news
├─ ${p}livescore
├─ ${p}reminder
├─ ${p}lyrics
├─ ${p}count
├─ ${p}reverse
├─ ${p}case
├─ ${p}palindrome
├─ ${p}age
├─ ${p}vv
├─ ${p}vv2
├─ ${p}delete
├─ ${p}savecontact
├─ ${p}device
├─ ${p}netflix
├─ ${p}paste
├─ ${p}fliptext
├─ ${p}binarytotext
├─ ${p}readmore
├─ ${p}cpu
├─ ${p}npm
├─ ${p}imdb
├─ ${p}horo
├─ ${p}google
├─ ${p}image
├─ ${p}define
├─ ${p}grayscale
├─ ${p}invert
├─ ${p}sepia
├─ ${p}sharpen
├─ ${p}readqr
├─ ${p}qmaker
├─ ${p}smallcaps
├─ ${p}flip
├─ ${p}stext
├─ ${p}ephoto
├─ ${p}excard
├─ ${p}forwarded
├─ ${p}wiki
├─ ${p}element
├─ ${p}wattpad
├─ ${p}ytsearch
├─ ${p}scloud
├─ ${p}shazam
├─ ${p}ocr
├─ ${p}earthquake
├─ ${p}emojigif
├─ ${p}bratpink
├─ ${p}bratvid
├─ ${p}bratclassic
├─ ${p}bratimg
├─ ${p}bratimghd
├─ ${p}bratwindows
├─ ${p}brattimoty
├─ ${p}bratanime
├─ ${p}bratgura
├─ ${p}prayertime
├─ ${p}quran
├─ ${p}asmaulhusna
├─ ${p}dua
│
╰─[ END TOOLS MODULE ]

╭─[ 10 / 🕵️ STALK ]
│
├─ ${p}gitstalk
├─ ${p}npmstalk
├─ ${p}tgstalk
├─ ${p}ttstalk
├─ ${p}xstalk
├─ ${p}thrstalk
├─ ${p}pinstalk
├─ ${p}genshin
│
╰─[ END STALK MODULE ]

╭─[ 11 / 🎮 GAMES ]
│
├─ ${p}trivia
├─ ${p}scramble
├─ ${p}wordle
├─ ${p}hangman
├─ ${p}guess
├─ ${p}ttt
├─ ${p}tictactoe
├─ ${p}wyr
├─ ${p}rps
├─ ${p}slots
├─ ${p}truth
├─ ${p}dare
├─ ${p}riddle
├─ ${p}8ball
├─ ${p}dice
├─ ${p}coin
├─ ${p}random
├─ ${p}pick
├─ ${p}guessflag
├─ ${p}guessanime
├─ ${p}guessgenshin
├─ ${p}guessgame
├─ ${p}guesslogo
├─ ${p}guesshero
├─ ${p}hint
├─ ${p}giveup
│
╰─[ END GAMES MODULE ]

╭─[ 12 / 🎯 FUN ]
│
├─ ${p}joke
├─ ${p}fact
├─ ${p}quote
├─ ${p}compliment
├─ ${p}insult
├─ ${p}roast
├─ ${p}flirt
├─ ${p}ship
├─ ${p}simp
├─ ${p}stupid
├─ ${p}shayari
├─ ${p}goodnight
├─ ${p}roseday
├─ ${p}iloveyou
├─ ${p}couplepp
├─ ${p}coffe
├─ ${p}quotes
├─ ${p}joke2
├─ ${p}question
├─ ${p}teddy
├─ ${p}lovemsg
├─ ${p}handsome
├─ ${p}pretty
├─ ${p}weeb
├─ ${p}waifu
│
╰─[ END FUN MODULE ]

╭─[ 13 / 🖼️ PIES ]
│
├─ ${p}pies
├─ ${p}india
├─ ${p}china
├─ ${p}japan
├─ ${p}korea
├─ ${p}thai
├─ ${p}malaysia
│
╰─[ END PIES MODULE ]

╭─[ 14 / 🌸 ANIME ]
│
├─ ${p}pokemon
├─ ${p}pokepic
├─ ${p}animepic
├─ ${p}animewall
├─ ${p}wallpaper
├─ ${p}animenews
│
╰─[ END ANIME MODULE ]

╭─[ 15 / 👑 PREMIUM ]
│
├─ ${p}premium
├─ ${p}setbotpp
├─ ${p}autoreply
├─ ${p}groupprivate
├─ ${p}away
├─ ${p}schedule
├─ ${p}filter
├─ ${p}persona
├─ ${p}ghost
├─ ${p}chreact
├─ ${p}pollvote
│
╰─[ END PREMIUM MODULE ]

╭─[ SYSTEM FOOTER ]
│
├─ ❄️BOT NAME: 𝗠𝗜𝗡𝗜 𝗭𝗬𝗥𝗔
├─ ⚡STATUS : ONLINE
├─ 💠POWERED: 𝗠𝗜𝗡𝗜 𝗭𝗬𝗥𝗔
│
╰─[ ᴍɪɴɪ-ᴢʏʀᴀ ]

>  Powered by faceless 
>       ᴍɪɴɪ-ᴢʏʀᴀ 
>   ©2026 reserved`;

      await reply(menu);
    } catch (e) {
      await reply(`❌ Menu failed: ${e.message}`);
    }
  }
};
