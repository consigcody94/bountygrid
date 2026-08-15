/* ============================================================================
   VERIFIED INTEL — compiled 2026-08-15

   RULES FOR THIS FILE (do not relax them):
   • Every line is traceable to a cited public source listed in `sources`.
   • Nothing here is a guess dressed as a finding. Where reporting conflicts,
     both versions are recorded and marked DISPUTED.
   • `collectability` is an assessment of whether a reward is realistically
     claimable — it is our judgement, explicitly labelled as such, not fact.

   This is desk research on publicly wanted fugitives, built from official
   postings and published journalism. It is not surveillance, and it contains
   no private-individual data.
   ========================================================================== */

export const COMPILED = '2026-08-15'

export const INTEL = [
  {
    slug: 'yulan-adonay-archaga-carias',
    name: 'YULAN ADONAY ARCHAGA CARIAS',
    alias: '"Porky" / Alexander Mendoza',
    reward: 10_000_000,
    rewardLabel: '$10M — State Dept. (raised from $5M)',
    country: 'Honduras',
    langs: ['es'],
    priority: 1,
    collectability: 'MODERATE',
    collectabilityWhy:
      'Highest bounty on the board and the only target with a DEDICATED FBI tip channel — which signals the Bureau is actively working walk-in intelligence. In-country, in a jurisdiction that does cooperate on extradition. The constraint is access, not process.',
    findings: [
      { fact: 'Reward raised to $10M by the State Department — the largest on the current Ten Most Wanted board.', src: 1 },
      { fact: 'DEDICATED TIP CHANNEL: archaga-carias_tips@fbi.gov and text/WhatsApp +1 832-267-1688. This is target-specific, not the generic tip line.', src: 2, actionable: true },
      { fact: 'Escaped custody Feb 2020 at a courthouse in El Progreso, Honduras — roughly 20 armed men; two police, two military and one presumed MS-13 member killed.', src: 3 },
      { fact: 'SDNY superseding indictment filed 21 Sep 2021: racketeering, narcotics trafficking, weapons trafficking.', src: 3 },
      { fact: 'Authorities assess he remains in Honduras, though he may have moved into Guatemala.', src: 2 },
      { fact: 'Believed to speak only Spanish — English-language monitoring will not surface local chatter about him.', src: 4 },
    ],
    pivots: [
      'Honduran + Guatemalan local press (laprensa.hn, elheraldo.hn, proceso.hn, prensalibre.com) for detention/raid reporting that never reaches English wires.',
      'Poder Judicial de Honduras case portal for co-defendant proceedings — co-defendants move first and name locations.',
      'InSight Crime MS-13 Honduras reporting for faction-structure changes.',
    ],
    sources: [
      { n: 1, t: 'U.S. Dept. of State — Archaga Carías reward', u: 'https://www.state.gov/yulan-adonay-archaga-carias' },
      { n: 2, t: 'Reward coverage incl. dedicated tip channel (ES-language reporting)', u: 'https://oncenoticias.hn/nacionales/estados-unidos-aumenta-recompensa-captura-el-porky-yulan-archaga-lider-mara-salvatrucha-honduras/' },
      { n: 3, t: 'ATF / State reward notice + SDNY indictment detail', u: 'https://www.atf.gov/news/reward-notices/department-state-announces-reward-offers-information-leading-arrest-andor-conviction-ms-13' },
      { n: 4, t: 'FBI official poster', u: 'https://www.fbi.gov/wanted/topten/yulan-adonay-archaga-carias' },
    ],
  },

  {
    slug: 'ruja-ignatova',
    name: 'RUJA IGNATOVA',
    alias: '"CryptoQueen"',
    reward: 5_000_000,
    rewardLabel: '$5M — State Dept. TOCRP',
    country: 'Bulgaria / Germany',
    langs: ['bg', 'de'],
    priority: 2,
    collectability: 'LOW–MODERATE',
    collectabilityWhy:
      'The most heavily-searched fugitive in the world — thousands of investigators, journalists and victims have hunted her since 2017 with no confirmed sighting. Genuine possibility she is dead. Any edge here comes from Bulgarian-language records, not from re-running English searches everyone else has already run.',
    findings: [
      { fact: 'Last confirmed sighting: October 2017, boarding a flight from Sofia to Athens. Nothing verified since.', src: 1 },
      { fact: 'Has a live INTERPOL Red Notice — confirmed against the public Red Notice API from this console.', src: 5, actionable: true },
      { fact: 'FBI assesses she may have altered her appearance surgically and travels with armed guards.', src: 2 },
      { fact: 'DISPUTED — LOCATION: German filmmaker Johan von Mirbach reports she is alive in an affluent area of Cape Town, South Africa. Unconfirmed.', src: 3, disputed: true },
      { fact: 'DISPUTED — DEATH: Bulgarian outlet reporting cites police-recorded informant claims that she was murdered in 2018 by a Bulgarian drug importer to bury his own OneCoin exposure. Unconfirmed; the FBI has continued to work the case on the assumption she is alive.', src: 3, disputed: true },
      { fact: 'BULGARIAN-ONLY LEAD: A complaint was filed with Bulgarian prosecutors alleging Interior Ministry (МВР) information leaked to Ignatova — i.e. she may have had police sources. Does not appear in English-language coverage.', src: 4, actionable: true },
      { fact: 'FBI opened a victim-compensation claim process against >$40M in seized assets (claims deadline 30 Jun 2026) — the claimant list is a live pool of witnesses.', src: 6 },
    ],
    pivots: [
      'Bulgarian Commercial Register (Търговски регистър) + Property Register for nominee-held entities and transfers dated 2016–2018.',
      'Bivol.bg / boulevardbulgaria.bg / Capital.bg archives — Bulgarian investigative outlets hold material never translated.',
      'Wayback captures of onecoin.eu and successor sites (the Archive Recon tab pulls these live) for pre-scrub officer and address details.',
      'ICIJ Offshore Leaks + OCCRP Aleph for associated shell structures.',
    ],
    sources: [
      { n: 1, t: 'FBI official poster', u: 'https://www.fbi.gov/wanted/topten/ruja-ignatova' },
      { n: 2, t: 'BBC — reward raised to $5m', u: 'https://feeds.bbci.co.uk/news/articles/c9785924je3o' },
      { n: 3, t: 'The Record — $5M reward, Cape Town and murder-claim reporting', u: 'https://therecord.media/ruja-ignatova-onecoin-cryptoqueen-us-5million-reward' },
      { n: 4, t: 'Boulevard Bulgaria — alleged МВР information leak to Ignatova (BG)', u: 'https://boulevardbulgaria.bg/articles/ruzha-ignatova-mozhe-da-e-poluchavala-politseyska-informatsiya-ot-balgarski-iztochnitsi' },
      { n: 5, t: 'INTERPOL public Red Notice API — verified live from this console', u: 'https://www.interpol.int/en/How-we-work/Notices/Red-Notices' },
      { n: 6, t: 'OneCoin victim compensation reporting (BG)', u: 'https://www.budnavarna.com/2026/06/29/zhertvite-na-izmama-ot-ruzha-ignatova-mogat-da-kandidatstvat-za-obezsthetenie/' },
    ],
  },

  {
    slug: 'giovanni-vicente-mosquera-serrano',
    name: 'GIOVANNI VICENTE MOSQUERA SERRANO',
    alias: '"El Viejo" / Jhovanni San Vicente',
    reward: 5_000_000,
    rewardLabel: '$5M — State Dept. (raised from $3M, Dec 2025)',
    country: 'Venezuela / Colombia',
    langs: ['es'],
    priority: 3,
    collectability: 'MODERATE — TIME-SENSITIVE',
    collectabilityWhy:
      'The most dynamic situation on the board. Tren de Aragua\'s supreme leader died in June 2026 and the succession is contested. Successions force movement, communication and defection — the exact conditions that generate collectable intelligence. This is the target where the next 90 days matter most.',
    findings: [
      { fact: 'Reward raised from $3M to $5M on 3 Dec 2025.', src: 1 },
      { fact: 'Added to the FBI Ten Most Wanted on 24 Jun 2025 — the first Tren de Aragua member ever listed.', src: 2 },
      { fact: 'DOJ indictment 24 Jun 2025: conspiracy to distribute cocaine internationally, plus providing material support to a designated Foreign Terrorist Organization.', src: 2 },
      { fact: 'MAJOR DEVELOPMENT: Héctor Guerrero Flores ("Niño Guerrero"), TdA\'s supreme leader and the man Mosquera Serrano was a trusted associate of, died — reported June 2026, with an open succession fight. Surfaced only in Spanish-language reporting.', src: 3, actionable: true },
      { fact: 'Investigators believe he is in Venezuela or Colombia; precise whereabouts unknown.', src: 1 },
      { fact: 'Oversaw TdA finances — meaning a money trail exists, which is more OSINT-tractable than a person.', src: 2 },
    ],
    pivots: [
      'Venezuelan investigative outlets (elpitazo.net, runrun.es, armando.info) — the succession fight is being covered there in detail and nowhere in English.',
      'Colombian RUES business registry + Rama Judicial process search for finance-side entities.',
      'Treasury OFAC press releases — TdA designations name wallets, entities and associates.',
      'Track the succession: whoever consolidates will surface associates, and associates are the softer targets.',
    ],
    sources: [
      { n: 1, t: 'Infobae — reward raised to $5M (ES)', u: 'https://www.infobae.com/estados-unidos/2025/12/03/estados-unidos-elevo-a-usd-5-millones-la-recompensa-por-giovanni-vicente-mosquera-serrano-lider-del-tren-de-aragua/' },
      { n: 2, t: 'CNN — first TdA leader on FBI most wanted', u: 'https://www.cnn.com/2025/06/25/us/fbi-most-wanted-giovanni-mosquera-serrano' },
      { n: 3, t: 'CNN Español — Niño Guerrero death and TdA succession (ES)', u: 'https://cnnespanol.cnn.com/2026/06/16/latinoamerica/muerte-nino-guerrero-sucesion-tren-aragua-orix' },
    ],
  },

  {
    slug: 'wilver-villegas-palomino',
    name: 'WILVER VILLEGAS-PALOMINO',
    alias: '"Carlos El Puerco"',
    reward: 5_000_000,
    rewardLabel: '$5M — State Dept. NRP (+50M COP Colombian offer)',
    country: 'Colombia',
    langs: ['es'],
    priority: 4,
    collectability: 'LOW',
    collectabilityWhy:
      'ELN Northeastern War Front territory is a controlled operating environment — effectively closed to outside observation. The stackable Colombian reward is a small plus, but this is a target for institutional sources, not open-source work.',
    findings: [
      { fact: 'ELN member since ~2000; chief of drug trafficking for the Northeastern War Front.', src: 1 },
      { fact: 'Indicted 12 Feb 2020, Southern District of Texas: narco-terrorism and conspiracy to import cocaine — a ~20-year conspiracy.', src: 2 },
      { fact: 'Added to the FBI Ten Most Wanted on 14 Apr 2023.', src: 2 },
      { fact: 'STACKABLE REWARD: also a most-wanted fugitive of Norte de Santander department, with a separate 50,000,000 COP offer on top of the US $5M.', src: 2, actionable: true },
    ],
    pivots: [
      'Colombian regional press for Norte de Santander / Catatumbo operations.',
      'Fiscalía General case bulletins for co-defendant captures.',
      'Cross-border Venezuelan reporting — ELN fronts operate on both sides of that border.',
    ],
    sources: [
      { n: 1, t: 'U.S. Dept. of State — Villegas Palomino', u: 'https://www.state.gov/wilver-villegas-palomino-2' },
      { n: 2, t: 'FBI — added to Ten Most Wanted', u: 'https://www.fbi.gov/news/stories/wilver-villegas-palomino-added-to-fbis-ten-most-wanted-fugitives-list' },
    ],
  },

  {
    slug: 'evgeniy-mikhailovich-bogachev',
    name: 'EVGENIY MIKHAILOVICH BOGACHEV',
    alias: '"slavik" / "lucky12345"',
    reward: 3_000_000,
    rewardLabel: '$3M — largest US cyber reward ever offered',
    country: 'Russia',
    langs: ['ru'],
    priority: 9,
    collectability: 'EFFECTIVELY ZERO',
    collectabilityWhy:
      'His location is not a secret — reporting has placed him in Anapa for a decade. The obstacle is legal, not informational: no US–Russia extradition treaty, no Russian prosecution, and reporting linking him to Russian intelligence. Nobody pays $3M for an address that is already published. Only a travel event to a cooperating jurisdiction changes this.',
    findings: [
      { fact: 'GameOver Zeus botnet: >1 million machines infected, >$100M in US losses.', src: 1 },
      { fact: '$3M State Department reward — the largest ever offered in a US cyber case.', src: 1 },
      { fact: 'Last known residence Anapa, Russia; reporting also places property in Krasnodar and notes he may spend time on a boat along the Black Sea.', src: 2 },
      { fact: 'BLOCKER: no Russia–US extradition treaty; he is not treated as guilty in Russia and there is no plan to extradite.', src: 3, blocker: true },
      { fact: 'NYT reporting has linked him to Russian intelligence — which explains the durable protection.', src: 4 },
    ],
    pivots: [
      'ONLY realistic trigger: travel to a cooperating jurisdiction. Monitor for any reported movement — that is the whole play.',
      'Russian corporate/property registries (ЕГРЮЛ, Росреестр) for asset holdings that could be seized rather than arrested.',
      'Chain analysis of legacy Zeus-linked clusters via the Chain Trace tab.',
    ],
    sources: [
      { n: 1, t: 'U.S. Dept. of State — TOCRP Bogachev', u: 'https://www.state.gov/transnational-organized-crime-rewards-program/evgeniy-mikhailovich-bogachev' },
      { n: 2, t: 'FBI Cyber Most Wanted poster', u: 'https://www.fbi.gov/wanted/cyber/evgeniy-mikhailovich-bogachev' },
      { n: 3, t: 'Kommersant — profile and extradition position (RU)', u: 'https://www.kommersant.ru/doc/3240972' },
      { n: 4, t: 'RBC — NYT link to Russian intelligence (RU)', u: 'https://www.rbc.ru/politics/13/03/2017/58c64a679a7947a5231d3ec1' },
    ],
  },

  {
    slug: 'trung-duc-lu',
    name: 'TRUNG DUC LU',
    alias: '"B" — 11 recorded aliases, 6 recorded DOBs',
    reward: 1_000_000,
    rewardLabel: '$1M — FBI',
    country: 'Vietnam / USA',
    langs: ['vi'],
    priority: 5,
    collectability: 'MODERATE',
    collectabilityWhy:
      'Unusually rich identity surface: eleven official aliases and six recorded dates of birth is a large attack surface for record correlation, and distinctive tattoos make visual identification realistic. Vietnam is the constraint, but the identity data here is the best on the board for pure OSINT work.',
    findings: [
      { fact: 'Born in Vietnam, moved to the US as a teenager; strong ties to Queens, New York City.', src: 1 },
      { fact: 'Suspected member of the Born to Kill (BTK / "Canal Boys") street gang.', src: 1 },
      { fact: 'LAST CONFIRMED IN VIETNAM — per the official poster.', src: 1 },
      { fact: 'ELEVEN official aliases recorded: Trung D. Lu, Tuan Hoang, Phong Le, Phong Van Le, Brendan Lu, Calvin Lu, Trung Lu, Duc Trung, Duc L. Trung, Lu Trung, "B".', src: 1, actionable: true },
      { fact: 'SIX different dates of birth on record (1979–1982) — indicates sustained document fraud, which leaves paper trails.', src: 1, actionable: true },
      { fact: 'Distinctive tattoo: dragon centred on the back with "Asian Pride" in large script above it.', src: 1 },
    ],
    pivots: [
      'Run every one of the 11 aliases separately through handle-correlation tooling — Anglicised aliases (Brendan Lu, Calvin Lu) are the most likely to appear on Western platforms.',
      'Vietnamese-language press (vnexpress.net, congan.com.vn) for BTK-linked arrests and deportation reporting.',
      'Vietnamese national business registry against each alias — sustained alias use implies registered activity somewhere.',
      'EDNY/SDNY co-defendant dockets for the BTK case cluster.',
    ],
    sources: [
      { n: 1, t: 'FBI official poster — aliases, DOBs, marks, ties', u: 'https://www.fbi.gov/wanted/topten/trung-duc-lu' },
    ],
  },

  {
    slug: 'bhadreshkumar-chetanbhai-patel',
    name: 'BHADRESHKUMAR CHETANBHAI PATEL',
    alias: 'Bhadreshkumar C. Patel',
    reward: 1_000_000,
    rewardLabel: '$1M — FBI',
    country: 'India / USA',
    langs: ['gu', 'hi'],
    priority: 6,
    collectability: 'MODERATE',
    collectabilityWhy:
      'Fled from Newark in 2015 and has been at large a decade. India does have an extradition treaty with the US, so a confirmed location in Gujarat is genuinely actionable — unlike the Russia cases. Gujarati-language local press is the underworked angle.',
    findings: [
      { fact: 'Wanted for the 2015 killing of his wife at a Maryland donut shop; $1M FBI reward.', src: 1 },
      { fact: 'Last known to be in the Newark, New Jersey area.', src: 1 },
      { fact: 'Origin: Kantrodi Ta Viramgam, Gujarat, India — a specific village-level origin, which is a strong search anchor.', src: 1, actionable: true },
      { fact: 'Baltimore field office holds the case.', src: 1 },
    ],
    pivots: [
      'Gujarati-language press (divyabhaskar.co.in, sandesh.com) and Viramgam-area local reporting.',
      'India MCA21 corporate registry and eCourts case-status search against the full name.',
      'Family-adjacent public records in Gujarat — a decade-long absence usually leaves property or registry traces.',
    ],
    sources: [
      { n: 1, t: 'FBI official poster', u: 'https://www.fbi.gov/wanted/topten/bhadreshkumar-chetanbhai-patel' },
    ],
  },
]

/* Board-level triage — the thing that actually decides where effort goes. */
export const TRIAGE = {
  totalPublishedReward: 39_200_000,
  boardSize: 1229,
  tenMostWanted: 12,
  summary: [
    {
      k: 'Effort follows collectability, not headline reward',
      v: 'Bogachev carries $3M and a publicly known address — and is uncollectable, because there is no extradition path. Archaga Carías carries $10M in a cooperating jurisdiction with a dedicated FBI tip channel. Same board, opposite value.',
    },
    {
      k: 'Language is the real edge',
      v: 'Every genuinely new item found today came from Spanish, Bulgarian or Russian sources: the dedicated Archaga Carías tip line, the Bulgarian МВР-leak complaint, and the Niño Guerrero death and TdA succession. None surfaced in English-language search.',
    },
    {
      k: 'Money is more findable than people',
      v: 'Mosquera Serrano ran TdA finances; Ignatova moved $4B. Registries, chain data and archived sites are queryable from a desk. A person in Catatumbo or Anapa is not.',
    },
    {
      k: 'Succession events are the window',
      v: 'Niño Guerrero\'s death has TdA leadership in flux right now. Successions force movement, comms and defections — the conditions that produce collectable tips. This is the time-sensitive item on the board.',
    },
  ],
}
