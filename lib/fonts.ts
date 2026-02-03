import { Newsreader, Geologica, IBM_Plex_Mono } from 'next/font/google'

// Distinctive type pairing to replace the temporary Inter/JetBrains setup
// If you want local fonts later, swap these out for next/font/local.

export const satoshi = Geologica({
  subsets: ['latin'],
  variable: '--font-satoshi-font',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
})

export const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader-font',
  display: 'swap',
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
})

export const monaspace = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono-font',
  display: 'swap',
  weight: ['400', '500', '600'],
})
