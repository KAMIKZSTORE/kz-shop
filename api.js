// ============================================================
// telegram_bot/api.js — Helper akses Telegram Bot API
// ============================================================
const fetch = require('node-fetch')
const fs = require('fs')
const path = require('path')
const { BOT_TOKEN, API_BASE } = require('./config')

async function call(method, params = {}, form = null) {
  const url = `${API_BASE}/bot${BOT_TOKEN}/${method}`
  try {
    if (form) {
      form.append('chat_id', params.chat_id)
      if (params.reply_to_message_id) form.append('reply_to_message_id', params.reply_to_message_id)
      if (params.parse_mode) form.append('parse_mode', params.parse_mode)
      if (params.caption) form.append('caption', params.caption)
      if (params.reply_markup) form.append('reply_markup', JSON.stringify(params.reply_markup))
      if (params.disable_web_page_preview) form.append('disable_web_page_preview', 'true')
      if (params.protect_content) form.append('protect_content', 'true')
      const res = await fetch(url, { method: 'POST', body: form })
      return await res.json()
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })
    return await res.json()
  } catch (e) {
    console.error('[TG-API] Error', method, e.message)
    return { ok: false, error: e.message }
  }
}

function sendMessage(chat_id, text, extra = {}) {
  return call('sendMessage', { chat_id, text, ...extra })
}

function sendPhoto(chat_id, photo, caption = '', extra = {}) {
  const FormData = require('form-data')
  const form = new FormData()
  if (Buffer.isBuffer(photo)) {
    form.append('photo', photo, { filename: 'thumb.jpg', contentType: 'image/jpeg' })
  } else {
    form.append('photo', fs.createReadStream(photo), { filename: path.basename(photo), contentType: 'image/jpeg' })
  }
  return call('sendPhoto', { chat_id, caption, ...extra }, form)
}

function sendChatAction(chat_id, action = 'typing') {
  return call('sendChatAction', { chat_id, action })
}

function editMessageText(chat_id, message_id, text, extra = {}) {
  return call('editMessageText', { chat_id, message_id, text, ...extra })
}

function editMessageReplyMarkup(chat_id, message_id, reply_markup) {
  return call('editMessageReplyMarkup', { chat_id, message_id, reply_markup })
}

function editMessageCaption(chat_id, message_id, caption, extra = {}) {
  return call('editMessageCaption', { chat_id, message_id, caption, ...extra })
}

function deleteMessage(chat_id, message_id) {
  return call('deleteMessage', { chat_id, message_id })
}

function getUpdates(offset, timeout = 20) {
  return call('getUpdates', { offset, timeout })
}

function getMe() {
  return call('getMe')
}

// Fungsi baru untuk mendaftarkan menu command (seperti di gambar 2)
function setMyCommands(commands) {
  return call('setMyCommands', { commands })
}

module.exports = {
  call,
  sendMessage,
  sendPhoto,
  sendChatAction,
  editMessageText,
  editMessageReplyMarkup,
  editMessageCaption,
  deleteMessage,
  getUpdates,
  getMe,
  setMyCommands
}
