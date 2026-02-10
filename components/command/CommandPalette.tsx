'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { useCommandPalette } from './CommandProvider'
import { useSearch } from '@/hooks/useSearch'
import { CommandResults } from './CommandResults'
import {
  FileText,
  Book,
  Folder,
  User,
  Link,
  Rss,
  Home,
  Clock,
  BookOpen,
  Network,
  Hash,
  Video,
  Mail,
  ExternalLink,
} from 'lucide-react'

export function CommandPalette() {
  const router = useRouter()
  const { open, setOpen } = useCommandPalette()
  const { query, setQuery, results, isLoading, initialize, error } = useSearch()

  // Initialize search when palette opens
  useEffect(() => {
    if (open) {
      initialize()
    }
  }, [open, initialize])

  // Clear query when closing
  useEffect(() => {
    if (!open) {
      setQuery('')
    }
  }, [open, setQuery])

  const handleSelect = (url: string) => {
    setOpen(false)

    // Handle special actions
    if (url === '#copy-url') {
      navigator.clipboard.writeText(window.location.href)
      return
    }

    // Navigate
    router.push(url)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search everything..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-text-3" aria-live="polite">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warm opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-warm" />
            </span>
            Loading search...
          </div>
        )}

        {error && (
          <div className="py-6 text-center text-sm text-error">{error}</div>
        )}

        {!isLoading && query && results.length === 0 && !error && (
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2">
              <span className="text-text-3">No results found</span>
              <span className="text-xs text-text-3/70">
                Try a different search term
              </span>
            </div>
          </CommandEmpty>
        )}

        {!isLoading && !query && <QuickActions onSelect={handleSelect} />}

        {!isLoading && query && results.length > 0 && !error && (
          <CommandResults results={results} onSelect={handleSelect} />
        )}
      </CommandList>

      {/* Footer hint */}
      <div className="flex items-center justify-between border-t border-border-1 px-3 py-2 text-xs text-text-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <kbd className="rounded bg-surface-1 px-1.5 py-0.5 font-mono text-[10px]">↑↓</kbd>
            <span>navigate</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded bg-surface-1 px-1.5 py-0.5 font-mono text-[10px]">↵</kbd>
            <span>select</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded bg-surface-1 px-1.5 py-0.5 font-mono text-[10px]">esc</kbd>
            <span>close</span>
          </span>
        </div>
        <span className="font-mono text-text-3/50">⌘K</span>
      </div>
    </CommandDialog>
  )
}

// Quick actions shown when no query
function QuickActions({ onSelect }: { onSelect: (url: string) => void }) {
  return (
    <>
      <CommandGroup heading="Navigation">
        <CommandItem onSelect={() => onSelect('/')}>
          <Home className="mr-2 h-4 w-4 text-text-3" />
          <span>Home</span>
          <CommandShortcut>G H</CommandShortcut>
        </CommandItem>
        <CommandItem onSelect={() => onSelect('/writing')}>
          <FileText className="mr-2 h-4 w-4 text-text-3" />
          <span>Writing</span>
          <CommandShortcut>G W</CommandShortcut>
        </CommandItem>
        <CommandItem onSelect={() => onSelect('/notes')}>
          <BookOpen className="mr-2 h-4 w-4 text-text-3" />
          <span>Notes</span>
        </CommandItem>
        <CommandItem onSelect={() => onSelect('/library')}>
          <Book className="mr-2 h-4 w-4 text-text-3" />
          <span>Library</span>
          <CommandShortcut>G L</CommandShortcut>
        </CommandItem>
        <CommandItem onSelect={() => onSelect('/media')}>
          <Video className="mr-2 h-4 w-4 text-text-3" />
          <span>Media</span>
        </CommandItem>
        <CommandItem onSelect={() => onSelect('/topics')}>
          <Hash className="mr-2 h-4 w-4 text-text-3" />
          <span>Topics</span>
        </CommandItem>
        <CommandItem onSelect={() => onSelect('/projects')}>
          <Folder className="mr-2 h-4 w-4 text-text-3" />
          <span>Projects</span>
          <CommandShortcut>G P</CommandShortcut>
        </CommandItem>
        <CommandItem onSelect={() => onSelect('/graph')}>
          <Network className="mr-2 h-4 w-4 text-text-3" />
          <span>Knowledge Graph</span>
          <CommandShortcut>G G</CommandShortcut>
        </CommandItem>
      </CommandGroup>

      <CommandSeparator />

      <CommandGroup heading="Pages">
        <CommandItem onSelect={() => onSelect('/about')}>
          <User className="mr-2 h-4 w-4 text-text-3" />
          <span>About</span>
        </CommandItem>
        <CommandItem onSelect={() => onSelect('/now')}>
          <Clock className="mr-2 h-4 w-4 text-text-3" />
          <span>Now</span>
        </CommandItem>
        <CommandItem onSelect={() => onSelect('/subscribe')}>
          <Mail className="mr-2 h-4 w-4 text-text-3" />
          <span>Subscribe</span>
        </CommandItem>
      </CommandGroup>

      <CommandSeparator />

      <CommandGroup heading="Actions">
        <CommandItem onSelect={() => onSelect('#copy-url')}>
          <Link className="mr-2 h-4 w-4 text-text-3" />
          <span>Copy current URL</span>
        </CommandItem>
        <CommandItem onSelect={() => onSelect('/feed.xml')}>
          <Rss className="mr-2 h-4 w-4 text-text-3" />
          <span>RSS Feed</span>
          <CommandShortcut>
            <ExternalLink className="h-3 w-3" />
          </CommandShortcut>
        </CommandItem>
      </CommandGroup>
    </>
  )
}
