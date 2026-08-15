/* ============================================================================
   MULTILINGUAL OSINT LAYER

   English-only searching is the single biggest blind spot on this board. Most
   of these subjects are tied to Honduras, Venezuela, Colombia, Mexico, Bulgaria,
   Russia, Vietnam or India — and the reporting that actually moves a case is
   published locally, in the local language, often by outlets Google's English
   index ranks nowhere.

   This module turns a target's OFFICIAL country ties into native-language
   queries against native outlets and registries. It generates queries; it does
   not invent results.
   ========================================================================== */

export const LANGUAGES = {
  es: { name: 'Spanish', flag: '🇪🇸' },
  pt: { name: 'Portuguese', flag: '🇧🇷' },
  bg: { name: 'Bulgarian', flag: '🇧🇬' },
  ru: { name: 'Russian', flag: '🇷🇺' },
  uk: { name: 'Ukrainian', flag: '🇺🇦' },
  vi: { name: 'Vietnamese', flag: '🇻🇳' },
  hi: { name: 'Hindi', flag: '🇮🇳' },
  gu: { name: 'Gujarati', flag: '🇮🇳' },
  ar: { name: 'Arabic', flag: '🇸🇦' },
  zh: { name: 'Chinese', flag: '🇨🇳' },
  tr: { name: 'Turkish', flag: '🇹🇷' },
  de: { name: 'German', flag: '🇩🇪' },
  fr: { name: 'French', flag: '🇫🇷' },
  ro: { name: 'Romanian', flag: '🇷🇴' },
  sr: { name: 'Serbian', flag: '🇷🇸' },
  el: { name: 'Greek', flag: '🇬🇷' },
}

/* Country -> languages + the outlets/registries worth querying there.
   Sites chosen because they publish court, police and corporate records or do
   real investigative crime reporting in-country. */
export const COUNTRY_DESKS = {
  Honduras: {
    langs: ['es'],
    outlets: ['laprensa.hn', 'elheraldo.hn', 'proceso.hn', 'criterio.hn', 'contracorriente.red', 'insightcrime.org'],
    registries: ['Instituto de la Propiedad (IP)', 'Registro Mercantil de Honduras', 'Poder Judicial de Honduras — expedientes'],
  },
  Guatemala: {
    langs: ['es'],
    outlets: ['prensalibre.com', 'elperiodico.com.gt', 'nomada.gt', 'insightcrime.org'],
    registries: ['Registro Mercantil de Guatemala', 'Organismo Judicial — consulta de casos'],
  },
  Venezuela: {
    langs: ['es'],
    outlets: ['elpitazo.net', 'runrun.es', 'armando.info', 'efectococuyo.com', 'insightcrime.org'],
    registries: ['SAREN (registros y notarías)', 'Registro Mercantil'],
  },
  Colombia: {
    langs: ['es'],
    outlets: ['eltiempo.com', 'semana.com', 'lasillavacia.com', 'verdadabierta.com', 'insightcrime.org'],
    registries: ['RUES (Registro Único Empresarial)', 'Rama Judicial — consulta de procesos', 'Fiscalía — noticias criminales'],
  },
  Mexico: {
    langs: ['es'],
    outlets: ['reforma.com', 'eluniversal.com.mx', 'proceso.com.mx', 'riodoce.mx', 'zetatijuana.com', 'insightcrime.org'],
    registries: ['SIGER / Registro Público de Comercio', 'Consejo de la Judicatura Federal — expedientes'],
  },
  Bulgaria: {
    langs: ['bg'],
    outlets: ['bivol.bg', 'boulevardbulgaria.bg', 'capital.bg', 'dnevnik.bg', 'mediapool.bg', 'occrp.org'],
    registries: ['Търговски регистър (Commercial Register)', 'Имотен регистър (Property Register)'],
  },
  Russia: {
    langs: ['ru'],
    outlets: ['meduza.io', 'novayagazeta.eu', 'theins.ru', 'kommersant.ru', 'rbc.ru', 'bellingcat.com'],
    registries: ['ЕГРЮЛ / ЕГРИП (company register)', 'Росреестр (property)', 'ФССП (bailiff / debt database)'],
  },
  Ukraine: { langs: ['uk', 'ru'], outlets: ['pravda.com.ua', 'nashigroshi.org', 'occrp.org'], registries: ['YouControl', 'Опендатабот'] },
  Vietnam: {
    langs: ['vi'],
    outlets: ['vnexpress.net', 'tuoitre.vn', 'thanhnien.vn', 'congan.com.vn'],
    registries: ['Cổng thông tin quốc gia về đăng ký doanh nghiệp (business register)'],
  },
  India: {
    langs: ['hi', 'gu'],
    outlets: ['timesofindia.indiatimes.com', 'indianexpress.com', 'divyabhaskar.co.in', 'sandesh.com'],
    registries: ['MCA21 (Ministry of Corporate Affairs)', 'eCourts India — case status'],
  },
  Brazil: { langs: ['pt'], outlets: ['g1.globo.com', 'folha.uol.com.br', 'piaui.folha.uol.com.br'], registries: ['JUCESP', 'Consulta processual — TJ'] },
  Germany: { langs: ['de'], outlets: ['spiegel.de', 'zdf.de', 'sueddeutsche.de'], registries: ['Handelsregister', 'Bundesanzeiger'] },
  Turkey: { langs: ['tr'], outlets: ['cumhuriyet.com.tr', 'diken.com.tr'], registries: ['Ticaret Sicil Gazetesi'] },
  Greece: { langs: ['el'], outlets: ['kathimerini.gr', 'documentonews.gr'], registries: ['ΓΕΜΗ (business register)'] },
  UAE: { langs: ['ar'], outlets: ['thenationalnews.com', 'occrp.org'], registries: ['DMCC / DIFC registries', 'UAE National Economic Register'] },
}

