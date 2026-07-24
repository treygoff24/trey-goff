import { allEssays, allNotes, allProjects } from 'content-collections'
import appearancesData from '@/content/media/appearances.json'
import { getAllBooks } from '@/lib/books'
import bookColors from '@/public/book-colors.json'
import coverMap from '@/public/cover-map.json'
import type { EditionCatalogItem } from '@/lib/edition/catalog'
import { getAllTransmissions } from '@/lib/transmissions'

interface AppearanceData {
  appearances: Array<{
    id: string
    title: string
    show: string
    type: string
    date: string
    url: string
    summary: string
  }>
}

export function visibleEditionEssays<T extends { status: string }>(essays: readonly T[]): T[] {
  return essays.filter((essay) => essay.status !== 'draft')
}

const visibleEssays = visibleEditionEssays(allEssays)
const books = getAllBooks()

const routePointers: EditionCatalogItem[] = [
  {
    type: 'essays',
    slug: 'writing',
    title: 'All writing',
    date: '',
    summary: 'Essays and field notes on governance, technology, faith, and building.',
    tags: ['writing'],
    href: '/writing',
    meta: 'Index',
  },
  {
    type: 'projects',
    slug: 'projects',
    title: 'All projects',
    date: '',
    summary: 'Software, policy initiatives, institutional work, and experiments.',
    tags: ['projects'],
    href: '/projects',
    meta: 'Index',
  },
  {
    type: 'library',
    slug: 'library',
    title: 'The library',
    date: '',
    summary: "A few hundred books mapped as a constellation of what I've read.",
    tags: ['books'],
    href: '/library',
    meta: `${books.length} books`,
  },
  {
    type: 'about',
    slug: 'about',
    title: 'About Trey',
    date: '',
    summary: "Mississippi roots, a cosmopolitan orbit, and what I'm chasing.",
    tags: ['biography'],
    href: '/about',
    meta: 'One person',
  },
]

const essayItems: EditionCatalogItem[] = visibleEssays.map((essay) => ({
  type: 'essays',
  slug: essay.slug,
  title: essay.title,
  date: essay.date,
  summary: essay.summary,
  tags: essay.tags,
  href: `/writing/${essay.slug}`,
  meta: `${essay.readingTime} min`,
}))

const noteItems: EditionCatalogItem[] = allNotes.map((note) => ({
  type: 'essays',
  slug: `note:${note.slug}`,
  title: note.title || 'A field note',
  date: note.date,
  summary: note.content
    .replace(/[#*_`[\]]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 220),
  tags: note.tags,
  href: '/notes',
  meta: 'Field note',
}))

const projectItems: EditionCatalogItem[] = allProjects.map((project) => ({
  type: 'projects',
  slug: project.slug,
  title: project.name,
  date: '',
  summary: project.oneLiner,
  tags: project.tags,
  href: `/projects#${project.slug}`,
  meta: project.type,
}))

// cover-map also holds generated data-URI placeholders (old palette); only real files shelf-render.
function realCover(bookId: string, coverUrl: string | undefined): string | undefined {
  const url = coverUrl ?? (coverMap as Record<string, string>)[bookId]
  return url?.startsWith('/covers/') ? url : undefined
}

const bookItems: EditionCatalogItem[] = books.map((book) => {
  const coverUrl = realCover(book.id, book.coverUrl)
  return {
    type: 'library',
    slug: book.id,
    title: book.title,
    date: String(book.year),
    summary: book.whyILoveIt || `By ${book.author}.`,
    tags: book.topics.slice(0, 5),
    href: `/library#${book.id}`,
    meta: book.author,
    coverUrl,
    accent: coverUrl ? (bookColors as Record<string, string>)[book.id] : undefined,
  }
})

const transmissionItems: EditionCatalogItem[] = getAllTransmissions().map((item) => ({
  type: 'transmissions',
  slug: item.id,
  title: item.title,
  date: item.date,
  summary: item.summary,
  tags: item.tags,
  href: item.url,
  meta: item.publication,
}))

const appearanceItems: EditionCatalogItem[] = (appearancesData as AppearanceData).appearances.map(
  (item) => ({
    type: 'transmissions',
    slug: `appearance:${item.id}`,
    title: item.title,
    date: item.date,
    summary: item.summary,
    tags: [item.type, item.show],
    href: item.url,
    meta: item.show,
  }),
)

export const editionCatalog: readonly EditionCatalogItem[] = [
  ...routePointers,
  ...essayItems,
  ...noteItems,
  ...projectItems,
  ...bookItems,
  ...transmissionItems,
  ...appearanceItems,
]
