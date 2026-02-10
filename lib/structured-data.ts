const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://trey.world'

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

export function generateBookSchema(book: {
  title: string
  author: string
  isbn13?: string
  url?: string
  coverUrl?: string
  year?: number
  publisher?: string
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
    ...(book.coverUrl ? { image: book.coverUrl } : {}),
    ...(book.year ? { datePublished: `${book.year}` } : {}),
    ...(book.publisher
      ? { publisher: { '@type': 'Organization', name: book.publisher } }
      : {}),
    inLanguage: 'en',
  }
}
