// Tactical Police Radio Scanner Engine & 10-Code Jargon Decoder
// Provides real-time parsing, APCO 10-code translation, continuous live dispatch stream,
// and procedural radio speech audio effects.

export const POLICE_CODEBOOK = {
  // Standard APCO 10-Codes
  '10-1': { meaning: 'Receiving Poorly / Signal Weak', category: 'transmission', severity: 'low' },
  '10-4': { meaning: 'Affirmative / Message Acknowledged', category: 'routine', severity: 'low' },
  '10-6': { meaning: 'Busy / Standby on Channel', category: 'routine', severity: 'low' },
  '10-7': { meaning: 'Out of Service / Off Duty', category: 'unit-status', severity: 'low' },
  '10-8': { meaning: 'In Service / Available for Calls', category: 'unit-status', severity: 'low' },
  '10-9': { meaning: 'Repeat Last Transmission', category: 'transmission', severity: 'low' },
  '10-10': { meaning: 'Fight / Physical Altercation in Progress', category: 'incident', severity: 'high' },
  '10-13': { meaning: 'OFFICER NEEDS IMMEDIATE ASSISTANCE / EMERGENCY', category: 'critical', severity: 'critical' },
  '10-15': { meaning: 'Suspect in Custody / Transporting Prisoner', category: 'arrest', severity: 'medium' },
  '10-20': { meaning: 'Location Coordinates Requested', category: 'telemetry', severity: 'low' },
  '10-22': { meaning: 'Disregard Last Order', category: 'command', severity: 'low' },
  '10-23': { meaning: 'Arrived on Scene / Standby', category: 'tactical', severity: 'low' },
  '10-27': { meaning: 'Driver License / Identity Check', category: 'check', severity: 'low' },
  '10-28': { meaning: 'Vehicle Registration / License Plate Check', category: 'check', severity: 'low' },
  '10-29': { meaning: 'NCIC National Fugitive / Warrant Check', category: 'check', severity: 'medium' },
  '10-30': { meaning: 'Does Not Conform to Regulations', category: 'transmission', severity: 'low' },
  '10-31': { meaning: 'Crime in Progress', category: 'incident', severity: 'high' },
  '10-33': { meaning: 'EMERGENCY RADIO TRAFFIC ONLY — CLEAR CHANNEL', category: 'critical', severity: 'critical' },
  '10-41': { meaning: 'Beginning Tour of Duty', category: 'unit-status', severity: 'low' },
  '10-42': { meaning: 'Ending Tour of Duty', category: 'unit-status', severity: 'low' },
  '10-50': { meaning: 'Motor Vehicle Accident', category: 'traffic', severity: 'medium' },
  '10-51': { meaning: 'Wrecker / Tow Truck Needed', category: 'traffic', severity: 'low' },
  '10-52': { meaning: 'Ambulance / EMS Required', category: 'medical', severity: 'high' },
  '10-53': { meaning: 'Roadway Blocked / Traffic Hazard', category: 'traffic', severity: 'low' },
  '10-54': { meaning: 'Possible Hit and Run', category: 'traffic', severity: 'high' },
  '10-57': { meaning: 'Fire / Structure Incident', category: 'fire', severity: 'high' },
  '10-62': { meaning: 'Unable to Copy / Use Alternate Channel', category: 'transmission', severity: 'low' },
  '10-70': { meaning: 'Foot Pursuit in Progress', category: 'pursuit', severity: 'high' },
  '10-71': { meaning: 'ACTIVE SHOOTING / WEAPON DISCHARGE REPORTED', category: 'critical', severity: 'critical' },
  '10-78': { meaning: 'Send Additional Backup Urgent', category: 'tactical', severity: 'high' },
  '10-80': { meaning: 'VEHICLE PURSUIT IN PROGRESS', category: 'pursuit', severity: 'critical' },
  '10-85': { meaning: 'Delayed by Emergency', category: 'tactical', severity: 'low' },
  '10-89': { meaning: 'Bomb Threat / Suspicious Package', category: 'homeland', severity: 'critical' },
  '10-90': { meaning: 'Alarm Sounding (Bank / Commercial)', category: 'alarm', severity: 'high' },
  '10-94': { meaning: 'Drag Racing / Street Speed Contest', category: 'traffic', severity: 'medium' },
  '10-97': { meaning: 'Arrived at Call Location', category: 'tactical', severity: 'low' },
  '10-99': { meaning: 'STOLEN VEHICLE / WANTED FELON OCCURRENCE', category: 'warrant', severity: 'critical' },

  // California Penal & Common Tactical Codes
  'Code 3': { meaning: 'Emergency Response — Emergency Lights & Siren Authorized', category: 'response', severity: 'high' },
  'Code 4': { meaning: 'Situation Under Control / No Further Assistance Needed', category: 'status', severity: 'low' },
  'Code 6': { meaning: 'Conducting Field Investigation at Scene', category: 'tactical', severity: 'low' },
  'Code 7': { meaning: 'Out of Service for Meal Break', category: 'status', severity: 'low' },
  'Code 30': { meaning: 'Silent Commercial Intrusion Alarm', category: 'alarm', severity: 'high' },
  'Code 33': { meaning: 'Emergency Radio Lockout / Tactical Silence', category: 'critical', severity: 'critical' },
  'Signal 100': { meaning: 'Full Tactical Perimeter / Major Incident Lockdown', category: 'critical', severity: 'critical' },
  'Signal 30': { meaning: 'Homicide / Fatal Casualty Reported', category: 'critical', severity: 'critical' },
  'Signal 10': { meaning: 'Intercept Warrants Active', category: 'warrant', severity: 'high' },
  '211': { meaning: 'Armed Robbery (PC 211)', category: 'felony', severity: 'high' },
  '187': { meaning: 'Homicide (PC 187)', category: 'felony', severity: 'critical' },
  '459': { meaning: 'Burglary / Breaking and Entering (PC 459)', category: 'felony', severity: 'medium' },
  '415': { meaning: 'Disturbing the Peace / Civil Disturbance', category: 'disturbance', severity: 'low' },
  '505': { meaning: 'Reckless Driving Incident', category: 'traffic', severity: 'medium' },
  'BOLO': { meaning: 'Be On the Look Out (Broadcast Alert)', category: 'alert', severity: 'high' },
  'ALPR': { meaning: 'Automated License Plate Reader Telemetry Hit', category: 'surveillance', severity: 'medium' },
  'NCIC': { meaning: 'National Crime Information Center Database', category: 'warrant', severity: 'low' },
  'SOD': { meaning: 'Special Operations Division Tactical Unit', category: 'unit', severity: 'medium' },
}

