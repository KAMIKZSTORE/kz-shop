// ============================================================
// telegram_bot/bot.js — Logika utama bot
// ============================================================
const fs = require('fs')
const path = require('path')
const config = require('./config')
const tg = require('./api')
const { reactChannel, amSend, amVerif } = require('./nexaApi')

const { BOT_NAME, ADMIN_ID, THUMB_PATH } = config

// ---------- State ----------
// User yang sedang menunggu input command (mode)
const userMode = new Map() // chat_id -> { cmd: 'amsend'|'amverif'|'reactch'|'banwa', step: 0, data: {} }

// User yang sedang chat dengan CS
const csChat = new Map() // user_id -> { cs_id, active: true }
const csToUser = new Map() // cs_id -> user_id (mapping balik)

// ---------- Util ----------
function escapeHTML(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function userInfo(u) {
  const name = escapeHTML(u.first_name || '')
  const last = u.last_name ? ' ' + escapeHTML(u.last_name) : ''
  const uname = u.username ? `@${u.username}` : '(tanpa username)'
  return `👤 <b>Nama</b>: ${name}${last}\n🆔 <b>ID</b>: <code>${u.id}</code>\n🌐 <b>Username</b>: ${uname}`
}

// ---------- Keyboard builders ----------
function mainMenuKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '🛠  Tools',    callback_data: 'menu:tools' }],
      [{ text: '🔌  Api',      callback_data: 'menu:api' }],
      [{ text: '💬  Chat CS',  callback_data: 'menu:cs' }],
      [{ text: 'ℹ️  Informasi', callback_data: 'menu:info' }]
    ]
  }
}

function toolsMenuKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '📧  Am Send',     callback_data: 'tool:amsend' }],
      [{ text: '✅  Am Verif',    callback_data: 'tool:amverif' }],
      [{ text: '💖  React Channel', callback_data: 'tool:reactch' }],
      [{ text: '🚫  Ban WA', callback_data: 'tool:banwa' }],
      [{ text: '🔙  Kembali',     callback_data: 'menu:back' }]
    ]
  }
}

function apiMenuKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '🔌  Api — Segera Hadir', callback_data: 'menu:noop' }],
      [{ text: '🔙  Kembali', callback_data: 'menu:back' }]
    ]
  }
}

function csConfirmKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: 'Lanjut ✅', callback_data: 'cs:start' },
        { text: 'Cancel ❌', callback_data: 'cs:cancel' }
      ]
    ]
  }
}

function backToMainMenuKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '🔙  Kembali ke Menu', callback_data: 'menu:back' }]
    ]
  }
}

// ---------- Pesan ----------
function welcomeText(user) {
  return `Halo ${escapeHTML(user.first_name || 'Kak')}! 👋\n\nSelamat datang di <b>${BOT_NAME}</b> ✨\n\n─── <b>Informasi User</b> ───\n${userInfo(user)}\n\nSilakan pilih menu di bawah ini untuk mulai menggunakan bot.`
}

function toolsText() {
  return `<b>🛠 Tools</b>\n\nPilih salah satu fitur di bawah:\n\n• <b>Am Send</b> — Kirim kode OTP Alight Motion ke email\n• <b>Am Verif</b> — Verifikasi link Alight Motion\n• <b>React Channel</b> — React emoji pada post WhatsApp Channel\n• <b>Ban WA</b> — Pelarangan nomor WA`
}

function infoText() {
  return `<b>ℹ️ Informasi Bot</b>\n\n🤖 <b>Nama</b>: ${BOT_NAME}\n🛠 <b>Status</b>: Online\n⚡ <b>Engine</b>: Polling Mode\n🔐 <b>API</b>: NexaDev (multi-key fallback)\n\nBot ini menyediakan berbagai tools otomatis. Gunakan dengan bijak.`
}

