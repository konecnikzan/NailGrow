import type { ViewProps } from 'react-native';
import { View } from 'react-native';

/**
 * The one "resting card" surface (see CLAUDE.md "Cards & elevation"): opaque
 * white, hairline border, soft shadow, 24px radius. Every plain card should
 * use this rather than repeating the recipe by hand. The tab bar is the one
 * deliberate exception — it's glassmorphic, not a resting card.
 */
export function Card({ className = '', ...rest }: ViewProps) {
  return (
    <View
      className={`rounded-3xl border border-separator bg-secondaryBackground p-5 shadow-sm ${className}`}
      {...rest}
    />
  );
}
