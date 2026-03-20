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
        <div className='space-y-3'>
          <div className='font-mono text-[10px] uppercase tracking-[0.22em] text-text-3'>Stack detail</div>
          <p className='max-w-md text-base leading-relaxed text-text-2'>
            Hover a spine for a quick preview, or click one to pin it here while you keep roaming the shelf.
          </p>
        </div>

        <section className='space-y-4'>
          <h2 className='font-mono text-[11px] uppercase tracking-[0.18em] text-text-3'>Top topics</h2>
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
                      background: 'linear-gradient(90deg, #3ed6c8, rgba(62,214,200,0.6))',
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
          <h2 className='font-mono text-[11px] uppercase tracking-[0.18em] text-text-3'>Books by decade</h2>
          <div className='rounded-[20px] border border-white/[0.04] bg-white/[0.015] px-4 py-5'>
            <div className='flex items-end gap-1.5'>
              {decades.map(([decade, count], index) => (
                <div key={decade} className='flex flex-col items-center gap-1.5'>
                  <motion.div
                    className='w-4 rounded-sm'
                    style={{ background: 'linear-gradient(180deg, #f5a25a, rgba(245,162,90,0.5))' }}
                    initial={{ height: 0 }}
                    animate={{ height: Math.max(4, (count / maxDecadeCount) * 72) }}
                    transition={{ duration: 0.5, delay: 0.02 * index, ease: 'easeOut' }}
                  />
                  <span className='font-mono text-[9px] text-text-3'>{String(decade).slice(2)}s</span>
                </div>
              ))}
            </div>
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
          initial={{ opacity: 0, y: 10, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.985 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className='space-y-6'
        >
          <div className='flex items-center justify-between gap-3'>
            <span className='font-mono text-[10px] uppercase tracking-[0.22em] text-text-3'>
              {selectedBook ? 'Pinned selection' : 'Hover preview'}
            </span>
            {bookColor ? (
              <span className='inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-text-3'>
                <span className='h-2 w-2 rounded-full' style={{ backgroundColor: bookColor }} />
                Shelf color
              </span>
            ) : null}
          </div>

          <div className='overflow-hidden rounded-[24px] border border-white/[0.05] bg-white/[0.015] p-4 shadow-[0_22px_70px_-44px_rgba(0,0,0,0.9)]'>
            <div className='flex gap-5'>
              <div className='relative shrink-0 overflow-hidden rounded-[20px] border border-white/[0.06] bg-black/20'>
                <img
                  src={cover}
                  alt={activeBook.title}
                  loading='lazy'
                  className='h-auto w-40 object-cover shadow-2xl shadow-black/40'
                />
              </div>

              <div className='min-w-0 flex-1 space-y-3 py-1'>
                <div>
                  <div className='font-newsreader text-3xl leading-tight text-text-1'>
                    {activeBook.title}
                  </div>
                  <div className='mt-2 font-satoshi text-lg text-text-2'>{activeBook.author}</div>
                </div>

                <div className='flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-text-3'>
                  <span>{activeBook.year}</span>
                  {activeBook.genre ? <span>{activeBook.genre}</span> : null}
                </div>

                {(activeBook.topics ?? []).length > 0 ? (
                  <div className='flex flex-wrap gap-2 pt-1'>
                    <span className='rounded-full bg-[#3ed6c8]/16 px-3 py-1 font-mono text-[11px] text-[#3ed6c8]'>
                      {activeBook.topics![0]}
                    </span>
                    {extraTopics.map((topic) => (
                      <span
                        key={topic}
                        className='rounded-full bg-white/[0.04] px-3 py-1 font-mono text-[11px] text-text-2'
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {extraTopics.length > 0 ? (
            <div className='space-y-2'>
              <div className='font-mono text-[10px] uppercase tracking-[0.22em] text-text-3'>Also in</div>
              <div className='flex flex-wrap gap-2'>
                {extraTopics.map((topic) => (
                  <span
                    key={topic}
                    className='rounded-full bg-white/[0.04] px-3 py-1 font-mono text-[11px] text-text-2'
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {activeBook.whyILoveIt ? (
            <div className='rounded-[20px] border border-white/[0.04] bg-white/[0.015] p-5'>
              <p className='text-sm leading-6 text-text-2'>{activeBook.whyILoveIt}</p>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
