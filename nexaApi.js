// ============================================================
// telegram_bot/nexaApi.js — Helper API NexaDev
// Fallback key: kaze -> aether -> gagal
// ============================================================
const fetch = require('node-fetch')
const { NEXA_API_BASE, NEXA_API_KEYS } = require('./config')

async function callNexa(endpoint) {
  let lastErr = null
  for (const key of NEXA_API_KEYS) {
    const url = `${NEXA_API_BASE}${endpoint}&key=${key}`
    try {
      const res = await fetch(url, { timeout: 20000 })
      const text = await res.text()
      let json
      try { json = JSON.parse(text) } catch (_) { json = { raw: text } }

      // Deteksi limit/error dari response
      const isLimited =
        (json && (json.limit === true || json.limited === true || json.status === false && /limit|expired|invalid/i.test(json.message || json.msg || ''))) ||
        /limit|expired|invalid key|quota/i.test(text)

      if (isLimited) {
        lastErr = new Error(`Key '${key}' limit/error: ${json.message || json.msg || text}`)
        continue
      }
      return { ok: true, key, data: json, raw: text }
    } catch (e) {
      lastErr = e
      continue
    }
  }
  return { ok: false, error: lastErr ? lastErr.message : 'Semua key gagal' }
}

// /reactch {url} {emoji}
async function reactChannel(url, emoji) {
  const endpoint = `/api/rch?url=${encodeURIComponent(url)}&reaction=${encodeURIComponent(emoji)}`
  return callNexa(endpoint)
}

// /amsend {gmail}
async function amSend(email) {
  const endpoint = `/am/send/?email=${encodeURIComponent(email)}`
  return callNexa(endpoint)
}

// /amverif {gmail} {link}
async function amVerif(email, link) {
  const endpoint = `/am/verif/?email=${encodeURIComponent(email)}&link=${encodeURIComponent(link)}`
  return callNexa(endpoint)
}

module.exports = { reactChannel, amSend, amVerif }
