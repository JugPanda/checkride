import type Phaser from 'phaser'

type ToneKind = 'click' | 'success' | 'warning' | 'failure' | 'mission'

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctx = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return null
  return new Ctx()
}

let sharedContext: AudioContext | null = null

function frequencyFor(kind: ToneKind): number {
  switch (kind) {
    case 'success':
      return 740
    case 'warning':
      return 440
    case 'failure':
      return 220
    case 'mission':
      return 330
    default:
      return 520
  }
}

export function playUiTone(scene: Phaser.Scene, kind: ToneKind): void {
  void scene
  const context = sharedContext ?? getAudioContext()
  if (!context) return
  sharedContext = context

  if (context.state === 'suspended') {
    void context.resume()
  }

  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = kind === 'failure' ? 'sawtooth' : kind === 'mission' ? 'triangle' : 'sine'
  oscillator.frequency.value = frequencyFor(kind)
  gain.gain.value = kind === 'failure' ? 0.045 : kind === 'mission' ? 0.025 : 0.03
  oscillator.connect(gain)
  gain.connect(context.destination)

  const now = context.currentTime
  gain.gain.setValueAtTime(gain.gain.value, now)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === 'click' ? 0.08 : kind === 'mission' ? 0.32 : 0.18))
  oscillator.start(now)
  oscillator.stop(now + (kind === 'click' ? 0.08 : kind === 'mission' ? 0.32 : 0.18))
}

export function startMissionHum(scene: Phaser.Scene): void {
  const context = sharedContext ?? getAudioContext()
  if (!context) return
  sharedContext = context
  if (context.state === 'suspended') {
    void context.resume()
  }

  const base = frequencyFor('mission')
  const now = context.currentTime

  ;[0, 7, 12].forEach((offset, index) => {
    const osc = context.createOscillator()
    const gain = context.createGain()
    osc.type = index === 0 ? 'triangle' : 'sine'
    osc.frequency.value = base * Math.pow(2, offset / 12)
    gain.gain.value = 0.008
    osc.connect(gain)
    gain.connect(context.destination)
    gain.gain.setValueAtTime(0.008, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8)
    osc.start(now)
    osc.stop(now + 1.8)
  })

  playUiTone(scene, 'mission')
}
