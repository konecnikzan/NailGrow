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
      //
      // `label` (14/20 SemiBold Jakarta = the source's `label-lg`) is the
      // button/interactive-label size — confirmed from the actual rendered
      // HTML, which uses it for every button, not the 20px `headline` size we
      // originally guessed.
      fontSize: {
        largeTitle: ['28px', '36px'],
        title1: ['24px', '32px'],
        title2: ['20px', '28px'],
        title3: ['20px', '28px'],
        headline: ['20px', '28px'],
        label: ['14px', '20px'],
        body: ['16px', '24px'],
        callout: ['14px', '20px'],
        subheadline: ['14px', '20px'],
        footnote: ['12px', '16px'],
        caption1: ['12px', '16px'],
        caption2: ['11px', '14px'],
      },
      // The actual rendered HTML overrides the source's own "1.5rem/24px card
      // radius" prose to 2rem/32px (`borderRadius.lg` in its Tailwind config,
      // applied to every card) — going with what the screen actually renders,
      // not the prose that disagrees with it.
      borderRadius: {
        card: '32px',
      },
      // No custom spacing scale: Tailwind's default (each step = 4px) already
      // covers what's actually used — 20px outer margin (px-5), 20px vertical
      // rhythm between sections (gap-5, confirmed from the real markup's
      // `space-y-5` — not `space-lg`/24px as guessed previously), 16px card
      // padding (p-4) for most cards.
    },
  },
  plugins: [],
};
