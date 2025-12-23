import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { cn, formatDate, formatDateShort, formatDateRelative } from '@/lib/utils'

describe('cn (class name merger)', () => {
  test('merges simple class names', () => {
    assert.equal(cn('foo', 'bar'), 'foo bar')
  })

  test('handles conditional classes', () => {
    assert.equal(cn('base', false && 'hidden', true && 'visible'), 'base visible')
  })

  test('merges conflicting Tailwind classes (last wins)', () => {
    assert.equal(cn('p-4', 'p-2'), 'p-2')
    assert.equal(cn('text-red-500', 'text-blue-500'), 'text-blue-500')
  })

  test('handles arrays of classes', () => {
    assert.equal(cn(['foo', 'bar'], 'baz'), 'foo bar baz')
  })

  test('handles object syntax', () => {
    assert.equal(cn({ foo: true, bar: false, baz: true }), 'foo baz')
  })

  test('handles undefined and null', () => {
    assert.equal(cn('foo', undefined, null, 'bar'), 'foo bar')
  })

  test('returns empty string for no arguments', () => {
    assert.equal(cn(), '')
  })

  test('merges Tailwind responsive variants correctly', () => {
    // Responsive prefixes should be kept separate
    assert.equal(cn('p-4', 'md:p-8'), 'p-4 md:p-8')
  })

  test('merges Tailwind arbitrary values', () => {
    assert.equal(cn('text-[#FFB86B]', 'text-white'), 'text-white')
  })
})

describe('formatDate', () => {
  test('formats ISO date string to full date', () => {
    // Use full ISO datetime to avoid timezone issues
    const result = formatDate('2024-01-15T12:00:00')
    assert.equal(result, 'January 15, 2024')
  })

  test('formats Date object to full date', () => {
    // Create date with explicit time to avoid midnight UTC issues
    const result = formatDate(new Date(2024, 5, 1)) // Month is 0-indexed (5 = June)
    assert.equal(result, 'June 1, 2024')
  })

  test('formats date at year boundary', () => {
    assert.equal(formatDate('2024-12-31T12:00:00'), 'December 31, 2024')
    assert.equal(formatDate('2024-01-01T12:00:00'), 'January 1, 2024')
  })
})

describe('formatDateShort', () => {
  test('formats ISO date string to short date', () => {
    const result = formatDateShort('2024-01-15T12:00:00')
    assert.equal(result, 'Jan 15, 2024')
  })

  test('formats Date object to short date', () => {
    const result = formatDateShort(new Date(2024, 5, 1)) // June 1
    assert.equal(result, 'Jun 1, 2024')
  })

  test('formats September (Sep, not Sept)', () => {
    const result = formatDateShort('2024-09-15T12:00:00')
    assert.equal(result, 'Sep 15, 2024')
  })
})

describe('formatDateRelative', () => {
  test('returns "Today" for current date', () => {
    const today = new Date()
    const result = formatDateRelative(today)
    assert.equal(result, 'Today')
  })

  test('returns "Yesterday" for date one day ago', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const result = formatDateRelative(yesterday)
    assert.equal(result, 'Yesterday')
  })

  test('returns "X days ago" for 2-6 days ago', () => {
    const daysAgo = (n: number) => {
      const date = new Date()
      date.setDate(date.getDate() - n)
      return date
    }

    assert.equal(formatDateRelative(daysAgo(2)), '2 days ago')
    assert.equal(formatDateRelative(daysAgo(3)), '3 days ago')
    assert.equal(formatDateRelative(daysAgo(6)), '6 days ago')
  })

  test('returns "X weeks ago" for 7-29 days ago', () => {
    const daysAgo = (n: number) => {
      const date = new Date()
      date.setDate(date.getDate() - n)
      return date
    }

    assert.equal(formatDateRelative(daysAgo(7)), '1 weeks ago')
    assert.equal(formatDateRelative(daysAgo(14)), '2 weeks ago')
    assert.equal(formatDateRelative(daysAgo(21)), '3 weeks ago')
    assert.equal(formatDateRelative(daysAgo(28)), '4 weeks ago')
  })

  test('returns "X months ago" for 30-364 days ago', () => {
    const daysAgo = (n: number) => {
      const date = new Date()
      date.setDate(date.getDate() - n)
      return date
    }

    assert.equal(formatDateRelative(daysAgo(30)), '1 months ago')
    assert.equal(formatDateRelative(daysAgo(60)), '2 months ago')
    assert.equal(formatDateRelative(daysAgo(90)), '3 months ago')
    assert.equal(formatDateRelative(daysAgo(180)), '6 months ago')
    assert.equal(formatDateRelative(daysAgo(364)), '12 months ago')
  })

  test('returns "X years ago" for 365+ days ago', () => {
    const daysAgo = (n: number) => {
      const date = new Date()
      date.setDate(date.getDate() - n)
      return date
    }

    assert.equal(formatDateRelative(daysAgo(365)), '1 years ago')
    assert.equal(formatDateRelative(daysAgo(730)), '2 years ago')
    assert.equal(formatDateRelative(daysAgo(1825)), '5 years ago')
  })

  test('handles string date input', () => {
    // String from yesterday
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const isoString = yesterday.toISOString().split('T')[0]!
    const result = formatDateRelative(isoString)
    assert.equal(result, 'Yesterday')
  })
})
