import { Fraunces, DM_Sans } from 'next/font/google'

export const displayFont = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: 'variable',
  axes: ['SOFT', 'WONK'],
})

export const bodyFont = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['300', '400', '500', '600'],
})