/* Crime vocabulary per language — the terms local outlets actually print. */
const TERMS = {
  es: ['prófugo', 'capturado', 'detenido', 'extradición', 'recompensa', 'orden de captura', 'allanamiento', 'paradero'],
  pt: ['foragido', 'preso', 'extradição', 'recompensa', 'mandado de prisão'],
  bg: ['издирван', 'задържан', 'екстрадиция', 'награда', 'обвинение', 'прокуратура'],
  ru: ['в розыске', 'задержан', 'экстрадиция', 'вознаграждение', 'уголовное дело'],
  uk: ['у розшуку', 'затриманий', 'екстрадиція', 'винагорода'],
  vi: ['truy nã', 'bắt giữ', 'dẫn độ', 'tiền thưởng'],
  hi: ['वांछित', 'गिरफ्तार', 'प्रत्यर्पण', 'इनाम'],
  gu: ['વોન્ટેડ', 'ધરપકડ', 'પ્રત્યાર્પણ'],
  ar: ['مطلوب', 'اعتقال', 'تسليم المطلوبين', 'مكافأة'],
  zh: ['通缉', '逮捕', '引渡', '悬赏'],
  tr: ['firari', 'yakalandı', 'iade', 'ödül'],
  de: ['gesucht', 'festgenommen', 'Auslieferung', 'Belohnung'],
  fr: ['recherché', 'arrêté', 'extradition', 'récompense'],
  ro: ['urmărit', 'reținut', 'extrădare', 'recompensă'],
  sr: ['у бекству', 'ухапшен', 'екстрадиција'],
  el: ['καταζητούμενος', 'συνελήφθη', 'έκδοση'],
}

/* Map a target's official free-text country ties to desks. */
export function desksForTarget(target) {
  const hay = [
    target?.nationality, target?.placeOfBirth, target?.remarks,
    target?.caution, target?.description, target?.subjects,
  ].filter(Boolean).join(' ')

  const hits = new Set()
  const probes = {
    Honduras: /hondura/i, Guatemala: /guatemal/i, Venezuela: /venezuel/i,
    Colombia: /colombia/i, Mexico: /mexic|sinaloa|jalisco|tijuana|juarez/i,
    Bulgaria: /bulgaria/i, Russia: /russia|russian federation|anapa/i,
    Ukraine: /ukrain/i, Vietnam: /vietnam/i, India: /india|gujarat/i,
    Brazil: /brazil/i, Germany: /german/i, Turkey: /turkey|turkish/i,
    Greece: /greece|greek/i, UAE: /emirates|dubai|abu dhabi/i,
  }
  for (const [country, re] of Object.entries(probes)) if (re.test(hay)) hits.add(country)
  return [...hits].map(c => ({ country: c, ...COUNTRY_DESKS[c] })).filter(d => d.langs)
}

/* Build native-language queries for one desk. */
export function nativeQueries(target, desk) {
  const name = String(target?.name || '').trim()
  // Latin-American naming: the paternal surname pair is what local press prints.
  const parts = name.replace(/,/g, '').split(/\s+/).filter(Boolean)
  const shortName = parts.length >= 3 ? parts.slice(-2).join(' ') : name
  const aliases = String(target?.aliases || '')
    .split(',').map(a => a.trim().replace(/^"|"$/g, '')).filter(Boolean).slice(0, 3)

  const out = []
  for (const lang of desk.langs) {
    const terms = TERMS[lang] || []
    const statusQ = `"${shortName}" (${terms.slice(0, 4).join(' OR ')})`
    const siteQ = `"${shortName}" (${desk.outlets.slice(0, 4).map(s => `site:${s}`).join(' OR ')})`
    const aliasQ = aliases.length ? `(${aliases.map(a => `"${a}"`).join(' OR ')}) ${terms[0] || ''}` : ''

    out.push(
      { lang, label: `${LANGUAGES[lang]?.flag || ''} Status check (${LANGUAGES[lang]?.name})`, q: statusQ,
        url: `https://www.google.com/search?q=${encodeURIComponent(statusQ)}&lr=lang_${lang}` },
      { lang, label: `${LANGUAGES[lang]?.flag || ''} Local outlets only`, q: siteQ,
        url: `https://www.google.com/search?q=${encodeURIComponent(siteQ)}` },
    )
    if (aliasQ) {
      out.push({ lang, label: `${LANGUAGES[lang]?.flag || ''} Street alias sweep`, q: aliasQ,
        url: `https://www.google.com/search?q=${encodeURIComponent(aliasQ)}&lr=lang_${lang}` })
    }
  }
  // GDELT indexes 100+ languages natively — the single best multilingual pivot.
  out.push({
    lang: 'multi',
    label: '🌐 GDELT all-language sweep (translated)',
    q: `"${shortName}" — every language GDELT indexes`,
    url: `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(`"${shortName}"`)}&mode=ArtList&format=html&timespan=12m&trans=googtrans`,
  })
  return out
}

/* Free translation via the same endpoint the app already proxies. */
export async function translate(text, to = 'en') {
  const t = String(text || '').trim()
  if (!t) return { ok: false, text: '' }
  try {
    const res = await fetch(
      `/api/translate/translate_a/single?client=gtx&sl=auto&tl=${to}&dt=t&q=${encodeURIComponent(t.slice(0, 4500))}`,
    )
    if (!res.ok) throw new Error(String(res.status))
    const json = await res.json()
    const out = (json?.[0] || []).map(seg => seg?.[0] ?? '').join('')
    return { ok: true, text: out || t, detected: json?.[2] || '' }
  } catch {
    return { ok: false, text: t }
  }
}