/**
 * Parses dispatch text and returns all recognized 10-codes and tactical jargon with meanings
 * @param {string} rawText 
 * @returns {Array<{ token: string, meaning: string, severity: string, category: string }>}
 */
export function decodePoliceJargon(rawText) {
  if (!rawText || typeof rawText !== 'string') return []
  const matches = []
  const upper = rawText.toUpperCase()

  // Match specific codes
  for (const [code, info] of Object.entries(POLICE_CODEBOOK)) {
    // Regex looking for word boundaries around the code
    const escaped = code.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
    const regex = new RegExp(`\\b${escaped}\\b`, 'i')
    if (regex.test(upper)) {
      matches.push({
        token: code,
        meaning: info.meaning,
        severity: info.severity,
        category: info.category,
      })
    }
  }

  return matches
}

// Procedural stream generator for continuous realistic multi-city police radio feeds
export const DISPATCH_GENERATORS = [
  {
    city: 'CHICAGO, IL',
    district: 'CPD 1st / 18th Districts',
    coords: { lat: 41.8818, lng: -87.6231 },
    templates: [
      { unit: 'UNIT 114', msg: '10-4, in 10-80 pursuit eastbound on Wacker Dr towards Michigan Ave. Black sedan, tinted glass.', priority: 'critical' },
      { unit: 'DISPATCH', msg: 'All units on Zone 1, 10-33 emergency traffic only. 211 armed robbery reported on 400 block N Michigan.', priority: 'critical' },
      { unit: 'UNIT 108', msg: '10-23 on scene at State and Grand. Suspect fled on foot westbound, requesting 10-78 backup.', priority: 'high' },
      { unit: 'DISPATCH', msg: 'ALPR hit on stolen Illinois plate IL-6849 at Illinois and LaSalle. Vehicle wanted in connection with armed carjacking.', priority: 'high' },
      { unit: 'UNIT 118', msg: '10-15 in custody at 200 E Ohio. Transporting one adult male to 1st District lockup.', priority: 'medium' },
      { unit: 'DISPATCH', msg: '10-71 shots fired call, 800 block S State St. Multiple callers reporting weapon discharge.', priority: 'critical' },
      { unit: 'UNIT 122', msg: 'Code 4 on the Clark St disturbance, parties separated. Resuming 10-8 patrol.', priority: 'low' },
    ]
  },
  {
    city: 'NEW YORK, NY',
    district: 'NYPD Midtown / SOD',
    coords: { lat: 40.7580, lng: -73.9855 },
    templates: [
      { unit: 'SOD HWY 1', msg: '10-80 pursuit initiated on West Side Highway northbound passing 57th St. BOLO for gray BMW.', priority: 'critical' },
      { unit: 'DISPATCH', msg: 'Midtown South units, 10-89 suspicious package near 34th St Herald Square subway mezzanine.', priority: 'critical' },
      { unit: 'UNIT 34-ED', msg: '10-52 EMS requested at 125th St & Lenox Ave for assault victim. Scene secured.', priority: 'high' },
      { unit: 'DISPATCH', msg: 'Aviation 6 airborne over Hudson River sector conducting thermal surveillance grid.', priority: 'low' },
      { unit: 'UNIT 14-PCT', msg: '10-99 hit on NCIC check at 8th Ave & 42nd St. Subject has active federal warrant.', priority: 'critical' },
      { unit: 'DISPATCH', msg: 'Code 30 silent alarm at diamond district jewelry vault, 47th St. Units 18 and 22 respond Code 3.', priority: 'high' },
    ]
  },
  {
    city: 'LOS ANGELES, CA',
    district: 'LAPD Central / Metro',
    coords: { lat: 34.0407, lng: -118.2468 },
    templates: [
      { unit: 'METRO 4', msg: 'Target vehicle in sight crossing 7th & Broadway. Requesting Air 10 for overhead tracking.', priority: 'high' },
      { unit: 'AIR 10', msg: 'Air 10 overhead Skid Row corridor, thermal tracking two subjects heading south towards 6th.', priority: 'high' },
      { unit: 'DISPATCH', msg: 'Code 3 response authorized for 211 robbery in progress, 800 block Hope St.', priority: 'critical' },
      { unit: 'UNIT 1A22', msg: '10-27 and 10-28 on California license plate 7XYZ99 at Olympic & Figueroa.', priority: 'low' },
      { unit: 'UNIT 1-TRAFFIC', msg: '10-50 two-vehicle collision on 110 freeway north at 9th St. 10-51 tow required.', priority: 'medium' },
      { unit: 'DISPATCH', msg: 'Signal 100 full perimeter lockdown on commercial warehouse, 5th & Alameda.', priority: 'critical' },
    ]
  },
  {
    city: 'MIAMI, FL',
    district: 'Miami-Dade Task Force',
    coords: { lat: 25.7617, lng: -80.1918 },
    templates: [
      { unit: 'MARINE 2', msg: 'Interception underway on Biscayne Bay channel. Vessel matching BOLO narcotics relay.', priority: 'critical' },
      { unit: 'DISPATCH', msg: 'All units, 10-80 pursuit heading west on I-395 towards Downtown. Speeds exceeding 90mph.', priority: 'critical' },
      { unit: 'UNIT 404', msg: '10-97 on scene at Brickell Ave financial tower, commercial alarm confirmed false.', priority: 'low' },
    ]
  }
]
