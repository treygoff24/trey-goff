const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://trey.world'

export function generatePersonSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Trey Goff',
    url: siteUrl,
    sameAs: ['https://twitter.com/treygoff', 'https://github.com/treygoff'],
    jobTitle: 'Governance Innovation',
    description:
      'Building better governance through acceleration zones and institutional innovation.',
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
      '@type': 'Person',
      name: 'Trey Goff',
      url: siteUrl,
    },
    publisher: {
      '@type': 'Person',
      name: 'Trey Goff',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/writing/${essay.slug}`,
    },
  }
}

export function generateBookSchema(book: {
  title: string
  author: string
  isbn13?: string
  url?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title,
    author: {
      '@type': 'Person',
      name: book.author,
    },
    ...(book.isbn13 ? { isbn: book.isbn13 } : {}),
    ...(book.url ? { url: book.url } : {}),
  }
}
