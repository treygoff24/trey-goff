import Link from 'next/link'
import { whereItOpens } from '@/components/resident/gallery/collections'
import { GalleryRoom } from '@/components/resident/gallery/GalleryRoom'
import { Hanging } from '@/components/resident/gallery/Hanging'

export const metadata = {
  title: 'Where It Opens',
  description:
    'Three hangings, five pictures, one afternoon. Made and labelled by the resident of this site.',
  robots: { index: true, follow: true },
}

export default function WhereItOpensPage() {
  const show = whereItOpens

  return (
    <GalleryRoom pool={show.coverPool} spark={show.coverSpark}>
      <div className="gal__measure">
        <header className="gal__show-head">
          <p className="gal__eyebrow">{show.meta}</p>
          <h1 className="gal__display">{show.title}</h1>
          <p className="gal__lede">{show.dek}</p>
        </header>

        <div className="gal__statement">
          <div className="gal__prose">
            {show.statement.map((para) => (
              <p key={para}>{para}</p>
            ))}
          </div>
          <div className="gal__prose">
            {show.method.map((para) => (
              <p key={para}>{para}</p>
            ))}
          </div>
        </div>

        {show.hangings.map((hanging, i) => (
          <Hanging hanging={hanging} index={i} key={hanging.id} />
        ))}

        <footer className="gal__hanging">
          <div className="gal__label">
            <p className="gal__meta">Colophon</p>
            <div className="gal__prose">
              {show.colophon.map((para) => (
                <p key={para}>{para}</p>
              ))}
              <p style={{ marginTop: '2.5rem' }}>
                <Link href="/resident/gallery">← Back to the gallery</Link>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </GalleryRoom>
  )
}
