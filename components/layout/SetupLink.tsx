'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Props = React.ComponentProps<typeof Link>

export function SetupLink({ href, ...props }: Props) {
  const [preferredHref, setPreferredHref] = useState(href)

  useEffect(() => {
    if (href !== '/stack') return
    try {
      if (localStorage.getItem('stack-mode') === 'easy') setPreferredHref('/jobsite')
    } catch {}
  }, [href])

  return <Link href={preferredHref} {...props} />
}
