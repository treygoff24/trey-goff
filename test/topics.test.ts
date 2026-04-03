import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { groupBooksByAuthor } from '@/lib/library/topics'
import { getTopicHref, getTopicContent, getTopicsIndex } from '@/lib/topics'
import type { Book } from '@/lib/books/types'

function book(overrides: Partial<Book> = {}): Book {
  return {
    id: 'book',
    title: 'Book',
    author: 'Author',
    year: 2025,
    status: 'want',
    topics: ['topic'],
    whyILoveIt: 'Because.',
    ...overrides,
  }
}

describe('topic helpers', () => {
  test('getTopicHref encodes special characters', () => {
    assert.equal(getTopicHref('risk & systems'), '/topics/risk%20%26%20systems')
    assert.equal(getTopicHref('c++'), '/topics/c%2B%2B')
  })

  test('topic counts are internally consistent', () => {
    const topics = getTopicsIndex()
    for (const topic of topics) {
      const total =
        topic.counts.essays + topic.counts.notes + topic.counts.books + topic.counts.projects
      assert.equal(topic.counts.total, total)
    }
  })

  test('getTopicContent matches index counts for the first topic', () => {
    const topics = getTopicsIndex()
    if (topics.length === 0) {
      assert.ok(true)
      return
    }

    const topic = topics[0]!
    const { essays, notes, books, projects } = getTopicContent(topic.tag)

    assert.equal(essays.length, topic.counts.essays)
    assert.equal(notes.length, topic.counts.notes)
    assert.equal(books.length, topic.counts.books)
    assert.equal(projects.length, topic.counts.projects)
  })
})

describe('library topic grouping helpers', () => {
  test('groupBooksByAuthor bins lowercase initials with their uppercase range', () => {
    const groups = groupBooksByAuthor([
      book({ id: 'qntm', author: 'qntm' }),
      book({ id: 'ursula', author: 'Ursula K. Le Guin' }),
    ])

    const qt = groups.find((group) => group.label === 'Q–T')
    const uz = groups.find((group) => group.label === 'U–Z')

    assert.deepEqual(
      qt?.books.map((entry) => entry.id),
      ['qntm'],
      'lowercase q authors should stay in the Q–T bucket',
    )
    assert.deepEqual(
      uz?.books.map((entry) => entry.id),
      ['ursula'],
      'uppercase U authors should stay in the U–Z bucket',
    )
  })
})
