import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'

const LINES = [
  ['UPLINK // FBI WANTED BOARD (api.fbi.gov)', 'LINKED'],
  ['UPLINK // FBI CRIME DATA EXPLORER', 'LINKED'],
  ['UPLINK // INTERPOL RED NOTICES', 'LINKED'],
  ['UPLINK // COURTLISTENER / RECAP ARCHIVE', 'LINKED'],
  ['UPLINK // GDELT GLOBAL NEWS MESH', 'LINKED'],
  ['UPLINK // MUNICIPAL WIRES (CHI · NYC · LA)', 'LINKED'],
  ['UPLINK // BLOCKSTREAM CHAIN LEDGER', 'LINKED'],
  ['UPLINK // INTERNET ARCHIVE CDX', 'LINKED'],
]

export default function BootScreen({ onDone }) {
  const [step, setStep] = useState(0)
  const videoRef = useRef(null)

  useEffect(() => {
    if (step >= LINES.length) {
      const t = setTimeout(onDone, 900)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setStep(s => s + 1), 300)
    return () => clearTimeout(t)
  }, [step, onDone])

  return (
    <motion.div
      className="boot boot-brand"
      onClick={onDone}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'brightness(1.6)' }}
      transition={{ duration: 0.6 }}
    >
      <motion.video
        ref={videoRef}
        className="boot-video"
        src="/brand/bountygrid-boot.mp4"
        autoPlay
        muted
        playsInline
        initial={{ opacity: 0, scale: 1.08 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        onError={e => { e.currentTarget.style.display = 'none' }}
      />

      <div className="boot-inner boot-inner-brand">
        <div className="boot-lines">
          {LINES.slice(0, step).map(([txt, status], i) => (
            <motion.div key={i} className="boot-line" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
              &gt; {txt} <span className="ok">[{status}]</span>
            </motion.div>
          ))}
        </div>
        <div className="boot-bar-track">
          <motion.div
            className="boot-bar boot-bar-gold"
            initial={{ width: '0%' }}
            animate={{ width: `${(step / LINES.length) * 100}%` }}
            transition={{ ease: 'easeOut' }}
          />
        </div>
        <div className="boot-skip">CLICK TO SKIP</div>
      </div>
    </motion.div>
  )
}
