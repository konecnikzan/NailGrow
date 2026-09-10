import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

/**
 * The exact prop shape `<Tabs tabBar={...}>` expects, derived from the `Tabs`
 * component itself rather than imported from `@react-navigation/bottom-tabs`
 * directly. expo-router vendors that package internally and doesn't re-export
 * its types from a public path, so importing the type name would mean reaching
 * into `expo-router`'s build internals — fragile across SDK bumps. Deriving it
 * from `Tabs['tabBar']` tracks whatever the real type is automatically.
 */
type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

type IconName = ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  index: { active: 'today', inactive: 'today-outline' },
  timeline: { active: 'time', inactive: 'time-outline' },
  compare: { active: 'git-compare', inactive: 'git-compare-outline' },
  settings: { active: 'settings', inactive: 'settings-outline' },
};

const PILL_HEIGHT = 56;
const FLOATING_MARGIN = 16;

// Reanimated needs the animated wrapper created once, outside render, not
// recreated on every tab-bar render.
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Custom tab bar — deliberately NOT `NativeTabs` (see CLAUDE.md). A compact
 * capsule, centered above the bottom edge rather than docked or edge-to-edge:
 * each item is icon-only until selected, at which point it expands to show
 * its label and fills with the accent colour. `LinearTransition` (Reanimated)
 * animates that width change and the label's appearance automatically — no
 * manual width measuring or interpolation needed.
 *
 * It's an overlay (absolutely positioned), so it reserves no layout space;
 * screens need their own bottom padding to scroll clear of it.
 */
export function TabBar({ state, descriptors, navigation, insets }: TabBarProps) {
  return (
    <View
      pointerEvents="box-none"
      style={[styles.slot, { bottom: insets.bottom + FLOATING_MARGIN }]}
    >
      <Animated.View layout={LinearTransition} style={styles.pill}>
        {state.routes.map((route, index) => {
          const descriptor = descriptors[route.key];
          if (!descriptor) return null; // shouldn't happen; every route has one

          const { options } = descriptor;
          const label = typeof options.title === 'string' ? options.title : route.name;
          const isFocused = state.index === index;
          const icon = ICONS[route.name] ?? { active: 'ellipse', inactive: 'ellipse-outline' };

          function onPress() {
            if (Platform.OS === 'ios' || Platform.OS === 'android') {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          }

          return (
            <AnimatedPressable
              key={route.key}
              layout={LinearTransition}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={label}
              style={[styles.item, isFocused && styles.itemActive]}
            >
              <Ionicons
                name={isFocused ? icon.active : icon.inactive}
                size={20}
                color={isFocused ? '#FFFFFF' : '#8E8E93'}
              />
              {isFocused && (
                <Animated.Text layout={LinearTransition} style={styles.label}>
                  {label}
                </Animated.Text>
              )}
            </AnimatedPressable>
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center', // centers the content-sized pill; the slot itself spans full width
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: PILL_HEIGHT,
    borderRadius: PILL_HEIGHT / 2,
    paddingHorizontal: 6,
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
    // iOS
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    // Android
    elevation: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 14,
    borderRadius: PILL_HEIGHT / 2 - 4,
    gap: 6,
  },
  itemActive: {
    backgroundColor: '#0A84FF',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
