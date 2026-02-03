'use client'

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

interface CommandPaletteContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(
  null
)

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)

  const toggle = useCallback(() => setOpen((prev) => !prev), [])

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    document.documentElement.dataset.commandPaletteReady = 'true'
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        toggle()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      delete document.documentElement.dataset.commandPaletteReady
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [toggle])

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen, toggle }}>
      {children}
    </CommandPaletteContext.Provider>
  )
}

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext)
  if (!context) {
    throw new Error(
      'useCommandPalette must be used within CommandPaletteProvider'
    )
  }
  return context
}
