# NailGrow

Photo-based recovery tracker for people who bite their nails. Take a photo a day,
see your nails grow back. iOS and Android from one Expo codebase.

Store name: **NailGrow: Regrow Bitten Nails**
Bundle / package: `app.nailgrow`

## Why this app exists

The incumbent is NailKeeper (100k+ Android installs, 4.2★, 1.8k reviews) — built
by a developer who ships seven unrelated apps and has been fixing the same camera
bugs since 2022. The mechanism works; the execution doesn't. Read their reviews
before proposing anything: the complaints are our spec.

Their four fatal problems, in order of how loudly users complain:

1. **The free tier tracks one hand.** Their most-upvoted negative review is about
   this. Another: "All the useful features are locked behind a paywall. Just make
   the entire app cost money if you're going to do that."
2. **Photos render blank white** in the gallery and time-lapse. Reported since
   February 2023, still being patched in 2026.
3. **Notifications don't fire** unless the app is opened. A user bought the paid
   tier hoping it would fix this. It didn't.
4. **"It's literally just a timer."** Nothing to do once photo tracking gets
   boring. Users report forgetting the app entirely after a month.

We win by executing the boring parts correctly, not by adding features.

## Product principles

**Never shame the user.** Nail biting is a body-focused repetitive behaviour
driven by stress and anxiety. Shame makes it worse — one NailKeeper reviewer
wrote that the app made them pick their fingers more. So: relapse resets the
counter silently and keeps the history. No red warnings, no "you broke your
streak", no disappointed copy, no guilt-based notification text. Neutral,
factual, warm.

**Never hold the user's photos hostage.** Viewing, fullscreening, comparing and
exporting your own photos is free forever, on every tier. Both hands are free.
This is a hard rule — if a paywall proposal touches the user's own data, reject
it and say why.

**Everything stays on the device.** No accounts, no backend, no analytics, no
cloud photo storage. The only network call is RevenueCat's purchase check. This
is a promise we make in the store listing, and it's our sharpest differentiator:
NailKeeper's Play data safety section declares it may collect location and share
personal info with third parties, for an app that photographs your hands.

**One premium design system on both platforms — not OS-idiomatic
switching.** This app competes on trust and polish against an incumbent with
a dated, template-y interface, and a consistent brand look is part of that:
the app should feel and look the same on iOS and Android, not switch visual
language per platform. The specific visual system is **"Serene Recovery"**
— sourced from our Stitch design project, pulled via the Stitch MCP server,
not approximated — and replaces the earlier Apple/SF-Pro-flavoured system
below. Concretely:

- **Colour.** Background `#F8F9FF`. Card surface `#FFFFFF` (the "resting
  card" tier) or `#EFF4FF`/`#E5EEFF` (tinted container tiers, for nested or
  secondary surfaces). Primary text `#0B1C30`, secondary text `#434655`,
  tertiary/icon-muted text `#737686`, hairline borders `#C3C6D7`. Accent
  (button fills, the active tab pill, selected states) is `#2563EB`; a
  darker `#004AC6` is used for accent-coloured text/icons on a light surface,
  where flat `#2563EB` text would be lower contrast. Error/destructive is
  `#BA1A1A`. A muted teal (`#006A61` text / `#86F2E4` fill) and a muted brown
  (`#784B00` text / `#996100` fill) exist as secondary/tertiary accents for
  future use (e.g. a distinct "calm" vs "alert" context) — not used yet.
