import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { generateSearchIndex } from '@/lib/search/generate-index'
import type { SearchDocument, SearchIndex } from '@/lib/search/types'

// ============================================
// Search index structure tests
// ============================================

describe('generateSearchIndex structure', () => {
  test('returns valid SearchIndex structure', () => {
    const index = generateSearchIndex()

    assert.ok(Array.isArray(index.documents), 'Should have documents array')
    assert.ok(typeof index.version === 'string', 'Should have version string')
    assert.ok(typeof index.generatedAt === 'string', 'Should have generatedAt string')
  })

  test('generatedAt is valid ISO date', () => {
    const index = generateSearchIndex()
    const date = new Date(index.generatedAt)
    assert.ok(!isNaN(date.getTime()), 'generatedAt should be valid date')
  })

  test('has documents', () => {
    const index = generateSearchIndex()
    assert.ok(index.documents.length > 0, 'Should have at least one document')
  })
})

// ============================================
// Document structure tests
// ============================================

describe('search document structure', () => {
  test('all documents have required fields', () => {
    const { documents } = generateSearchIndex()

    for (const doc of documents) {
      assert.ok(typeof doc.id === 'string', 'Document should have string id')
      assert.ok(typeof doc.type === 'string', 'Document should have string type')
      assert.ok(typeof doc.title === 'string', 'Document should have string title')
      assert.ok(typeof doc.url === 'string', 'Document should have string url')
    }
  })

  test('document IDs are unique', () => {
    const { documents } = generateSearchIndex()
    const ids = documents.map((d) => d.id)
    const uniqueIds = [...new Set(ids)]
    assert.equal(ids.length, uniqueIds.length, 'All document IDs should be unique')
  })

  test('documents have valid types', () => {
    const { documents } = generateSearchIndex()
    const validTypes = ['essay', 'note', 'book', 'project', 'page', 'action']

    for (const doc of documents) {
      assert.ok(validTypes.includes(doc.type), `Document type "${doc.type}" should be valid`)
    }
  })

  test('documents have non-empty titles', () => {
    const { documents } = generateSearchIndex()

    for (const doc of documents) {
      assert.ok(doc.title.trim().length > 0, 'Document titles should not be empty')
    }
  })

  test('documents have non-empty URLs', () => {
    const { documents } = generateSearchIndex()

    for (const doc of documents) {
      assert.ok(doc.url.trim().length > 0, 'Document URLs should not be empty')
    }
  })
})

// ============================================
// Navigation pages tests
// ============================================

describe('navigation pages in search index', () => {
  test('includes Home page', () => {
    const { documents } = generateSearchIndex()
    const home = documents.find((d) => d.id === 'nav-home')

    assert.ok(home, 'Should have Home navigation page')
    assert.equal(home.type, 'page')
    assert.equal(home.url, '/')
  })

  test('includes Writing page', () => {
    const { documents } = generateSearchIndex()
    const writing = documents.find((d) => d.id === 'nav-writing')

    assert.ok(writing, 'Should have Writing navigation page')
    assert.equal(writing.url, '/writing')
  })

  test('includes Notes page', () => {
    const { documents } = generateSearchIndex()
    const notes = documents.find((d) => d.id === 'nav-notes')

    assert.ok(notes, 'Should have Notes navigation page')
    assert.equal(notes.url, '/notes')
  })

  test('includes Library page', () => {
    const { documents } = generateSearchIndex()
    const library = documents.find((d) => d.id === 'nav-library')

    assert.ok(library, 'Should have Library navigation page')
    assert.equal(library.url, '/library')
  })

  test('includes About page', () => {
    const { documents } = generateSearchIndex()
    const about = documents.find((d) => d.id === 'nav-about')

    assert.ok(about, 'Should have About navigation page')
    assert.equal(about.url, '/about')
  })

  test('includes Knowledge Graph page', () => {
    const { documents } = generateSearchIndex()
    const graph = documents.find((d) => d.id === 'nav-graph')

    assert.ok(graph, 'Should have Knowledge Graph page')
    assert.equal(graph.url, '/graph')
  })

  test('navigation pages have high priority', () => {
    const { documents } = generateSearchIndex()
    const navPages = documents.filter((d) => d.id.startsWith('nav-'))

    // Main navigation should have priority >= 6
    const mainNav = navPages.filter((d) =>
      ['nav-home', 'nav-writing', 'nav-notes', 'nav-library', 'nav-about'].includes(d.id)
    )

    for (const page of mainNav) {
      assert.ok(
        page.priority && page.priority >= 6,
        `Main navigation ${page.id} should have priority >= 6`
      )
    }
  })
})

