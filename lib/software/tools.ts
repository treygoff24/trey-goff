import { readFileSync } from 'fs'
import { join } from 'path'
import toolsData from '@/content/software/tools.json'

export interface ToolCapture {
  file: string
  capturedAt: string
  prompt: string
}

export interface ToolLink {
  label: string
  url: string
  rel?: string
}

export interface Tool {
  id: string
  name: string
  bin?: string
  oneLiner: string
  flex?: string
  station: string
  stack: string
  status: 'daily-driver' | 'published' | 'working' | 'experiment'
  featured: boolean
  order: number
  runsWith: string[]
  keywords?: string[]
  links: ToolLink[]
  capture: ToolCapture | null
}

export interface Station {
  id: string
  name: string
  line: string
}

const data = toolsData as { stations: Station[]; tools: Tool[] }

export const stations: Station[] = data.stations
export const tools: Tool[] = data.tools

export const featuredTools = tools.filter((t) => t.featured).sort((a, b) => a.order - b.order)

export const ledgerTools = tools
  .filter((t) => !t.featured)
  .sort((a, b) => a.station.localeCompare(b.station) || a.order - b.order)

export const toolById = new Map(tools.map((t) => [t.id, t]))

export function featuredByStation(stationId: string): Tool[] {
  return featuredTools.filter((t) => t.station === stationId)
}

export function readCapture(capture: ToolCapture): string {
  return readFileSync(
    join(process.cwd(), 'content', 'software', 'captures', capture.file),
    'utf-8',
  ).trimEnd()
}