- **Typography.** Manrope for headlines, Plus Jakarta Sans for body and
  labels — both loaded via `@expo-google-fonts`, not system fonts. Scale
  (size/line-height/weight): largeTitle 28/36 Bold, title1 24/32 SemiBold,
  headline (and title2/title3 — Stitch's scale has one step here, not three)
  20/28 SemiBold, body 16/24 Regular, callout/subheadline (also one Stitch
  step covering both) 14/20 Regular, footnote 12/16 Regular, caption1 12/16
  SemiBold, caption2 11/14 Medium. Where our old scale had more steps than
  Stitch's, steps were merged rather than inventing intermediate numbers.
- **Cards & elevation.** Two tiers, not one. Ordinary surfaces (streak card,
  overlay-strength card, list rows) are opaque `#FFFFFF` (or a tinted
  container colour) with a hairline border and a soft ambient shadow — no
  blur, no dependency. The floating tab bar is the one place that's actually
  glassmorphic: a translucent white fill (~85% opacity) behind a real native
  blur (`expo-blur`'s `BlurView`), which is honest, real blur on iOS and a
  translucent-view fallback on Android (that package's own documented
  behaviour) — same visual intent, not identical rendering, and we say so
  rather than pretend otherwise.
- **Radii.** Cards: 24px. Buttons, chips, the tab bar, and any other pill
  control: fully rounded (stadium/`rounded-full`). Nothing uses a small
  fixed corner radius (4–8px) as its primary shape language.
- **Tab bar:** a custom-built, floating component — not `NativeTabs`. A
  compact capsule centered above the bottom edge (not edge-to-edge, not
  docked flush): each tab is icon-only until selected, at which point it
  expands to an accent-filled pill showing its label, animated via Reanimated's
  `LinearTransition` (no manual width/interpolation code), with a light haptic
  tap on press. A true native Android tab bar renders Material 3 (pill
  indicator, ripple), which cannot be restyled into this look without ceasing
  to be the real OS component, so this app deliberately trades true-native
  chrome for one consistent premium tab bar. This also avoids `NativeTabs`'
  alpha/breaking-changes risk entirely — plain, stable APIs throughout. (We
  tried `NativeTabs` first; it works fine in Expo Go, but a real Android
  Material 3 bar next to real iOS Liquid Glass is two visual languages, which
  is exactly what this principle rules out.)
- Because the bar floats instead of docking, screens must add their own
  bottom padding/inset so content can scroll fully clear of it — the bar is
  an overlay, not a layout sibling that reserves space.
- Icons are Ionicons throughout (via `@expo/vector-icons`, imported per-icon
  to avoid bundling all 18 font families) — one glyph set rendered
  identically on both platforms, not SF Symbols on iOS.
- **Platform-native behaviour still matters underneath the custom visuals** —
  correct system keyboard, native alerts and action sheets, native gesture
  handling (iOS swipe-back, Android hardware back), accessibility semantics.
  "Custom visual design" means the pixels; it doesn't mean reinventing things
  the OS already handles correctly.

**This was a deliberate switch made mid-build, not drift.** The previous
system (accent `#0A84FF`, SF Pro–equivalent type scale, no blur anywhere,
explicitly reasoned around Apple's Human Interface Guidelines) was fully
built and verified on-device — tab bar and Capture screen both shipped and
tested under it — before this change. If you're reading this later and
wondering why the values don't match an earlier commit: this is the current
decision: adopt the Stitch-sourced "Serene Recovery" system everywhere,
correctly and completely, not layer it on top of the old one.

**No AI that judges the user.** NailKeeper shipped AI photo insights in 2026 and
users rejected them ("some AI features, that I don't agree with"); the developer
retreated and made them optional. AI in this app assists capture — hand alignment,
per-nail cropping, lighting normalisation — and never grades progress, estimates
growth as a hard number, or infers whether someone relapsed. All of it runs
on-device.

**No medical or therapeutic claims.** We are a tracker, not treatment. Educational
content describes habit reversal training in plain language and cites where it
comes from. Never "cures", never "clinically proven".

## Stack

- Expo (latest SDK), Expo Router, TypeScript strict
- NativeWind for styling
- `expo-camera` for capture during early development — works inside Expo Go on
  both platforms with no developer account on either side. Migrate to
  `react-native-vision-camera` when building alignment assist (step 8 in
  SETUP.md), since frame-processor access needs it and a custom dev client is
  required at that point regardless. Don't add Vision Camera before then.
- `expo-file-system` for photo storage
- `expo-sqlite` + Drizzle ORM
- `expo-notifications` for local scheduling
- `react-native-purchases` (RevenueCat) for IAP
- `react-native-reanimated` for the time-lapse playback
- MediaPipe hand landmarker on-device for alignment assist — verify the current
  React Native binding is maintained before committing; TFLite via a Vision Camera
  frame processor is the fallback
- EAS Build and Submit

No state management library until we actually need one. React state and SQLite
queries cover this app.

## Structure

Routes live in `src/app/` (the Expo SDK 54+ template default — `expo-router`
resolves it automatically). Everything else lives beside it under `src/`.

```
src/
  app/                  # expo-router routes
    (tabs)/
      index.tsx         # home — streak, capture CTA, calendar of every day
      compare.tsx       # before/after slider
      settings.tsx
    capture.tsx         # full-screen camera with alignment assist
    onboarding/
  db/                   # drizzle schema, migrations, queries
  photos/               # capture, storage, verification, export
  notifications/        # scheduling, throttle detection
  purchases/            # RevenueCat wrapper, entitlement checks
  vision/               # hand landmarks, alignment, per-nail crop
  ui/                   # shared components
  content/              # habit reversal / nail care text, i18n-ready
```

There is no separate Timeline tab — the calendar on Home is the one place that
shows every day's photos; tapping a date shows that day's capture(s) below the
grid.

## Data model

```
photos       id, capturedAt, fileUri, thumbUri, hand, width, height,
             normalisedOrientation, referencePhotoId, isReference
nails        id, photoId, fingerId, cropUri        # per-nail crops
streaks      id, startedAt, endedAt
relapses     id, occurredAt, note                  # history is never deleted
triggers     id, occurredAt, activity, mood
settings     key, value
```

`referencePhotoId` and `isReference` are two different things on the same row.
`referencePhotoId` records what THIS photo was aligned against at capture time
(the ghost overlay it was shot with) — set once, at capture, never changed.
`isReference` marks whether THIS photo is the one currently pinned as its
hand's reference — set only by an explicit user action (pin/unpin), true for
at most one photo per hand at a time.

Relapses end a streak and start a new one. They never delete photos or truncate
the timeline — a user with seven relapses and visible growth is a success story,
and their history should show that.

## The photo pipeline — read this before touching anything camera-related

This is the product. Everything else is a timer and a list. The incumbent has
failed at it for four years and that failure is our entire opportunity.

- Write photos to the **document directory**, never the cache directory. Cache is
  purged by the OS, which is the most likely cause of NailKeeper's blank-white
  photos.
- Normalise EXIF orientation **at write time**. Never store a raw camera URI and
  hope the renderer rotates it correctly.
- After every write: verify the file exists, verify it reads back, verify
  dimensions are non-zero. Only then insert the database row. A row pointing at a
  missing or unreadable file is the bug we exist to avoid.
- Generate and store a thumbnail at capture time. The timeline must never decode
  full-resolution images while scrolling.
- Retake must be available immediately after capture and from any photo in the
  timeline.
- Fullscreen viewing, share, and save-to-camera-roll are free, always.
- On startup, run a cheap integrity pass: any row whose file is missing gets
  flagged in the UI rather than silently rendering blank.

## Capture flow

1. Camera opens with a ghost overlay of the user's reference photo (their first,
   or one they pin) so hand position matches across the series.
2. Hand landmarks in the live preview drive an alignment indicator — a guide that
   confirms when position and distance match the reference. Auto-capture on a
   good match, with a manual shutter always available.
3. After capture: per-nail crops are generated from the detected fingertips, and
   lighting is normalised against the reference so the time-lapse doesn't strobe.
4. Confirm or retake.

Alignment assist must be skippable. It should never block someone from taking a
photo.

## Notifications

A paying NailKeeper user complained that notifications only appeared when she
opened the app. Treat reliability as a feature, not plumbing.

- Local scheduled notifications only. No push, no server.
- Include a camera action on the notification so a photo can be taken from the
  shade — this was directly requested in a review.
- Detect when we've likely been throttled (no delivery in N days while a schedule
  is active) and surface a one-time, non-nagging explanation of how to whitelist
  the app, with vendor-specific guidance for Xiaomi, Samsung, Huawei and Oppo.
- Notification copy is neutral. "Time for today's photo" — never "Don't break
  your streak!"

## Monetisation

- 14 days of the complete app, free, no card, nothing withheld.
- Then a one-time purchase via RevenueCat. Target €7.99–9.99.
- Never a subscription. Never a per-hand or per-feature paywall.
- After the trial, the user keeps read access to everything they've captured
  forever, including fullscreen and export. The purchase unlocks *new* capture
  and the ongoing features, not their existing history.
- If a proposed paywall would block someone from seeing their own progress, it's
  wrong. Say so.

## Conventions

- One component per file, named after the file.
- Components are presentational; data access lives in hooks under the relevant
  `src/` folder.
- No hardcoded user-facing strings — everything through the i18n layer from day
  one. This ships in EN first, then DE, ES, FR, PT.
- Every function in `src/photos` and `src/vision` gets a comment explaining *why*,
  because that's where the non-obvious decisions live.
- Errors in the photo pipeline are never swallowed. Surface them.

## Out of scope

Don't build these, and don't propose them:

- Accounts, login, cloud sync, any backend
- AI progress grading, precise growth measurement stated as fact, bite detection
  from photos, or an AI coach chat
- A virtual pet, shop, or currency. Restrained achievements only — the requesting
  reviewers skew young and the Play rating is 3+, so keep gamification
  age-neutral.
- Encoded video export. The time-lapse is a fast image sequence in Reanimated.
  ffmpeg-kit is retired and the RN alternatives aren't worth the weight.
- Social features, sharing feeds, leaderboards.
- Anything that transmits a photo off the device.

## Phone-to-phone transfer

A reviewer complained there's no way to move to a new phone — severe for an app
whose value is a six-month timeline. Solve it without accounts: export the
database and photos as a single encrypted archive to the user's own storage or
Drive, import on the other side. Data still never touches us.

## How to work with me

- I'm an experienced Android developer, comfortable with React and Next.js, newer
  to React Native specifics. Skip explanations of React fundamentals; do explain
  RN or Expo behaviour that differs from what a native Android dev would expect.
- Give me exact code, not descriptions of code or pattern-level advice.
- When there's a real trade-off — camera library, alignment approach, storage
  strategy, paywall boundary — stop and lay out the options with consequences.
  Don't pick silently.
- Don't refactor beyond what I asked for.
- Before adding any dependency, state its licence and whether it's actively
  maintained. This is closed-source commercial software.
- If something I ask for would break a product principle above, say so before
  writing it.
