'use client'

import { AnimatePresence, motion } from 'framer-motion'
import type { Book } from '@/lib/books/types'
import type { BookColorMap } from '@/lib/library/colors'

type StackDetailPanelProps = {
  books: Book[]
  hoveredBook: Book | null
  selectedBook: Book | null
  coverMap: Record<string, string>
  colors: BookColorMap
}

function getTopicCounts(books: Book[]) {
  const counts = new Map<string, number>()
  for (const book of books) {
    for (const topic of book.topics ?? []) counts.set(topic, (counts.get(topic) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
}

function getDecadeCounts(books: Book[]) {
  const counts = new Map<number, number>()
  for (const book of books) {
    const decade = Math.floor(book.year / 10) * 10
    counts.set(decade, (counts.get(decade) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => a[0] - b[0])
}

export function StackDetailPanel({ books, hoveredBook, selectedBook, coverMap, colors }: StackDetailPanelProps) {
  const activeBook = selectedBook ?? hoveredBook

  if (!activeBook) {
    const topics = getTopicCounts(books)
    const decades = getDecadeCounts(books)
    const maxDecadeCount = Math.max(...decades.map(([, count]) => count), 1)

    return (
      <div className='space-y-8 p-8'>
        <p className='max-w-md text-base leading-relaxed text-text-2'>
          A living inventory of {books.length} books on the shelf. Hover the stack to explore, or change the sort to watch them rearrange.
        </p>

        <section className='space-y-4'>
          <h2 className='font-mono text-[11px] uppercase tracking-[0.15em] text-text-3'>Top topics</h2>
          <div className='space-y-2.5'>
            {topics.map(([topic, count]) => (
              <div key={topic} className='flex items-center gap-3'>
                <div className='w-28 shrink-0 font-satoshi text-sm text-text-2'>{topic}</div>
                <div className='h-2 flex-1 overflow-hidden rounded-full bg-white/[0.04]'>
                  <motion.div
                    className='h-full rounded-full'
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    style={{
                      background: 'linear-gradient(90deg, #3ed6c8, #3ed6c8cc)',
                      width: `${(count / (topics[0]?.[1] ?? 1)) * 100}%`,
                      transformOrigin: 'left',
                    }}
                  />
                </div>
                <div className='w-8 text-right font-mono text-xs text-text-3'>{count}</div>
              </div>
            ))}
          </div>
        </section>

        <section className='space-y-4'>
          <h2 className='font-mono text-[11px] uppercase tracking-[0.15em] text-text-3'>Books by decade</h2>
          <div className='flex items-end gap-1.5'>
            {decades.map(([decade, count]) => (
              <div key={decade} className='flex flex-col items-center gap-1.5'>
                <motion.div
                  className='w-4 rounded-sm'
                  style={{
                    background: 'linear-gradient(180deg, #f5a25a, #f5a25a88)',
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: Math.max(4, (count / maxDecadeCount) * 72) }}
                  transition={{ duration: 0.5, delay: 0.02 * (decades.findIndex(d => d[0] === decade)), ease: 'easeOut' }}
                />
                <span className='font-mono text-[9px] text-text-3'>{String(decade).slice(2)}s</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    )
  }

  const cover = coverMap[activeBook.id] ?? activeBook.coverUrl
  const bookColor = colors[activeBook.id]
  const extraTopics = (activeBook.topics ?? []).slice(1)

  return (
    <div className='p-8'>
      <AnimatePresence mode='wait'>
        <motion.div
          key={activeBook.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className='space-y-6'
        >
          <div className='flex gap-6'>
            <img
              src={cover}
              alt={activeBook.title}
              loading='lazy'
              className='h-auto w-56 rounded-2xl object-cover shadow-2xl shadow-black/40'
            />
            <div className='flex-1 space-y-3 py-1'>
              <div className='font-newsreader text-3xl leading-tight text-text-1'>{activeBook.title}</div>
              <div className='font-satoshi text-lg text-text-2'>{activeBook.author}</div>
              <div className='font-mono text-sm text-text-3'>{activeBook.year}</div>
              {bookColor ? (
                <div className='mt-2 h-1 w-24 rounded-full' style={{ backgroundColor: bookColor }} />
              ) : null}
            </div>
          </div>

          {/* Primary topic pill */}
          <div className='flex flex-wrap gap-2'>
            {(activeBook.topics ?? []).length > 0 && (
              <span className='rounded-full bg-accent/20 px-3 py-1 font-mono text-xs text-accent'>
                {activeBook.topics![0]}
              </span>
            )}
          </div>

          {/* Cross-topic indicator */}
          {extraTopics.length > 0 && (
            <div className='flex items-center gap-2'>
              <span className='font-mono text-[10px] uppercase tracking-wider text-text-3'>Also in</span>
              <div className='flex flex-wrap gap-1.5'>
                {extraTopics.map((topic) => (
                  <span
                    key={topic}
                    className='rounded-full bg-surface-1 px-2.5 py-0.5 font-mono text-[10px] text-text-2'
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {activeBook.genre ? (
            <div className='inline-flex rounded-full bg-surface-1 px-3 py-1 font-mono text-xs uppercase tracking-wider text-text-2'>
              {activeBook.genre}
            </div>
          ) : null}

          {activeBook.whyILoveIt ? (
            <p className='max-w-2xl text-sm leading-6 text-text-2'>{activeBook.whyILoveIt}</p>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