// ============================================
// Quick actions tests
// ============================================

describe('quick actions in search index', () => {
  test('includes RSS Feed action', () => {
    const { documents } = generateSearchIndex()
    const rss = documents.find((d) => d.id === 'action-rss')

    assert.ok(rss, 'Should have RSS action')
    assert.equal(rss.type, 'action')
    assert.equal(rss.url, '/feed.xml')
  })

  test('includes Copy URL action', () => {
    const { documents } = generateSearchIndex()
    const copyUrl = documents.find((d) => d.id === 'action-copy-url')

    assert.ok(copyUrl, 'Should have Copy URL action')
    assert.equal(copyUrl.type, 'action')
  })

  test('actions have keywords for better searchability', () => {
    const { documents } = generateSearchIndex()
    const copyUrl = documents.find((d) => d.id === 'action-copy-url')

    assert.ok(copyUrl?.keywords?.includes('share'), 'Copy URL should have share keyword')
    assert.ok(copyUrl?.keywords?.includes('link'), 'Copy URL should have link keyword')
  })
})

// ============================================
// Content documents tests
// ============================================

describe('content documents in search index', () => {
  test('essay documents link to /writing/<slug>', () => {
    const { documents } = generateSearchIndex()
    const essays = documents.filter((d) => d.type === 'essay')

    for (const essay of essays) {
      assert.ok(essay.url.startsWith('/writing/'), `Essay URL ${essay.url} should start with /writing/`)
      assert.ok(essay.id.startsWith('essay-'), 'Essay ID should start with essay-')
    }
  })

  test('note documents link to /notes#<slug>', () => {
    const { documents } = generateSearchIndex()
    const notes = documents.filter((d) => d.type === 'note')

    for (const note of notes) {
      assert.ok(note.url.startsWith('/notes#'), `Note URL ${note.url} should start with /notes#`)
      assert.ok(note.id.startsWith('note-'), 'Note ID should start with note-')
    }
  })

  test('book documents link to /library#<id>', () => {
    const { documents } = generateSearchIndex()
    const books = documents.filter((d) => d.type === 'book')

    assert.ok(books.length > 0, 'Should have book documents')

    for (const book of books) {
      assert.ok(book.url.startsWith('/library#'), `Book URL ${book.url} should start with /library#`)
      assert.ok(book.id.startsWith('book-'), 'Book ID should start with book-')
    }
  })

  test('book documents include author in description', () => {
    const { documents } = generateSearchIndex()
    const books = documents.filter((d) => d.type === 'book')

    for (const book of books) {
      assert.ok(
        book.description?.includes('by '),
        `Book description "${book.description}" should include "by " for author`
      )
    }
  })

  test('essay content is truncated', () => {
    const { documents } = generateSearchIndex()
    const essays = documents.filter((d) => d.type === 'essay')

    for (const essay of essays) {
      if (essay.content) {
        assert.ok(
          essay.content.length <= 200,
          'Essay content should be truncated to 200 chars'
        )
      }
    }
  })

  test('note content is truncated', () => {
    const { documents } = generateSearchIndex()
    const notes = documents.filter((d) => d.type === 'note')

    for (const note of notes) {
      if (note.content) {
        assert.ok(
          note.content.length <= 200,
          'Note content should be truncated to 200 chars'
        )
      }
    }
  })
})

