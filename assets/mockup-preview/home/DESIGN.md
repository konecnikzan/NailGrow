---
name: Serene Recovery
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434655'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#784b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#996100'
  on-tertiary-container: '#ffeedd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Manrope
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.03em
  headline-xl-mobile:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-tablet: 1.5rem
  gutter-desktop: 2rem
  margin: 1.25rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.25rem
---

## Brand & Style

This design system embodies mindful recovery, calm progress, and empathetic wellness. Tailored for individuals navigating nail-biting cessation and personal nail care journeys, the interface rejects shame, harsh streaks, and clinical pressure. It substitutes anxious urgency with gentle reinforcement, tactile grounding, and visual quietude.

The visual style blends **Modern Organic Minimalism** with **Soft Frosted Tactility**. Layouts prioritize generous breathing room, clean typographic cadence, and soft, natural tactile layers. Surfaces evoke physical wellness journals and restorative dermatology clinics: warm off-whites, tinted cloud greys, delicate hairline boundaries, and luminous blue focal points that guide users without overwhelming their senses.

## Colors

The palette establishes a non-clinical, therapeutic environment built on gentle contrast and restful tones.

- **Primary (`#2563EB` - Serene Iris Blue):** Reserved strictly for constructive forward momentum—primary recovery check-ins, active state tabs, and progress achievements. Delivers clarity without alerting stress triggers.
- **Secondary (`#0D9488` - Healing Sage Teal):** Represents biological renewal, cuticle hydration routines, and calm reflection entries.
- **Tertiary (`#F59E0B` - Gentle Amber Warmth):** Used sparingly for mindful urges, urge-resistance tracking, and self-compassion triggers. Avoids punitive bright reds.
- **Neutral (`#64748B` - Warm Slate Neutral):** Serves as balanced secondary text and subtle boundary structure. Grounded by a foundational canvas of warm tinted zinc (`#F8FAFC` to `#FAF9F6`), keeping the interface soft under varying screen brightness levels.

## Typography

Typography establishes an intimate, supportive conversation between user and device:

- **Display & Headlines (Manrope):** Geometric yet gentle with rounded terminal details. Manrope brings structure without rigid corporate tension, lending authority to milestones and recovery milestones.
- **Body & Controls (Plus Jakarta Sans):** Highly legible, friendly, and open. Extended counters enhance readability in journaling prompts, daily habit guidance, and mindful breathing exercises.
- **Stylistic Balance:** Avoid pure black (`#000000`). Use deep warm slate (`#0F172A` and `#334155`) to prevent optical fatigue during late-night anxiety check-ins.

## Layout & Spacing

The layout is built around a mobile-first fluid grid optimized for focused single-task interactions:

- **Mobile Rhythm (4-Column Layout):** Set with `1.25rem` outer margins and `1rem` column gutters. Cards span full width or sit in balanced dual columns for metric tiles (e.g., Days Bite-Free alongside Moisture Balance).
- **Tablet & Large Formats (8-to-12 Column Layout):** Outer canvas margins expand to `2rem`–`3rem` while content columns constrain to a centralized reading width of `640px`–`780px` to retain intimacy.
- **Vertical Spacing & Safe Areas:** Vertical flow honors bottom sheet clearance. The floating pill tab bar requires an explicit `5.5rem` bottom spacer token on all scrollable screens, ensuring no cards or floating action buttons collide with navigation.

## Elevation & Depth

This system avoids heavy drop shadows, opting for subtle ambient diffusion and layered frosted glass:

- **Base Layer (Canvas):** A warm, soft surface (`#FAF9F6` or `#F8FAFC`).
- **Container Level 1 (Resting Cards):** Pure white (`#FFFFFF`) with a delicate translucent outline (`rgba(148, 163, 184, 0.15)`) and a whisper shadow (`box-shadow: 0 4px 20px -2px rgba(100, 116, 139, 0.05)`).
- **Container Level 2 (Interactive Floating / Active State):** Elevated with an ambient lift (`box-shadow: 0 12px 32px -4px rgba(37, 99, 235, 0.08), 0 4px 12px -2px rgba(100, 116, 139, 0.06)`).
- **Glassmorphic Overlays & Floating Navigation:** Uses `backdrop-filter: blur(16px)` with an `85%` translucent background fill (`rgba(255, 255, 255, 0.85)`) paired with a micro-highlight hairline border (`rgba(255, 255, 255, 0.6)` top, `rgba(226, 232, 240, 0.4)` bottom).

## Shapes

The design uses pill-like curvature (`roundedness: 3`) to cultivate comfort, softness, and an approachable feel:

- **Pill Primitives:** Buttons, category chips, status tags, floating navigation bars, and progress indicators feature full stadium pill rounding (`9999px` or `2rem+`).
- **Surface Cards:** Content modules, progress photo comparisons, and reflection blocks adopt smooth `1.5rem` (`24px`) radii, removing harsh corners and evoking calm, natural forms.
- **Thumb Interactions:** Interactive touch surfaces leverage rounded inner bounds to complement thumb sweeps on modern handheld screens.

## Components

### Buttons & Interactive Triggers
- **Primary Action Button:** Full stadium pill (`rounded-full`), `h-14`, Iris Blue background (`#2563EB`) with high-contrast pure white text, accompanied by an inner top glow and subtle ambient blue shadow. Tap states scale smoothly to `0.98`.
- **Secondary / Gentle Support Button:** Soft stone background (`#F1F5F9`), warm slate label (`#334155`), zero hard stroke, transitioning to `#E2E8F0` on press.
- **Urge SOS Button:** A tactile, grounded element featuring warm amber tints and micro-haptic feedback prompts for immediate sensory grounding.

### Floating Pill Tab Bar
- Suspended `1.25rem` above the bottom screen safe area.
- Encased in a frosted pill container (`backdrop-blur-md`, `bg-white/85`, border: `1px solid rgba(226, 232, 240, 0.8)`).
- Active item uses an Iris Blue solid pill capsule with white iconography; inactive items utilize warm slate icons with soft ease-in opacity transitions.

### Habit Chips & Daily Check-in Pills
- Compact stadium pills (`h-9` to `h-10`) with `px-4`.
- Unselected: Soft zinc backdrop (`#F8FAFC`), hairline border (`#E2E8F0`), neutral body typography.
- Selected: Gentle teal tint or iris tint background (`#EFF6FF`), solid accent border, accompanied by an animated soft check indicator.

### Growth Progress & Comparison Cards
- Clean pure-white cards with `1.5rem` corner rounding.
- Side-by-side photo comparison slider framed in smooth curved masks with subtle calendar tags.
- Micro-progress rings using rounded line caps and soft track backdrops (`#E2E8F0`).

### Checkboxes & Segmented Sliders
- Radio and checkboxes employ rounded geometries (`rounded-full` for radios, `rounded-md` with `8px` radius for checklists).
- Mindful Urge Intensity Sliders: Continuous rounded track with an oversized soft-touch pill thumb, providing tactile satisfaction without clinical anxiety.