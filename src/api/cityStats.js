import { jget } from './client.js'

/* ============================================================================
   LIVE PER-CITY CRIME STATS — FBI Crime Data Explorer, agency level.

   The bundled city matrix carries estimates for global metros. For US cities we
   can do far better than an estimate: the CDE agency endpoint returns the real
   reported rate for a specific police department, WITH state and national
   series in the same response, so a city can be benchmarked honestly.

   Anything this module returns is measured and attributed. When an agency is
   not found or does not report, it says so instead of falling back to a guess.
   ========================================================================== */

const FBI_KEY = 'iiHnOKfno2Mgkt5AynpvPpUQTEyxE77jo1RU8PIv'

// state name -> USPS abbr, for turning "Chicago, Illinois" into a lookup
const STATE_ABBR = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA',
  hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA', kansas: 'KS',
  kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD', massachusetts: 'MA',
  michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO', montana: 'MT',
  nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND',
  ohio: 'OH', oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI',
  'south carolina': 'SC', 'south dakota': 'SD', tennessee: 'TN', texas: 'TX',
  utah: 'UT', vermont: 'VT', virginia: 'VA', washington: 'WA', 'west virginia': 'WV',
  wisconsin: 'WI', wyoming: 'WY', 'district of columbia': 'DC',
}

// Known city -> state for the US metros in the bundled matrix.
const CITY_STATE = {
  'new york': 'NY', 'los angeles': 'CA', chicago: 'IL', houston: 'TX', phoenix: 'AZ',
  philadelphia: 'PA', 'san antonio': 'TX', 'san diego': 'CA', dallas: 'TX',
  'san jose': 'CA', austin: 'TX', jacksonville: 'FL', 'fort worth': 'TX',
  columbus: 'OH', charlotte: 'NC', 'san francisco': 'CA', indianapolis: 'IN',
  seattle: 'WA', denver: 'CO', boston: 'MA', nashville: 'TN', detroit: 'MI',
  memphis: 'TN', portland: 'OR', 'las vegas': 'NV', baltimore: 'MD',
  milwaukee: 'WI', albuquerque: 'NM', tucson: 'AZ', fresno: 'CA', sacramento: 'CA',
  atlanta: 'GA', 'kansas city': 'MO', miami: 'FL', oakland: 'CA', minneapolis: 'MN',
  cleveland: 'OH', 'new orleans': 'LA', 'st. louis': 'MO', 'saint louis': 'MO',
  pittsburgh: 'PA', cincinnati: 'OH', 'washington': 'DC', 'washington dc': 'DC',
  birmingham: 'AL', richmond: 'VA', buffalo: 'NY', newark: 'NJ', tampa: 'FL',
  orlando: 'FL', omaha: 'NE', tulsa: 'OK', wichita: 'KS', louisville: 'KY',
}

const agencyCache = new Map() // state -> agency array
const statsCache = new Map()  // cacheKey -> result

function resolveState(city) {
  const n = String(city?.name || '').toLowerCase().trim()
  if (CITY_STATE[n]) return CITY_STATE[n]
  const c = String(city?.country || '').toLowerCase()
  for (const [name, abbr] of Object.entries(STATE_ABBR)) {
    if (c.includes(name)) return abbr
  }
  return null
}

export function isUsCity(city) {
  return /united states|^us$|^usa$/i.test(city?.country || '') || city?.iso2 === 'US'
}

async function agenciesFor(stateAbbr) {
  if (agencyCache.has(stateAbbr)) return agencyCache.get(stateAbbr)
  const json = await jget(`/api/cde/agency/byStateAbbr/${stateAbbr}?API_KEY=${FBI_KEY}`, { timeout: 25000 })
  // Response is keyed by county; flatten to one array.
  const flat = []
  for (const v of Object.values(json || {})) if (Array.isArray(v)) flat.push(...v)
  agencyCache.set(stateAbbr, flat)
  return flat
}

/* Pick the police department that actually serves the named city. Prefer an
   exact "<City> Police Department" match before any fuzzy fallback, so we don't
   silently report a suburb's numbers as the city's. */
function pickAgency(agencies, cityName) {
  const n = cityName.toLowerCase().trim()
  const named = agencies.filter(a => (a.agency_name || '').toLowerCase().includes(n))
  if (!named.length) return null
  const exact = named.find(a => (a.agency_name || '').toLowerCase() === `${n} police department`)
  if (exact) return exact
  const cityType = named.find(a => /city|municipal/i.test(a.agency_type_name || '') && /police/i.test(a.agency_name || ''))
  return cityType || named[0]
}

