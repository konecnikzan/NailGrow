/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/app/**/*.{ts,tsx}', './src/ui/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // One Apple-inspired design system on both platforms — see CLAUDE.md. These
      // are the only colours/type sizes screens should reach for; anything not
      // covered here is a decision to make explicitly, not an arbitrary number.
      colors: {
        background: '#FFFFFF',
        secondaryBackground: '#F2F2F7', // iOS systemGroupedBackground
        label: '#000000',
        secondaryLabel: '#6B6B70',
        tertiaryLabel: '#8E8E93',
        separator: '#E5E5EA',
        accent: '#0A84FF', // iOS systemBlue
        danger: '#FF3B30', // iOS systemRed — used sparingly; see "never shame" principle
      },
      // Apple HIG text styles (Large Dynamic Type sizes). Pair with an explicit
      // font-weight utility at the call site (400/600/700 map to
      // font-normal/font-semibold/font-bold): e.g. `text-title1 font-bold`.
      fontSize: {
        largeTitle: ['34px', '41px'],
        title1: ['28px', '34px'],
        title2: ['22px', '28px'],
        title3: ['20px', '25px'],
        headline: ['17px', '22px'],
        body: ['17px', '22px'],
        callout: ['16px', '21px'],
        subheadline: ['15px', '20px'],
        footnote: ['13px', '18px'],
        caption1: ['12px', '16px'],
        caption2: ['11px', '13px'],
      },
      // No custom spacing scale: Tailwind's default (each step = 4px) already
      // lands on the 8pt grid at every even step — use p-2/p-4/p-6/p-8/p-10 etc.,
      // not the odd-numbered steps, and it's an 8pt grid by convention.
    },
  },
  plugins: [],
};