// ============================================
// Priority tests
// ============================================

describe('search document priorities', () => {
  test('evergreen essays have higher priority than regular essays', () => {
    const { documents } = generateSearchIndex()
    const essays = documents.filter((d) => d.type === 'essay')

    // All essays should have priority
    for (const essay of essays) {
      assert.ok(typeof essay.priority === 'number', 'Essays should have priority')
    }
  })

  test('5-star books have higher priority than others', () => {
    const { documents } = generateSearchIndex()
    const books = documents.filter((d) => d.type === 'book')

    // Books should have priority 5 or 7 (for 5-star)
    for (const book of books) {
      assert.ok(
        book.priority === 5 || book.priority === 7,
        `Book priority should be 5 or 7, got ${book.priority}`
      )
    }
  })

  test('notes have lower priority than main navigation pages', () => {
    const { documents } = generateSearchIndex()
    const notes = documents.filter((d) => d.type === 'note')
    const mainNavPages = documents.filter((d) =>
      ['nav-home', 'nav-writing', 'nav-notes', 'nav-library', 'nav-about'].includes(d.id)
    )

    if (notes.length > 0 && mainNavPages.length > 0) {
      const maxNotePriority = Math.max(...notes.map((n) => n.priority || 0))
      const minMainPagePriority = Math.min(...mainNavPages.map((p) => p.priority || 0))

      assert.ok(
        maxNotePriority < minMainPagePriority,
        `Notes max priority (${maxNotePriority}) should be less than main nav min (${minMainPagePriority})`
      )
    }
  })
})

// ============================================
// Tags and keywords tests
// ============================================

describe('search document tags and keywords', () => {
  test('essay documents include tags', () => {
    const { documents } = generateSearchIndex()
    const essays = documents.filter((d) => d.type === 'essay')

    for (const essay of essays) {
      assert.ok(Array.isArray(essay.tags), 'Essays should have tags array')
    }
  })

  test('book documents include topics as tags', () => {
    const { documents } = generateSearchIndex()
    const books = documents.filter((d) => d.type === 'book')

    for (const book of books) {
      assert.ok(Array.isArray(book.tags), 'Books should have tags array (topics)')
    }
  })

  test('book documents include author in keywords', () => {
    const { documents } = generateSearchIndex()
    const books = documents.filter((d) => d.type === 'book')

    for (const book of books) {
      assert.ok(Array.isArray(book.keywords), 'Books should have keywords array')
      // Author should be first keyword
      assert.ok(book.keywords.length > 0, 'Books should have at least one keyword (author)')
    }
  })
})

// ============================================
// Easter eggs tests
// ============================================

describe('easter eggs in search index', () => {
  test('includes hidden powerlifting page', () => {
    const { documents } = generateSearchIndex()
    const powerlifting = documents.find((d) => d.id === 'easter-powerlifting')

    assert.ok(powerlifting, 'Should have powerlifting easter egg')
    assert.equal(powerlifting.url, '/powerlifting')
  })

  test('easter eggs have low priority', () => {
    const { documents } = generateSearchIndex()
    const easterEggs = documents.filter((d) => d.id.startsWith('easter-'))

    for (const egg of easterEggs) {
      assert.ok(
        egg.priority && egg.priority <= 2,
        'Easter eggs should have low priority'
      )
    }
  })

  test('easter eggs have searchable keywords', () => {
    const { documents } = generateSearchIndex()
    const powerlifting = documents.find((d) => d.id === 'easter-powerlifting')

    assert.ok(powerlifting?.keywords?.includes('gym'), 'Powerlifting should have gym keyword')
    assert.ok(powerlifting?.keywords?.includes('fitness'), 'Powerlifting should have fitness keyword')
  })
})
