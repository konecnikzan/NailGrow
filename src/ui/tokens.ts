/**
 * Design tokens for the JS/TS side — icon `color` props, Reanimated worklets,
 * inline styles, anywhere a NativeWind class won't reach.
 *
 * Values are the "Serene Recovery" system pulled from the Stitch NailGrow
 * design project via the Stitch MCP server (see CLAUDE.md's design-system
 * section for the full rationale and the deliberate-switch note).
 *
 * MUST stay in sync with `tailwind.config.js` `theme.extend.colors`. Screens
 * should prefer the NativeWind classes (`text-label`, `bg-accent`, …); reach for
 * these constants only where a class can't go.
 */
export const colors = {
  background: '#F8F9FF', // page canvas
  secondaryBackground: '#FFFFFF', // resting card surface ("Container Level 1")
  tertiaryBackground: '#EFF4FF', // tinted nested/container surface
  label: '#0B1C30',
  secondaryLabel: '#434655',
  tertiaryLabel: '#737686',
  separator: '#C3C6D7',
  /** Fills: buttons, the active tab pill, selected segment backgrounds. */
  accent: '#2563EB',
  /** Accent-coloured text/icon on a light surface — better contrast than `accent` at text size. */
  accentText: '#004AC6',
  danger: '#BA1A1A',
  /** Secondary/tertiary accents from the Stitch palette. Not used yet, kept for a future distinct context (e.g. a "calm" vs "alert" cue). */
  secondaryAccent: '#006A61',
  secondaryAccentFill: '#86F2E4',
  tertiaryAccent: '#784B00',
  tertiaryAccentFill: '#996100',
  /** Full-bleed camera / photo backdrops. */
  cameraBackdrop: '#000000',
  onAccent: '#FFFFFF',
} as const;

/**
 * Exact loaded font family names from `@expo-google-fonts/*` — each weight is
 * its own family string in React Native, unlike CSS where one `font-family`
 * spans weights via `font-weight`. Load these in the root layout with
 * `useFonts` before rendering anything that uses them.
 */
export const fonts = {
  headlineBold: 'Manrope_700Bold', // largeTitle
  headlineSemibold: 'Manrope_600SemiBold', // title1, title2, title3, headline
  bodyRegular: 'PlusJakartaSans_400Regular', // body, callout, subheadline, footnote
  labelSemibold: 'PlusJakartaSans_600SemiBold', // caption1
  labelMedium: 'PlusJakartaSans_500Medium', // caption2
} as const;

/** 8pt grid. Use these, not arbitrary numbers. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

export const radius = {
  sm: 8,
  /** The one card radius in the Serene Recovery system. */
  card: 24,
  pill: 999,
} as const;

/** Minimum interactive target per accessibility guidelines — a floor, not the default size. */
export const MIN_TAP_TARGET = 44;
/** Primary button height per the Serene Recovery button spec (`h-14`). */
export const BUTTON_HEIGHT = 56;
export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;
