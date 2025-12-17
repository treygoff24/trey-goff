import { Newsreader, Inter } from 'next/font/google'

// Using Inter as a fallback for Satoshi until font files are added
// To use Satoshi: download from https://www.fontshare.com/fonts/satoshi
// Place in public/fonts/ and uncomment the localFont configuration below

/*
import localFont from 'next/font/local'

export const satoshi = localFont({
  src: [
    {
      path: '../public/fonts/Satoshi-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Satoshi-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/Satoshi-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-satoshi',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
})

export const monaspace = localFont({
  src: '../public/fonts/MonaspaceNeon-Regular.woff2',
  variable: '--font-mono',
  display: 'swap',
  fallback: ['ui-monospace', 'monospace'],
})
*/

// Temporary: Using Google Fonts until local fonts are added
export const satoshi = Inter({
  subsets: ['latin'],
  variable: '--font-satoshi',
  display: 'swap',
  weight: ['400', '500', '700'],
})

export const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  display: 'swap',
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
})

// Using system monospace until Monaspace is added
export const monaspace = {
  variable: '--font-mono',
}
