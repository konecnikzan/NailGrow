/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/app/**/*.{ts,tsx}', './src/ui/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // "Serene Recovery" — the Stitch-sourced design system, see CLAUDE.md's
      // design-system section for the full rationale and exact source. These
      // are the only colours/type sizes screens should reach for; anything not
      // covered here is a decision to make explicitly, not an arbitrary number.
      // MUST stay in sync with src/ui/tokens.ts `colors`.
      colors: {
        background: '#F8F9FF',
        secondaryBackground: '#FFFFFF', // resting card surface
        tertiaryBackground: '#EFF4FF', // tinted nested/container surface
        label: '#0B1C30',
        secondaryLabel: '#434655',
        tertiaryLabel: '#737686',
        separator: '#C3C6D7',
        accent: '#2563EB', // fills: buttons, active pill, selected backgrounds
        accentText: '#004AC6', // accent text/icon on a light surface
        danger: '#BA1A1A',
        secondaryAccent: '#006A61',
        secondaryAccentFill: '#86F2E4',
        tertiaryAccent: '#784B00',
        tertiaryAccentFill: '#996100',
      },
      // Stitch's type scale (Manrope headlines / Plus Jakarta Sans body) has
      // fewer steps than the old HIG-derived one — title2/title3 collapse into
      // `headline`, and `callout`/`subheadline` collapse into one step, rather
      // than inventing sizes Stitch never specified. Pair with the matching
      // `fonts.*` family from tokens.ts (weight lives in the font file, not a
      // separate `font-weight` — see src/ui/text.tsx).
      fontSize: {
        largeTitle: ['28px', '36px'],
        title1: ['24px', '32px'],
        title2: ['20px', '28px'],
        title3: ['20px', '28px'],
        headline: ['20px', '28px'],
        body: ['16px', '24px'],
        callout: ['14px', '20px'],
        subheadline: ['14px', '20px'],
        footnote: ['12px', '16px'],
        caption1: ['12px', '16px'],
        caption2: ['11px', '14px'],
      },
      // No custom spacing scale: Tailwind's default (each step = 4px) already
      // covers Stitch's spacing tokens (margin 20px = px-5, gutter 16px = p-4,
      // space-lg 24px = gap-6, etc.).
      // No custom border-radius scale either: Tailwind's default `rounded-3xl`
      // is already exactly 24px (Stitch's one card radius), and `rounded-full`
      // is already the stadium/pill shape used everywhere else.
    },
  },
  plugins: [],
};
