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
} from 'lucide-react'

export function CommandPalette() {
  const router = useRouter()
  const { open, setOpen } = useCommandPalette()
  const { query, setQuery, results, isLoading, initialize } = useSearch()

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
          <div className="py-6 text-center text-sm text-text-3">
            Loading search...
          </div>
        )}

        {!isLoading && query && results.length === 0 && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}

        {!isLoading && !query && <QuickActions onSelect={handleSelect} />}

        {!isLoading && query && results.length > 0 && (
          <CommandResults results={results} onSelect={handleSelect} />
        )}
      </CommandList>
    </CommandDialog>
  )
}

// Quick actions shown when no query
function QuickActions({ onSelect }: { onSelect: (url: string) => void }) {
  return (
    <>
      <CommandGroup heading="Navigation">
        <CommandItem onSelect={() => onSelect('/')}>
          <Home className="mr-2 h-4 w-4" />
          Home
        </CommandItem>
        <CommandItem onSelect={() => onSelect('/writing')}>
          <FileText className="mr-2 h-4 w-4" />
          Writing
        </CommandItem>
        <CommandItem onSelect={() => onSelect('/notes')}>
          <BookOpen className="mr-2 h-4 w-4" />
          Notes
        </CommandItem>
        <CommandItem onSelect={() => onSelect('/library')}>
          <Book className="mr-2 h-4 w-4" />
          Library
        </CommandItem>
        <CommandItem onSelect={() => onSelect('/projects')}>
          <Folder className="mr-2 h-4 w-4" />
          Projects
        </CommandItem>
        <CommandItem onSelect={() => onSelect('/about')}>
          <User className="mr-2 h-4 w-4" />
          About
        </CommandItem>
        <CommandItem onSelect={() => onSelect('/now')}>
          <Clock className="mr-2 h-4 w-4" />
          Now
        </CommandItem>
        <CommandItem onSelect={() => onSelect('/graph')}>
          <Network className="mr-2 h-4 w-4" />
          Knowledge Graph
        </CommandItem>
      </CommandGroup>

      <CommandSeparator />

      <CommandGroup heading="Actions">
        <CommandItem onSelect={() => onSelect('#copy-url')}>
          <Link className="mr-2 h-4 w-4" />
          Copy current URL
        </CommandItem>
        <CommandItem onSelect={() => onSelect('/feed.xml')}>
          <Rss className="mr-2 h-4 w-4" />
          RSS Feed
        </CommandItem>
      </CommandGroup>
    </>
  )
}
