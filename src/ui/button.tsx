import type { ReactNode } from 'react';
import { Pressable } from 'react-native';

import { AppText } from './text';
import { BUTTON_HEIGHT } from './tokens';

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

/**
 * The one button — Serene Recovery spec: full stadium pill, 56pt (`h-14`)
 * height, filled accent for primary. Subtle press dim rather than a Material
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
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      // Press feedback via the style fn (guaranteed), not an `active:` class.
      style={({ pressed }) => [
        { minHeight: BUTTON_HEIGHT },
        pressed && !disabled ? { opacity: 0.7 } : null,
      ]}
      className={[
        'flex-row items-center justify-center gap-2 rounded-full px-6',
        CONTAINER[variant],
        fill ? 'flex-1' : '',
        disabled ? 'opacity-40' : '',
      ].join(' ')}
    >
      {icon}
      <AppText variant="headline" className={TEXT[variant]}>
        {label}
      </AppText>
    </Pressable>
  );
}
