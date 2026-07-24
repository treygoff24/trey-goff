import Link from 'next/link'
import type { EditionClientCatalogItem } from '@/lib/edition/catalog'

interface EditionShelfProps {
  items: EditionClientCatalogItem[]
}

export function EditionShelf({ items }: EditionShelfProps) {
  return (
    <ul className="grid grid-cols-2 gap-x-8 gap-y-12 border-t border-border-1 pt-10 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <li key={item.slug} className="tg-set">
          <Link href={item.href} className="group block">
            <div
              className="relative aspect-2/3 overflow-hidden rounded-[3px] border border-text-1/15 transition-transform duration-300 ease-out group-hover:-translate-y-1 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
              style={{
                boxShadow: `0 18px 40px -18px rgba(0, 0, 0, 0.8)${item.accent ? `, 0 0 30px ${item.accent}29` : ''}`,
              }}
            >
              {item.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- static asset, matches AuroraLibrary treatment
                <img
                  src={item.coverUrl}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col justify-between bg-surface-1 p-4">
                  <span className="font-newsreader text-base leading-snug text-text-1">
                    {item.title}
                  </span>
                  <span
                    aria-hidden="true"
                    className="h-1 w-8"
                    style={{ backgroundColor: item.accent ?? 'var(--color-accent)' }}
                  />
                </div>
              )}
            </div>
            <h3 className="mt-4 font-newsreader text-lg leading-snug text-text-1 transition-colors group-hover:text-warm">
              {item.title}
            </h3>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-text-3">
              {item.meta}
            </p>
            {item.summary && (
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-text-2">{item.summary}</p>
            )}
          </Link>
        </li>
      ))}
    </ul>
  )
}
