import { Geist_Mono, Hanken_Grotesk, Spectral } from 'next/font/google'

export const satoshi = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export const newsreader = Spectral({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
})

export const monaspace = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-label',
  display: 'swap',
  weight: ['400', '500', '600'],
})
