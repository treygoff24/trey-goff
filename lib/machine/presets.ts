import type { InstitutionValues } from './sim'

export interface MachinePreset {
  name: string
  description: string
  values: InstitutionValues
}

export const MACHINE_PRESETS: readonly MachinePreset[] = [
  {
    name: 'Baseline',
    description: 'Workable rules, ordinary friction, room to compound.',
    values: { propertySecurity: 68, permitting: 66, openExchange: 62, taxDrag: 28 },
  },
  {
    name: 'Secure Titles',
    description: 'What people build is overwhelmingly likely to remain theirs.',
    values: { propertySecurity: 98, permitting: 72, openExchange: 70, taxDrag: 20 },
  },
  {
    name: 'Permit Maze',
    description: 'Investment waits while approvals work through the stack.',
    values: { propertySecurity: 72, permitting: 8, openExchange: 58, taxDrag: 30 },
  },
  {
    name: 'Predator State',
    description: 'Weak claims, narrow exchange, and little left to reinvest.',
    values: { propertySecurity: 2, permitting: 24, openExchange: 20, taxDrag: 76 },
  },
] as const
