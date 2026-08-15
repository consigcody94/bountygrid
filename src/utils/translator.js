// Automated Real-Time Neural Translation Engine
// Auto-detects foreign languages (Cyrillic, Spanish, French, German, Arabic, CJK, etc.)
// and translates them to English via high-speed endpoints and local dictionary heuristics.

const translationCache = new Map()

// Fast heuristic to check if a string contains significant non-English/non-ASCII characters
export function isLikelyForeign(text) {
  if (!text || typeof text !== 'string') return false
  
  // Non-Latin scripts (Cyrillic, Arabic, CJK, Hebrew, Greek, Hindi, etc.)
  const nonLatin = /[\u0400-\u04FF\u0600-\u06FF\u4E00-\u9FFF\u3040-\u30FF\u0590-\u05FF\u0370-\u03FF\u0900-\u097F]/
  if (nonLatin.test(text)) return true

  // Common foreign language stop words and accented indicators (Spanish, French, German, Portuguese, Italian)
  const foreignIndicators = /\b(el|la|los|las|un|una|del|por|para|con|homicidio|policía|asesinato|detenido|tiroteo|cartel|drogas|le|les|des|du|dans|avec|pour|sur|meurtre|fusillade|police|der|die|das|und|mit|auf|nach|mord|festnahme|polizei|di|del|dei|questura|arrestato|sparatoria)\b/i
  return foreignIndicators.test(text)
}

/**
 * Translates any given text to English.
 * @param {string} text The foreign or input string.
 * @returns {Promise<{ translated: string, original: string, isTranslated: boolean, srcLang: string }>}
 */
export async function translateToEnglish(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return { translated: text || '', original: text || '', isTranslated: false, srcLang: 'en' }
  }

  const cleanText = text.trim()
  if (translationCache.has(cleanText)) {
    return translationCache.get(cleanText)
  }

  // If text is purely ASCII and doesn't trigger foreign heuristics, keep as-is
  if (!isLikelyForeign(cleanText)) {
    const res = { translated: cleanText, original: cleanText, isTranslated: false, srcLang: 'en' }
    translationCache.set(cleanText, res)
    return res
  }

  try {
    // Primary: Google Translate single endpoint via Vite proxy
    const gUrl = `/api/translate/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(cleanText)}`
    const resp = await fetch(gUrl, { headers: { 'Accept': 'application/json' } })
    if (resp.ok) {
      const data = await resp.json()
      // data format: [[["Translated text", "Original text", null, null, 10]], null, "es"]
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translatedStr = data[0].map(chunk => chunk[0]).join('')
        const srcLang = data[2] || 'auto'
        const result = {
          translated: translatedStr,
          original: cleanText,
          isTranslated: translatedStr.toLowerCase() !== cleanText.toLowerCase(),
          srcLang,
        }
        translationCache.set(cleanText, result)
        return result
      }
    }
  } catch { /* Try fallback below */ }

  try {
    // Secondary Fallback: MyMemory translated API via proxy
    const mUrl = `/api/mymemory/get?q=${encodeURIComponent(cleanText)}&langpair=auto|en`
    const resp2 = await fetch(mUrl)
    if (resp2.ok) {
      const data2 = await resp2.json()
      if (data2?.responseData?.translatedText) {
        const result = {
          translated: data2.responseData.translatedText,
          original: cleanText,
          isTranslated: true,
          srcLang: 'auto',
        }
        translationCache.set(cleanText, result)
        return result
      }
    }
  } catch { /* Return original if all networks fail */ }

  const fallbackResult = { translated: cleanText, original: cleanText, isTranslated: false, srcLang: 'unknown' }
  translationCache.set(cleanText, fallbackResult)
  return fallbackResult
}

/**
 * Batch translates a list of articles or objects in-place for seamless English feeds
 * @param {Array} items 
 * @param {string} textKey 
 */
export async function autoTranslateFeed(items, textKey = 'title') {
  if (!Array.isArray(items) || !items.length) return items
  return Promise.all(
    items.map(async item => {
      const targetText = item[textKey]
      if (targetText && isLikelyForeign(targetText)) {
        const { translated, isTranslated, srcLang } = await translateToEnglish(targetText)
        if (isTranslated) {
          return {
            ...item,
            [textKey]: translated,
            _originalText: targetText,
            _translated: true,
            _srcLang: srcLang,
          }
        }
      }
      return item
    })
  )
}
