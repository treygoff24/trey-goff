'use client'

import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import type { Book } from '@/lib/books/types'

type StackBottomSheetProps = {
  book: Book | null
  coverMap: Record<string, string>
  onClose: () => void
}

export function StackBottomSheet({ book, coverMap, onClose }: StackBottomSheetProps) {
  return (
    <AnimatePresence>
      {book ? (
        <>
          <motion.div
            key='backdrop'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className='fixed inset-0 z-40 bg-bg-0/70'
            onClick={onClose}
          />

          <motion.div
            key={book.id}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag='y'
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80 || info.velocity.y > 600) onClose()
            }}
            className='fixed inset-x-0 bottom-0 z-50 max-h-[80vh] rounded-t-3xl border-t border-border-1 bg-bg-1 shadow-2xl shadow-black/40'
          >
            <div className='flex max-h-[80vh] flex-col overflow-hidden'>
              <div className='flex justify-center px-4 pb-3 pt-3'>
                <div className='h-1.5 w-12 rounded-full bg-surface-2' />
              </div>

              <div className='overflow-y-auto px-6 pb-8'>
                <div className='mx-auto flex max-w-lg flex-col items-center text-center'>
                  <img
                    src={coverMap[book.id] ?? book.coverUrl}
                    alt={book.title}
                    className='mb-5 h-56 w-auto rounded-2xl object-cover shadow-2xl shadow-black/40'
                    loading='lazy'
                  />

                  <h2 className='font-newsreader text-xl text-text-1'>{book.title}</h2>
                  <p className='mt-1 font-satoshi text-base text-text-2'>{book.author}</p>
                  <p className='mt-1 font-mono text-sm text-text-3'>{book.year}</p>

                  <div className='mt-5 flex flex-wrap justify-center gap-2'>
                    {(book.topics ?? []).map((topic) => (
                      <span key={topic} className='rounded-full bg-accent/20 px-3 py-1 font-mono text-xs text-accent'>
                        {topic}
                      </span>
                    ))}
                  </div>

                  {book.genre ? (
                    <div className='mt-4 inline-flex rounded-full bg-surface-1 px-3 py-1 font-mono text-xs uppercase tracking-wider text-text-2'>
                      {book.genre}
                    </div>
                  ) : null}

                  {book.whyILoveIt ? (
                    <p className='mt-6 font-newsreader text-lg italic leading-7 text-text-2'>
                      {book.whyILoveIt}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
