import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AppText } from './text';

const PRESS_SCALE = 0.96;
const PRESS_OPACITY = 0.88;
const PRESS_ANIM_MS = 150;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PhotoThumbnailProps {
  uri: string;
  /** Overlaid pill label (e.g. "Left Hand") — a factual label, not a judgment. */
  label: string;
  height: number;
  onPress: () => void;
  /** Long-press is how a photo is deleted; this only fires the callback — the
   * confirmation dialog itself is the caller's job. */
  onLongPress: () => void;
}

/**
 * A day-detail photo tile. The whole tile — border, image, and label pill
 * together — shrinks and dims slightly for as long as it's pressed
 * (Reanimated, not a plain conditional style, so the change is a smooth
 * animation rather than an instant jump) — visual feedback that a long-press
 * is registering and building toward the delete confirmation.
 *
 * The animation is a `transform`/`opacity` on the Pressable itself, not on an
 * inner wrapper: RN transforms are paint-only and never affect layout, so
 * this can't disturb the other tile sharing this row (unlike animating a
 * fixed height/width, which would).
 */
export function PhotoThumbnail({ uri, label, height, onPress, onLongPress }: PhotoThumbnailProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // `sharedValue.value = ...` is Reanimated's documented, correct way to
  // update a shared value — but the React Compiler's lint rule doesn't know
  // that (its Reanimated allowance exists but doesn't cover this case in the
  // installed version), so it reads as an illegal mutation of a hook's
  // return value. Not a real bug: disabling narrowly, not tripping over it.
  function onPressIn() {
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withTiming(PRESS_SCALE, { duration: PRESS_ANIM_MS });
    // eslint-disable-next-line react-hooks/immutability
    opacity.value = withTiming(PRESS_OPACITY, { duration: PRESS_ANIM_MS });
  }

  function onPressOut() {
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withTiming(1, { duration: PRESS_ANIM_MS });
    // eslint-disable-next-line react-hooks/immutability
    opacity.value = withTiming(1, { duration: PRESS_ANIM_MS });
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      className="relative flex-1 overflow-hidden rounded-2xl border border-separator/40 bg-tertiaryBackground"
      style={[{ height }, animatedStyle]}
      accessibilityRole="button"
      accessibilityLabel={`View ${label} photo fullscreen`}
    >
      <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View className="absolute left-2 top-2 rounded-full bg-black/40 px-2 py-0.5">
        <AppText variant="caption2" className="text-white">
          {label}
        </AppText>
      </View>
    </AnimatedPressable>
  );
}
