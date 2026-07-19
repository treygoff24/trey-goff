import type { QualityTier } from '@/lib/interactive/capabilities'

export interface MachineQuality {
  agentCount: number
  splitAgentCount: number
  dpr: number | [number, number]
  antialias: boolean
  bloom: boolean
}

export const MACHINE_QUALITY: Record<Exclude<QualityTier, 'auto'>, MachineQuality> = {
  low: { agentCount: 1500, splitAgentCount: 750, dpr: 1, antialias: false, bloom: false },
  medium: {
    agentCount: 6000,
    splitAgentCount: 3000,
    dpr: [1, 1.5],
    antialias: true,
    bloom: false,
  },
  high: {
    agentCount: 15000,
    splitAgentCount: 15000,
    dpr: [1, 2],
    antialias: true,
    bloom: true,
  },
}

export function getMachineQuality(tier: QualityTier, split: boolean): MachineQuality {
  const resolved = tier === 'auto' ? 'medium' : tier
  const preset = MACHINE_QUALITY[resolved]
  return { ...preset, agentCount: split ? preset.splitAgentCount : preset.agentCount }
}