// Sum the 12 monthly rates in a year -> annual rate per 100k.
function annualFromMonthly(series, year) {
  if (!series) return null
  let sum = 0, months = 0
  for (const [k, v] of Object.entries(series)) {
    if (k.endsWith(String(year)) && typeof v === 'number') { sum += v; months++ }
  }
  return months === 12 ? +sum.toFixed(1) : null
}

function seriesFor(rates, needle) {
  const key = Object.keys(rates || {}).find(k => k.toLowerCase().includes(needle) && /offenses/i.test(k))
  return key ? rates[key] : null
}

async function offenseStats(ori, offense, year) {
  const json = await jget(
    `/api/cde/summarized/agency/${ori}/${offense}?from=01-${year}&to=12-${year}&API_KEY=${FBI_KEY}`,
    { timeout: 25000 },
  )
  const rates = json?.offenses?.rates || {}
  // The agency series is named after the department, e.g. "Chicago Police Department Offenses"
  const agencyKey = Object.keys(rates).find(k => /offenses/i.test(k) && !/^United States|Offenses$/i.test(k) && !k.startsWith('United States'))
  const agencySeries = agencyKey && !/^(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New |North |Ohio|Oklahoma|Oregon|Pennsylvania|Rhode |South |Tennessee|Texas|Utah|Vermont|Virginia|Washington|West |Wisconsin|Wyoming|District)/.test(agencyKey)
    ? rates[agencyKey]
    : Object.entries(rates).find(([k]) => /Police Department Offenses|Sheriff.*Offenses/i.test(k))?.[1]

  return {
    city: annualFromMonthly(agencySeries, year),
    national: annualFromMonthly(seriesFor(rates, 'united states'), year),
    population: json?.populations?.population
      ? Object.values(Object.values(json.populations.population).pop() || {})[0] ?? null
      : null,
  }
}

/**
 * Live FBI stats for a US city. Returns ok:false with a reason when the city
 * has no matching reporting agency — never a fabricated number.
 */
export async function fetchCityCrimeStats(city, year = 2023) {
  if (!isUsCity(city)) {
    return { ok: false, reason: 'FBI CDE only covers US agencies. Non-US figures in this app are estimates, not measurements.' }
  }
  const state = resolveState(city)
  if (!state) return { ok: false, reason: 'Could not resolve a US state for this city.' }

  const cacheKey = `${city.name}|${state}|${year}`
  if (statsCache.has(cacheKey)) return statsCache.get(cacheKey)

  try {
    const agencies = await agenciesFor(state)
    const agency = pickAgency(agencies, city.name)
    if (!agency) {
      const miss = { ok: false, reason: `No FBI-reporting agency matched "${city.name}" in ${state}.` }
      statsCache.set(cacheKey, miss)
      return miss
    }

    const [violent, property] = await Promise.all([
      offenseStats(agency.ori, 'violent-crime', year).catch(() => null),
      offenseStats(agency.ori, 'property-crime', year).catch(() => null),
    ])

    if (!violent?.city && !property?.city) {
      const miss = {
        ok: false,
        reason: `${agency.agency_name} did not report a full 12 months to the FBI for ${year}. Participation is voluntary — gaps are common.`,
        agency: agency.agency_name, ori: agency.ori,
      }
      statsCache.set(cacheKey, miss)
      return miss
    }

    const result = {
      ok: true,
      year,
      agency: agency.agency_name,
      ori: agency.ori,
      isNibrs: !!agency.is_nibrs,
      lat: agency.latitude ?? null,
      lng: agency.longitude ?? null,
      violent: violent?.city ?? null,
      property: property?.city ?? null,
      nationalViolent: violent?.national ?? null,
      nationalProperty: property?.national ?? null,
      population: violent?.population ?? property?.population ?? null,
      source: `FBI Crime Data Explorer · ORI ${agency.ori}`,
      sourceUrl: `https://cde.ucr.cjis.gov/LATEST/webapp/#/pages/explorer/crime/crime-trend`,
    }
    statsCache.set(cacheKey, result)
    return result
  } catch (e) {
    return { ok: false, reason: `FBI CDE unreachable (${e.message}).` }
  }
}
