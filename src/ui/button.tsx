import type { ReactNode } from 'react';
import { Pressable } from 'react-native';

import { AppText } from './text';
import { colors } from './tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  /** Optional leading element (e.g. an icon). */
  icon?: ReactNode;
  /** Stretch to fill the parent's cross axis. */
  fill?: boolean;
}

const CONTAINER: Record<Variant, string> = {
  primary: 'bg-accent',
  secondary: 'bg-tertiaryBackground',
  ghost: 'bg-transparent',
  danger: 'bg-danger',
};

const TEXT: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-label',
  ghost: 'text-accentText',
  danger: 'text-white',
};

// Design spec: "Iris Blue background with... a subtle ambient blue shadow."
// Secondary/ghost are explicitly "zero hard stroke" — no shadow — so this is
// only for the two filled/prominent variants, tinted to match each fill.
const SHADOW_COLOR: Partial<Record<Variant, string>> = {
  primary: colors.accent,
  danger: colors.danger,
};

/**
 * The one button — Serene Recovery spec: full stadium pill, 56pt (`h-14`)
 * height, filled accent for primary with an ambient tinted shadow, scaling to
 * 0.98 on press (spec'd exactly — not an opacity dim) rather than a Material
 * ripple, consistent on both platforms.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  icon,
  fill = false,
}: ButtonProps) {
  const shadowColor = SHADOW_COLOR[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      // Press feedback via the style fn (guaranteed), not an `active:` class.
      // Height is a `h-14` class below, not set here — mixing an inline
      // `minHeight` with a NativeWind className was losing to whatever the
      // className resolved to, rendering a squashed, content-height button
      // instead of the fixed 56pt one.
      style={({ pressed }) => [
        // Exact spec (primary): `0 12px 32px -4px rgba(37,99,235,0.25)`,
        // scaled down slightly for a phone-sized shadow rather than the web
        // mockup's wider canvas.
        shadowColor && !disabled
          ? {
              shadowColor,
              shadowOpacity: 0.25,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
              elevation: 6,
            }
          : null,
        pressed && !disabled ? { transform: [{ scale: 0.98 }] } : null,
        // Secondary/ghost have no shadow to carry press weight, so they also
        // get a light dim; primary/danger rely on the scale + their shadow.
        pressed && !disabled && !shadowColor ? { opacity: 0.7 } : null,
      ]}
      className={[
        'h-14 flex-row items-center justify-center gap-2 rounded-full px-6', // h-14 = 56px, the exact spec value
        CONTAINER[variant],
        fill ? 'flex-1' : '',
        disabled ? 'opacity-40' : '',
      ].join(' ')}
    >
      {icon}
      {/* `label` (14/20 SemiBold), not `headline` (20/28) — confirmed from the
          real markup, every button in it uses `label-lg`. This was the actual
          cause of "Log a relapse" reading oversized: ALL buttons, including
          the primary CTA, were rendering 6px too large, everywhere. */}
      <AppText variant="label" className={TEXT[variant]}>
        {label}
      </AppText>
    </Pressable>
  );
}