// ---------- Handler /start ----------
async function handleStart(user, chat_id) {
  const caption = welcomeText(user)
  const exists = fs.existsSync(THUMB_PATH)
  const extra = { parse_mode: 'HTML', reply_markup: mainMenuKeyboard() }

  if (exists) {
    await tg.sendPhoto(chat_id, THUMB_PATH, caption, extra)
  } else {
    await tg.sendMessage(chat_id, caption, extra)
  }
}

// ---------- Setup Menu Command (Tombol Menu di kolom chat) ----------
async function setupBotMenu() {
  const commands = [
    { command: 'start', description: 'Mulai bot / Tampilkan menu' },
    { command: 'amsend', description: 'Kirim OTP Alight Motion' },
    { command: 'amverif', description: 'Verifikasi link Alight Motion' },
    { command: 'reactch', description: 'React WhatsApp Channel' },
    { command: 'banwa', description: 'Ban WA' },
    { command: 'endcs', description: 'Akhiri sesi Chat CS' }
  ]
  await tg.setMyCommands(commands)
  console.log('[BOT] Menu command berhasil didaftarkan.')
}

// ---------- Callback router ----------
async function handleCallback(cb) {
  const { message, from, data } = cb
  const chat_id = message.chat.id
  const message_id = message.message_id

  await tg.call('answerCallbackQuery', { callback_query_id: cb.id })

  // --- Menu utama ---
  if (data === 'menu:tools') {
    await tg.editMessageCaption(chat_id, message_id, toolsText(), {
      parse_mode: 'HTML',
      reply_markup: toolsMenuKeyboard()
    }).catch(() => {})
    return
  }

  if (data === 'menu:api') {
    await tg.editMessageCaption(chat_id, message_id, `<b>🔌 Api</b>\n\nHalaman API sedang dalam pengembangan. Tombol ini sengaja di-<b>inactive</b> sementara.`, {
      parse_mode: 'HTML',
      reply_markup: apiMenuKeyboard()
    }).catch(() => {})
    return
  }

  if (data === 'menu:info') {
    await tg.editMessageCaption(chat_id, message_id, infoText(), {
      parse_mode: 'HTML',
      reply_markup: backToMainMenuKeyboard()
    }).catch(() => {})
    return
  }

  if (data === 'menu:cs') {
    await tg.editMessageCaption(chat_id, message_id, `<b>💬 Chat CS</b>\n\nApakah Anda ingin memulai chat dengan Customer Service?`, {
      parse_mode: 'HTML',
      reply_markup: csConfirmKeyboard()
    }).catch(() => {})
    return
  }

  if (data === 'menu:back') {
    const caption = welcomeText(from)
    await tg.editMessageCaption(chat_id, message_id, caption, {
      parse_mode: 'HTML',
      reply_markup: mainMenuKeyboard()
    }).catch(async () => {
      const exists = fs.existsSync(THUMB_PATH)
      if (exists) {
        await tg.sendPhoto(chat_id, THUMB_PATH, caption, { parse_mode: 'HTML', reply_markup: mainMenuKeyboard() })
      } else {
        await tg.sendMessage(chat_id, caption, { parse_mode: 'HTML', reply_markup: mainMenuKeyboard() })
      }
    })
    return
  }

  if (data === 'menu:noop') return

  // --- Tools ---
  if (data === 'tool:amsend') {
    userMode.set(chat_id, { cmd: 'amsend', step: 1, data: {} })
    await tg.sendMessage(chat_id,
      `<b>📧 Am Send</b>\n\nKirimkan <b>email aktif</b> yang akan dikirim kode OTP Alight Motion (bebas domain apa saja).\n\nContoh: <code>namasaya@gmail.com</code> atau <code>namasaya@yahoo.com</code>`,
      { parse_mode: 'HTML', reply_markup: backToMainMenuKeyboard() })
    return
  }

  if (data === 'tool:amverif') {
    userMode.set(chat_id, { cmd: 'amverif', step: 1, data: {} })
    await tg.sendMessage(chat_id,
      `<b>✅ Am Verif</b>\n\nKirim dengan format:\n<code>email|https://alight-creative.firebaseapp.com/__________</code>\n\nContoh:\n<code>namasaya@email.com|https://alight-creative.firebaseapp.com/verify?token=abc123</code>`,
      { parse_mode: 'HTML', reply_markup: backToMainMenuKeyboard() })
    return
  }

  if (data === 'tool:reactch') {
    userMode.set(chat_id, { cmd: 'reactch', step: 1, data: {} })
    await tg.sendMessage(chat_id,
      `<b>💖 React Channel</b>\n\nKirim dengan format:\n<code>link|emoji</code>\n\nContoh:\n<code>https://whatsapp.com/channel/0029Vb7O5m5G8l5FCtIAis3J/2468|👍</code>`,
      { parse_mode: 'HTML', reply_markup: backToMainMenuKeyboard() })
    return
  }

  if (data === 'tool:banwa') {
    userMode.set(chat_id, { cmd: 'banwa', step: 1, data: {} })
    await tg.sendMessage(chat_id,
      `<b>🚫 Ban WA</b>\n\nKirimkan <b>nomor WhatsApp</b> yang ingin di-ban.\n\nContoh: <code>6281234567890</code>`,
      { parse_mode: 'HTML', reply_markup: backToMainMenuKeyboard() })
    return
  }

  // --- CS ---
  if (data === 'cs:start') {
    csChat.set(from.id, { cs_id: ADMIN_ID, active: true })
    csToUser.set(ADMIN_ID, from.id)
    await tg.editMessageCaption(chat_id, message_id,
      `<b>💬 Chat CS Aktif</b>\n\nAnda sekarang terhubung dengan Customer Service.\nKirim pesan apa saja, CS akan membalasnya.\n\nKetik <code>/endcs</code> untuk mengakhiri sesi.`,
      { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🔚 Akhiri Chat', callback_data: 'cs:end' }]] } }
    ).catch(() => {})

    await tg.sendMessage(ADMIN_ID,
      `🔔 <b>Percakapan baru</b>\n\n${userInfo(from)}\n\nMemulai chat CS. Silakan balas pesan user ini.`,
      { parse_mode: 'HTML' })
    return
  }

  if (data === 'cs:cancel') {
    await tg.editMessageCaption(chat_id, message_id,
      `<b>❌ Dibatalkan</b>\n\nAnda membatalkan permintaan chat CS.`,
      { parse_mode: 'HTML', reply_markup: backToMainMenuKeyboard() }
    ).catch(() => {})
    return
  }

  if (data === 'cs:end') {
    csChat.delete(from.id)
    csToUser.delete(ADMIN_ID)
    await tg.editMessageCaption(chat_id, message_id,
      `<b>🔚 Sesi CS Berakhir</b>\n\nTerima kasih telah menghubungi Customer Service.`,
      { parse_mode: 'HTML', reply_markup: mainMenuKeyboard() }
    ).catch(() => {})
    return
  }
}

// ---------- Text / command handler ----------
async function handleText(msg) {
  const chat_id = msg.chat.id
  const text = msg.text || ''
  const user = msg.from

  // /start
  if (/^\/start/i.test(text)) {
    userMode.delete(chat_id)
    return handleStart(user, chat_id)
  }

  // /endcs
  if (/^\/endcs/i.test(text)) {
    if (csChat.has(user.id)) {
      csChat.delete(user.id)
      csToUser.delete(ADMIN_ID)
      await tg.sendMessage(chat_id, '🔚 Sesi chat CS telah diakhiri.', { reply_markup: mainMenuKeyboard() })
      await tg.sendMessage(ADMIN_ID, `🔚 Sesi chat dengan user <code>${user.id}</code> telah diakhiri.`, { parse_mode: 'HTML' })
    }
    return
  }

  // --- Mode Tools (menunggu input user) ---
  const mode = userMode.get(chat_id)
  if (mode) {
    return handleToolInput(chat_id, user, mode, text)
  }

  // --- Mode CS aktif ---
  if (csChat.has(user.id)) {
    // Forward ke CS
    await tg.sendMessage(ADMIN_ID,
      `📩 <b>Pesan dari user</b>\n\n${userInfo(user)}\n\n────────────\n${escapeHTML(text)}`,
      { parse_mode: 'HTML' })
    return
  }

  // --- CS membalas user ---
  if (user.id === ADMIN_ID && csToUser.has(ADMIN_ID)) {
    const targetUserId = csToUser.get(ADMIN_ID)
    await tg.sendMessage(targetUserId, `💬 <b>CS:</b>\n${escapeHTML(text)}`, { parse_mode: 'HTML' })
    return
  }

  // Default: kalau ga ada mode & ga ada sesi apapun, kasih hint
  if (!text.startsWith('/')) {
    await tg.sendMessage(chat_id, `Ketik /start untuk menampilkan menu.`, {
      reply_markup: mainMenuKeyboard()
    })
  }
}

// ---------- Handler input tool ----------
async function handleToolInput(chat_id, user, mode, text) {
  await tg.sendChatAction(chat_id, 'typing')

  // amsend {email}
  if (mode.cmd === 'amsend') {
    const email = text.trim()
    if (!/^[\w.+-]+@[\w-]+\.[\w.-]+$/i.test(email)) {
      return tg.sendMessage(chat_id, '⚠️ Format email tidak valid. Kirim ulang email:', { parse_mode: 'HTML', reply_markup: backToMainMenuKeyboard() })
    }
    const r = await amSend(email)
    userMode.delete(chat_id)
    if (!r.ok) return tg.sendMessage(chat_id, `❌ <b>Gagal</b>\n\n${escapeHTML(r.error)}\n\nSemua key API sedang limit/cadangan habis.`, { parse_mode: 'HTML', reply_markup: mainMenuKeyboard() })
    
    const d = r.data
    const status = d.status === true || d.success === true ? 'Berhasil' : 'Gagal'
    const info = d.message || d.msg || d.info || JSON.stringify(d).slice(0, 400)
    return tg.sendMessage(chat_id,
      `<b>📧 Am Send — ${status}</b>\n\nEmail: <code>${escapeHTML(email)}</code>\nKey: <code>${r.key}</code>\nResponse: <code>${escapeHTML(String(info))}</code>`,
      { parse_mode: 'HTML', reply_markup: mainMenuKeyboard() })
  }

  // amverif {email} {link}
  if (mode.cmd === 'amverif') {
    const [email, link] = text.split('|').map(s => (s || '').trim())
    if (!email || !link) return tg.sendMessage(chat_id, '⚠️ Format salah.\nGunakan: <code>email|https://alight-creative.firebaseapp.com/...</code>', { parse_mode: 'HTML', reply_markup: backToMainMenuKeyboard() })
    
    if (!/^[\w.+-]+@[\w-]+\.[\w.-]+$/i.test(email)) {
      return tg.sendMessage(chat_id, '⚠️ Format email tidak valid.', { parse_mode: 'HTML', reply_markup: backToMainMenuKeyboard() })
    }
    if (!/^https?:\/\/.+/i.test(link)) {
      return tg.sendMessage(chat_id, '⚠️ Link tidak valid.', { parse_mode: 'HTML', reply_markup: backToMainMenuKeyboard() })
    }
    
    const r = await amVerif(email, link)
    userMode.delete(chat_id)
    if (!r.ok) return tg.sendMessage(chat_id, `❌ <b>Gagal</b>\n\n${escapeHTML(r.error)}`, { parse_mode: 'HTML', reply_markup: mainMenuKeyboard() })
    
    const d = r.data
    const status = d.status === true || d.success === true ? 'Berhasil' : 'Gagal'
    const info = d.message || d.msg || d.info || JSON.stringify(d).slice(0, 400)
    return tg.sendMessage(chat_id,
      `<b>✅ Am Verif — ${status}</b>\n\nEmail: <code>${escapeHTML(email)}</code>\nLink: <code>${escapeHTML(link)}</code>\nKey: <code>${r.key}</code>\nResponse: <code>${escapeHTML(String(info))}</code>`,
      { parse_mode: 'HTML', reply_markup: mainMenuKeyboard() })
  }

  // reactch {link} {emoji}
  if (mode.cmd === 'reactch') {
    const [link, emoji] = text.split('|').map(s => (s || '').trim())
    if (!link || !emoji) return tg.sendMessage(chat_id, '⚠️ Format salah.\nGunakan: <code>link|emoji</code>', { parse_mode: 'HTML', reply_markup: backToMainMenuKeyboard() })
    
    if (!/^https?:\/\/.+/i.test(link)) {
      return tg.sendMessage(chat_id, '⚠️ Link tidak valid.', { parse_mode: 'HTML', reply_markup: backToMainMenuKeyboard() })
    }
    const r = await reactChannel(link, emoji)
    userMode.delete(chat_id)
    if (!r.ok) return tg.sendMessage(chat_id, `❌ <b>Gagal</b>\n\n${escapeHTML(r.error)}`, { parse_mode: 'HTML', reply_markup: mainMenuKeyboard() })
    
    const d = r.data
    const status = d.status === true || d.success === true ? 'Berhasil' : 'Gagal'
    const info = d.message || d.msg || d.info || JSON.stringify(d).slice(0, 400)
    return tg.sendMessage(chat_id,
      `<b>💖 React Channel — ${status}</b>\n\nLink: <code>${escapeHTML(link)}</code>\nEmoji: ${escapeHTML(emoji)}\nKey: <code>${r.key}</code>\nResponse: <code>${escapeHTML(String(info))}</code>`,
      { parse_mode: 'HTML', reply_markup: mainMenuKeyboard() })
  }

  // banwa (simulasi)
  if (mode.cmd === 'banwa') {
    const num = text.replace(/\D/g, '')
    if (!num || num.length < 8) return tg.sendMessage(chat_id, '⚠️ Nomor tidak valid. Contoh: <code>6281234567890</code>', { parse_mode: 'HTML', reply_markup: backToMainMenuKeyboard() })
    
    userMode.delete(chat_id)
    return tg.sendMessage(chat_id,
      `<b>🚫 Ban WA — Berhasil</b>\n\nNomor: <code>${num}</code>\nStatus: <i>Ter-ban</i>`,
      { parse_mode: 'HTML', reply_markup: mainMenuKeyboard() })
  }
}

// ---------- Polling loop ----------
async function startPolling() {
  console.log('[BOT] Mulai polling...')
  let offset = 0

  const me = await tg.getMe()
  if (me.ok) {
    console.log(`[BOT] Login sebagai @${me.result.username} (${me.result.first_name})`)
  }

  // Daftarkan menu tombol command di kolom chat
  await setupBotMenu()

  while (true) {
    try {
      const upd = await tg.getUpdates(offset, 30)
      if (!upd.ok || !upd.result || upd.result.length === 0) {
        await new Promise(r => setTimeout(r, config.POLL_INTERVAL))
        continue
      }
      for (const u of upd.result) {
        offset = u.update_id + 1
        try {
          if (u.message) {
            await handleText(u.message)
          } else if (u.callback_query) {
            await handleCallback(u.callback_query)
          }
        } catch (e) {
          console.error('[BOT] Error handle update:', e.message)
        }
      }
    } catch (e) {
      console.error('[BOT] Polling error:', e.message)
      await new Promise(r => setTimeout(r, 3000))
    }
  }
}

// ---------- Run ----------
startPolling()
