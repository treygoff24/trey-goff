import { siteUrl } from '@/lib/site-config'

const personId = `${siteUrl}/#person`
const websiteId = `${siteUrl}/#website`

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Trey Goff',
    url: siteUrl,
  }
}

export function generatePersonSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': personId,
    name: 'Trey Goff',
    url: siteUrl,
    sameAs: ['https://x.com/thetreygoff', 'https://github.com/treygoff24'],
    jobTitle: 'Governance Innovation',
    description:
      'Building better governance through institutional design and practical experimentation.',
  }
}

export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': websiteId,
    name: 'Trey Goff',
    url: siteUrl,
    publisher: {
      '@id': personId,
    },
  }
}

export function generateProfilePageSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': `${siteUrl}/about`,
    url: `${siteUrl}/about`,
    name: 'About — Trey Goff',
    mainEntity: {
      '@id': personId,
    },
  }
}

export function generateArticleSchema(essay: {
  title: string
  summary: string
  date: string
  slug: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: essay.title,
    description: essay.summary,
    datePublished: essay.date,
    dateModified: essay.date,
    author: {
      '@id': personId,
      '@type': 'Person',
      name: 'Trey Goff',
      url: siteUrl,
    },
    publisher: {
      '@id': personId,
      '@type': 'Person',
      name: 'Trey Goff',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/writing/${essay.slug}`,
    },
  }
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export type BookSchemaInput = {
  title: string
  author: string
  isbn13?: string
  url?: string
  coverUrl?: string
  year?: number
  publisher?: string
}

/** A schema.org Person or Organization reference, as it appears inside a Book node. */
interface AgentNode {
  '@type': 'Person' | 'Organization'
  name: string
}

/** A schema.org Book node. Optional keys are omitted entirely when the source lacks them. */
export interface BookSchemaNode {
  '@type': 'Book'
  '@id'?: string
  name: string
  author: AgentNode
  isbn?: string
  url?: string
  image?: string
  datePublished?: string
  publisher?: AgentNode
  inLanguage: string
}

/** One Book node for use inside `@graph` (no root `@context`). */
function bookSchemaNode(book: BookSchemaInput): BookSchemaNode {
  return {
    '@type': 'Book',
    ...(book.url ? { '@id': book.url } : {}),
    name: book.title,
    author: {
      '@type': 'Person',
      name: book.author,
    },
    ...(book.isbn13 ? { isbn: book.isbn13 } : {}),
    ...(book.url ? { url: book.url } : {}),
    ...(book.coverUrl ? { image: book.coverUrl } : {}),
    ...(book.year ? { datePublished: `${book.year}` } : {}),
    ...(book.publisher ? { publisher: { '@type': 'Organization', name: book.publisher } } : {}),
    inLanguage: 'en',
  }
}

/**
 * Single JSON-LD document for many books (one script tag, smaller HTML than N scripts).
 * @see https://json-ld.org/spec/latest/json-ld/#node-identifiers
 */
export function generateLibraryBooksGraph(books: BookSchemaInput[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': books.map(bookSchemaNode),
  }
}
