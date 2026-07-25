import type { ReactNode } from 'react'

/**
 * What a compiled instrument node hands its component. `hast-util-to-jsx-runtime` renames
 * hast properties to their attribute spelling on the way out, so `dataNoteId` arrives as
 * `data-note-id` — but only for elements it recognises as custom. Reading both spellings
 * costs nothing and removes a whole class of silent blank instrument.
 */
export interface InstrumentNodeProps {
  children?: ReactNode
  [key: string]: unknown
}

export function attr(props: InstrumentNodeProps, name: string): string | undefined {
  const camel = name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())
  const value = props[name] ?? props[camel]
  return typeof value === 'string' ? value : undefined
}

/** Every instrument tag addresses its data the same way: `data-id`. */
export function nodeId(props: InstrumentNodeProps): string | undefined {
  return attr(props, 'data-id')
}
