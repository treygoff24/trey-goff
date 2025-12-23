import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { getTopicHref, getTopicContent, getTopicsIndex } from '@/lib/topics'

describe('topic helpers', () => {
  test('getTopicHref encodes special characters', () => {
    assert.equal(getTopicHref('risk & systems'), '/topics/risk%20%26%20systems')
    assert.equal(getTopicHref('c++'), '/topics/c%2B%2B')
  })

  test('topic counts are internally consistent', () => {
    const topics = getTopicsIndex()
    for (const topic of topics) {
      const total =
        topic.counts.essays + topic.counts.notes + topic.counts.books
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
    const { essays, notes, books } = getTopicContent(topic.tag)

    assert.equal(essays.length, topic.counts.essays)
    assert.equal(notes.length, topic.counts.notes)
    assert.equal(books.length, topic.counts.books)
  })
})
