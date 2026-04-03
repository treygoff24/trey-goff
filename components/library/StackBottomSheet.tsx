'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import Image from 'next/image'
import type { Book } from '@/lib/books/types'
import { formatLibraryYear } from '@/lib/library/topics'

type StackBottomSheetProps = {
  book: Book | null
  coverMap: Record<string, string>
  onClose: () => void
}

export function StackBottomSheet({ book, coverMap, onClose }: StackBottomSheetProps) {
  const open = book !== null
  const coverSrc = book ? (coverMap[book.id] ?? book.coverUrl) : undefined

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 touch-none bg-bg-0/70 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[80vh] flex-col overflow-hidden rounded-t-3xl border-t border-border-1 bg-bg-1 pb-[env(safe-area-inset-bottom,0px)] shadow-2xl shadow-black/40 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom overscroll-contain duration-300">
          {book ? (
            <>
              <DialogPrimitive.Title className="sr-only">{book.title}</DialogPrimitive.Title>
              <DialogPrimitive.Description className="sr-only">
                {book.author}, {formatLibraryYear(book.year)}
                {book.genre ? `. ${book.genre}` : ''}
              </DialogPrimitive.Description>

              <div className="flex max-h-[80vh] flex-col overflow-hidden">
                <DialogPrimitive.Close className="flex w-full justify-center px-4 pb-3 pt-3 text-text-2 outline-none hover:text-text-1 focus-visible:ring-2 focus-visible:ring-warm focus-visible:ring-offset-2 focus-visible:ring-offset-bg-1">
                  <span className="sr-only">Close book details</span>
                  <span aria-hidden className="h-1.5 w-12 rounded-full bg-surface-2" />
                </DialogPrimitive.Close>

                <div className="overflow-y-auto overscroll-contain px-6 pb-8">
                  <div className="mx-auto flex max-w-lg flex-col items-center text-center">
                    {coverSrc ? (
                      <Image
                        src={coverSrc}
                        alt={`Cover: ${book.title}`}
                        width={224}
                        height={336}
                        className="mb-5 h-56 w-auto rounded-2xl object-cover shadow-2xl shadow-black/40"
                        sizes="224px"
                        unoptimized
                      />
                    ) : (
                      <div
                        className="mb-5 h-56 w-40 shrink-0 rounded-2xl bg-surface-2"
                        aria-hidden
                      />
                    )}

                    <h2 className="font-newsreader text-xl text-text-1">{book.title}</h2>
                    <p className="mt-1 font-satoshi text-base text-text-2">{book.author}</p>
                    <p className="mt-1 font-mono text-sm text-text-3">
                      {formatLibraryYear(book.year)}
                    </p>

                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                      {(book.topics ?? []).map((topic) => (
                        <span
                          key={topic}
                          className="rounded-full bg-accent/20 px-3 py-1 font-mono text-xs text-accent"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>

                    {book.genre ? (
                      <div className="mt-4 inline-flex rounded-full bg-surface-1 px-3 py-1 font-mono text-xs uppercase tracking-wider text-text-2">
                        {book.genre}
                      </div>
                    ) : null}

                    {book.whyILoveIt ? (
                      <p className="mt-6 font-newsreader text-lg italic leading-7 text-text-2">
                        {book.whyILoveIt}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
