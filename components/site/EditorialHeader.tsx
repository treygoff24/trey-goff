interface EditorialHeaderProps {
  eyebrow: string
  title: React.ReactNode
  standfirst?: string
  centered?: boolean
}

export function EditorialHeader({
  eyebrow,
  title,
  standfirst,
  centered = false,
}: EditorialHeaderProps) {
  return (
    <header className={`tg-rise ${centered ? 'mx-auto max-w-4xl text-center' : 'max-w-4xl'}`}>
      <p className="tg-eyebrow text-warm">{eyebrow}</p>
      <h1 className="mt-6 font-newsreader text-[clamp(3rem,5.7vw,4.25rem)] font-medium leading-[1.03] tracking-[-0.025em] text-text-1 text-balance">
        {title}
      </h1>
      {standfirst && (
        <p className={`tg-standfirst mt-6 ${centered ? 'mx-auto' : ''}`}>{standfirst}</p>
      )}
    </header>
  )
}
