// Subpath import, not `from '@expo/vector-icons'`: the barrel re-exports all 18
// icon families, and Metro bundles every one's font file as a static asset if you
// import through it. This pulls in only Ionicons.
import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { colors, fonts } from './tokens';

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
  index: { active: 'home', inactive: 'home-outline' }, // Home: streak, capture, calendar
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
 * The one glassmorphic surface in the app (see CLAUDE.md's "Cards &
 * elevation"): a real native blur on iOS, a translucent-view fallback on
 * Android — an explicit ~85% white wash on top of the blur keeps the colour
 * identical on both regardless of what's actually happening underneath.
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
      <View style={styles.shadowWrapper}>
        <View style={styles.clip}>
          <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, styles.glassWash]} />

          <Animated.View layout={LinearTransition} style={styles.row}>
            {state.routes.map((route, index) => {
              const descriptor = descriptors[route.key];
              if (!descriptor) return null; // shouldn't happen; every route has one

              const { options } = descriptor;
              const label = typeof options.title === 'string' ? options.title : route.name;
              const isFocused = state.index === index;
              const icon = ICONS[route.name] ?? {
                active: 'ellipse',
                inactive: 'ellipse-outline',
              };

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
                    color={isFocused ? colors.onAccent : colors.tertiaryLabel}
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
      </View>
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
  // Shadow lives on this outer view: `overflow: hidden` (needed on `clip`, to
  // keep the blur inside the rounded shape) would also clip the shadow.
  shadowWrapper: {
    borderRadius: PILL_HEIGHT / 2,
    backgroundColor: 'transparent',
    shadowColor: colors.accent,
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  clip: {
    borderRadius: PILL_HEIGHT / 2,
    overflow: 'hidden', // clips the BlurView to the capsule
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  glassWash: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: PILL_HEIGHT,
    paddingHorizontal: 6,
    gap: 4,
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
    backgroundColor: colors.accent,
  },
  // Matches the `caption1` step (12/16, Plus Jakarta Sans SemiBold) — not
  // going through AppText here since Reanimated's `layout` transition prop
  // needs to land on the actual Animated.Text host, not a wrapped component.
  label: {
    fontFamily: fonts.labelSemibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.onAccent,
  },
});
