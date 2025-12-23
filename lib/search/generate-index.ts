import { allEssays, allNotes, allProjects } from 'content-collections'
import { readFileSync } from 'fs'
import type { SearchDocument, SearchIndex } from './types'
import type { BooksData } from '@/lib/books/types'

// Load books data
function loadBooks(): BooksData['books'] {
  try {
    const booksData: BooksData = JSON.parse(
      readFileSync('./content/library/books.json', 'utf-8')
    )
    return booksData.books
  } catch {
    return []
  }
}

// Navigation pages (static)
const navigationPages: SearchDocument[] = [
  {
    id: 'nav-home',
    type: 'page',
    title: 'Home',
    description: 'The Control Room',
    url: '/',
    priority: 10,
  },
  {
    id: 'nav-writing',
    type: 'page',
    title: 'Writing',
    description: 'Essays and long-form content',
    url: '/writing',
    priority: 10,
  },
  {
    id: 'nav-notes',
    type: 'page',
    title: 'Notes',
    description: 'Quick thoughts and links',
    url: '/notes',
    priority: 10,
  },
  {
    id: 'nav-library',
    type: 'page',
    title: 'Library',
    description: 'Books and reading',
    url: '/library',
    priority: 10,
  },
  {
    id: 'nav-topics',
    type: 'page',
    title: 'Topics',
    description: 'Signals across essays, notes, and books',
    url: '/topics',
    priority: 9,
  },
  {
    id: 'nav-projects',
    type: 'page',
    title: 'Projects',
    description: "Things I've built",
    url: '/projects',
    priority: 10,
  },
  {
    id: 'nav-about',
    type: 'page',
    title: 'About',
    description: 'Who I am and what I believe',
    url: '/about',
    priority: 10,
  },
  {
    id: 'nav-now',
    type: 'page',
    title: 'Now',
    description: "What I'm currently focused on",
    url: '/now',
    priority: 8,
  },
  {
    id: 'nav-subscribe',
    type: 'page',
    title: 'Subscribe',
    description: 'Newsletter signup',
    url: '/subscribe',
    priority: 8,
  },
  {
    id: 'nav-colophon',
    type: 'page',
    title: 'Colophon',
    description: 'How this site was built',
    url: '/colophon',
    priority: 6,
  },
  {
    id: 'nav-graph',
    type: 'page',
    title: 'Knowledge Graph',
    description: 'Visual map of connected ideas',
    url: '/graph',
    priority: 6,
  },
]

// Quick actions
const quickActions: SearchDocument[] = [
  {
    id: 'action-copy-url',
    type: 'action',
    title: 'Copy current URL',
    keywords: ['share', 'link', 'clipboard'],
    url: '#copy-url',
    priority: 5,
  },
  {
    id: 'action-rss',
    type: 'action',
    title: 'RSS Feed',
    description: 'Subscribe via RSS',
    url: '/feed.xml',
    priority: 5,
  },
]

// Easter egg
const easterEggs: SearchDocument[] = [
  {
    id: 'easter-powerlifting',
    type: 'page',
    title: 'Powerlifting',
    description: 'The hidden gym page',
    keywords: ['gym', 'lifting', 'fitness', 'strength'],
    url: '/powerlifting',
    priority: 1,
  },
]

export function generateSearchIndex(): SearchIndex {
  const documents: SearchDocument[] = []

  // Add navigation
  documents.push(...navigationPages)

  // Add actions
  documents.push(...quickActions)

  // Add essays
  for (const essay of allEssays) {
    if (essay.status === 'draft') continue

    documents.push({
      id: `essay-${essay.slug}`,
      type: 'essay',
      title: essay.title,
      description: essay.summary,
      content: essay.content.slice(0, 200),
      tags: essay.tags,
      url: `/writing/${essay.slug}`,
      priority: essay.status === 'evergreen' ? 8 : 6,
    })
  }

  // Add notes
  for (const note of allNotes) {
    documents.push({
      id: `note-${note.slug}`,
      type: 'note',
      title: note.title || `Note from ${note.date}`,
      content: note.content.slice(0, 200),
      tags: note.tags,
      url: `/notes#${note.slug}`,
      priority: 4,
    })
  }

  // Add books
  const books = loadBooks()
  for (const book of books) {
    documents.push({
      id: `book-${book.id}`,
      type: 'book',
      title: book.title,
      description: `by ${book.author} (${book.year})`,
      content: book.whyILoveIt.slice(0, 200),
      tags: book.topics,
      keywords: [book.author, book.genre || ''].filter(Boolean),
      url: `/library#${book.id}`,
      priority: book.rating === 5 ? 7 : 5,
    })
  }

  // Add projects
  for (const project of allProjects) {
    documents.push({
      id: `project-${project.slug}`,
      type: 'project',
      title: project.name,
      description: project.oneLiner,
      content: `${project.problem} ${project.approach}`.slice(0, 200),
      tags: project.tags,
      url: `/projects#${project.slug}`,
      priority: project.status === 'active' ? 7 : 5,
    })
  }

  // Add easter eggs (low priority, but findable)
  documents.push(...easterEggs)

  return {
    documents,
    version: '1.0',
    generatedAt: new Date().toISOString(),
  }
}
