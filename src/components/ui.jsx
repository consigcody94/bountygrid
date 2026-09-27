import React, { useEffect, useRef } from 'react'
import { motion } from 'motion/react'

export const TIER_COLORS = {
  'very-safe': '#83ad98',
  safe: '#77a7b8',
  moderate: '#c5a36a',
  elevated: '#b58461',
  'high-risk': '#bd7772',
}

export function scoreTier(score) {
  if (score == null) return null
  if (score >= 80) return 'very-safe'
  if (score >= 65) return 'safe'
  if (score >= 45) return 'moderate'
  if (score >= 30) return 'elevated'
  return 'high-risk'
}

export function scoreColor(score) {
  const tier = scoreTier(score)
  return tier ? TIER_COLORS[tier] : '#74858e'
}

export function Section({ index, title, sub, id, children }) {
  return (
    <motion.section
      id={id}
      className="section"
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="section-head">
        <span className="idx">{index} //</span>
        <h2>{title}</h2>
        <div className="rule" />
      </div>
      {sub && <p className="section-sub">{sub}</p>}
      {children}
    </motion.section>
  )
}

export function CountUp({ value, decimals = 0, suffix = '' }) {
  const ref = useRef(null)
  const fromRef = useRef(0)
  useEffect(() => {
    if (ref.current == null || value == null) return
    const from = fromRef.current
    const to = +value
    const start = performance.now()
    const dur = 1400
    let raf
    const tick = now => {
      const t = Math.min(1, (now - start) / dur)
      const eased = 1 - Math.pow(1 - t, 3)
      const v = from + (to - from) * eased
      if (ref.current) {
        ref.current.textContent = v.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }) + suffix
      }
      if (t < 1) raf = requestAnimationFrame(tick)
      else fromRef.current = to
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, decimals, suffix])
  return <span ref={ref}>0{suffix}</span>
}
