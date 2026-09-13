import type { ViewProps } from 'react-native';
import { View } from 'react-native';

// Exact values from the real rendered markup, not the design doc's prose
// (which says 24px radius; the actual screen overrides its own Tailwind
// config to 32px and uses this precise shadow) — see CLAUDE.md "Cards &
// elevation" for the two-tier system this is tier one of.
const CARD_STYLE = {
  borderRadius: 32,
  borderWidth: 1,
  borderColor: 'rgba(195, 198, 215, 0.3)', // outline-variant/30
  backgroundColor: '#FFFFFF',
  shadowColor: '#64748B',
  shadowOpacity: 0.05,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};

/**
 * The one "resting card" surface. Padding is deliberately NOT baked in here —
 * the real design uses different padding per card (20px for the streak hero,
 * 16px for the calendar and day-detail cards), so callers pass their own
 * `p-*` class. The tab bar is the one deliberate exception to this whole
 * component — it's glassmorphic, not a resting card.
 */
export function Card({ className = '', style, ...rest }: ViewProps) {
  return <View className={`overflow-hidden ${className}`} style={[CARD_STYLE, style]} {...rest} />;
}
