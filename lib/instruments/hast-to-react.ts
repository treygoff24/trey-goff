import type { ReactElement } from 'react'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import type { Root } from 'hast'
import { toJsxRuntime, type Components } from 'hast-util-to-jsx-runtime'

/**
 * The tree-to-React half of the renderer seam, kept apart from `render.ts` so a client
 * component can reach it without dragging the whole remark/rehype pipeline into the browser.
 * Dossier bodies are fetched as sanitized trees and compiled here, on the client, which is
 * how the slide-over stays out of the page payload without resorting to raw HTML injection.
 */

/**
 * Instrument nodes are authored as custom elements so they survive sanitization and stay
 * legible in the markdown.
 */
export const INSTRUMENT_TAGS = [
  'instrument-stat',
  'instrument-forecast',
  'instrument-spine',
  'instrument-ledger',
  'instrument-notes',
  'instrument-scope',
  'instrument-chart',
  'instrument-audit',
  /**
   * The one tag no author writes: the mark compiler emits it around an annotated span, and
   * it is listed here so the sanitize schema of the two pipelines still differs by exactly
   * this set — the wrap is produced after sanitization, but a dossier body compiled on the
   * client goes through the same schema and must not be able to smuggle one in.
   */
  'instrument-note',
] as const

export type InstrumentTag = (typeof INSTRUMENT_TAGS)[number]

export type InstrumentComponents = Partial<Record<InstrumentTag | 'mark', Components[string]>>

export function hastToReact(tree: Root, components?: InstrumentComponents): ReactElement {
  return toJsxRuntime(tree, {
    Fragment,
    jsx,
    jsxs,
    components: components as Components,
  })
}
