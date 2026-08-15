// Zero-dependency Procedural Web Audio API Sound Synthesizer
// Generates tactical cybernetic UI telemetry audio on demand without downloading MP3s.

let audioCtx = null
let soundEnabled = true

function getContext() {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (AudioContext) {
      audioCtx = new AudioContext()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

export function isAudioMuted() {
  return !soundEnabled
}

export function toggleAudio() {
  soundEnabled = !soundEnabled
  if (soundEnabled) {
    playLock()
  }
  return soundEnabled
}

export function setAudioEnabled(enabled) {
  soundEnabled = enabled
}

// Crisp tactical click / beep
export function playBeep(freq = 880, dur = 0.04) {
  if (!soundEnabled) return
  try {
    const ctx = getContext()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    gain.gain.setValueAtTime(0.04, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + dur)
  } catch { /* suppress */ }
}

// Sonar / Radar Ping
export function playRadar() {
  if (!soundEnabled) return
  try {
    const ctx = getContext()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1400, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.28)
    gain.gain.setValueAtTime(0.06, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.28)
  } catch { /* suppress */ }
}

// Dual-tone Target Acquisition Lock
export function playLock() {
  if (!soundEnabled) return
  try {
    const ctx = getContext()
    if (!ctx) return
    const now = ctx.currentTime
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()
    
    osc1.type = 'triangle'
    osc2.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, now) // D5
    osc1.frequency.setValueAtTime(880, now + 0.08) // A5
    osc2.frequency.setValueAtTime(1174.66, now + 0.08) // D6
    
    gain.gain.setValueAtTime(0.05, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22)
    
    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(ctx.destination)
    
    osc1.start(now)
    osc2.start(now + 0.08)
    osc1.stop(now + 0.22)
    osc2.stop(now + 0.22)
  } catch { /* suppress */ }
}

// Cyber threat warning pulse
export function playWarning() {
  if (!soundEnabled) return
  try {
    const ctx = getContext()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(320, now)
    osc.frequency.linearRampToValueAtTime(180, now + 0.24)
    gain.gain.setValueAtTime(0.05, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.24)
  } catch { /* suppress */ }
}
