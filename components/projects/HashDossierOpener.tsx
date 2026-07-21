'use client'

import { useEffect } from 'react'

/**
 * Makes bare fragment deep-links (/projects#fleet) behave like the canonical
 * query-param form (/projects?tool=fleet#fleet): if the hash names a dossier
 * <details> row that is still collapsed, open it and re-scroll so the linked
 * content is actually visible. In-app links carry ?tool= and are server-opened;
 * this only catches externally-sourced hash URLs, so it renders nothing.
 */
export function HashDossierOpener() {
  useEffect(() => {
    const openFromHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1))
      if (!id) return
      const el = document.getElementById(id)
      if (el instanceof HTMLDetailsElement && !el.open) {
        el.open = true
        // Re-anchor after expansion shifts layout; scroll-mt on the row keeps
        // the heading clear of the sticky header.
        el.scrollIntoView()
      }
    }

    openFromHash()
    window.addEventListener('hashchange', openFromHash)
    return () => window.removeEventListener('hashchange', openFromHash)
  }, [])

  return null
}
