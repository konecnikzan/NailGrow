import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Hand } from '@/db/schema';
import { usePhotoCapture, type RawShot } from '@/photos/use-photo-capture';
import { useReferencePhoto } from '@/photos/use-reference-photo';
import { Button } from '@/ui/button';
import { SegmentedControl } from '@/ui/segmented-control';
import { AppText } from '@/ui/text';
import { colors } from '@/ui/tokens';

const HAND_OPTIONS = [
  { value: 'left' as const, label: 'Left hand' },
  { value: 'right' as const, label: 'Right hand' },
];

// Opacity presets for the ghost overlay — a "toggle" per CLAUDE.md, styled
// consistently on both platforms rather than a native slider.
type OverlayLevel = 'hide' | 'faint' | 'clear';
const OVERLAY_OPTIONS = [
  { value: 'hide' as const, label: 'Hide' },
  { value: 'faint' as const, label: 'Faint' },
  { value: 'clear' as const, label: 'Clear' },
];
const OVERLAY_OPACITY: Record<OverlayLevel, number> = { hide: 0, faint: 0.3, clear: 0.55 };

export default function Capture() {
  const camera = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [hand, setHand] = useState<Hand>('left');
  const [overlayLevel, setOverlayLevel] = useState<OverlayLevel>('faint');
  const [shot, setShot] = useState<RawShot | null>(null);
  const [pinAsReference, setPinAsReference] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const { permissionGranted, requestPermission, takeShot, commit, busy } = usePhotoCapture();
  const { referencePhoto } = useReferencePhoto(hand);

  async function onShutter() {
    if (!ready || busy) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const raw = await takeShot(camera.current);
    if (!raw) {
      setErrorText('The camera returned no image. Try again.');
      return;
    }
    setErrorText(null);
    setShot(raw);
  }

  function onRetake() {
    setShot(null);
    setReady(false); // camera remounts; wait for it before re-enabling the shutter
    setErrorText(null);
  }

  async function onUse() {
    if (!shot) return;
    const result = await commit(shot, {
      hand,
      referencePhotoId: referencePhoto?.id ?? null,
      pinAsReference: pinAsReference && !referencePhoto,
    });
    if (!result.ok) {
      setErrorText(result.message);
      return;
    }
    router.back();
  }

  // ---------- permission gate ----------
  if (!permissionGranted) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-4 bg-background p-6">
        <Ionicons name="camera-outline" size={40} color={colors.secondaryLabel} />
        <AppText variant="body" className="text-center text-secondaryLabel">
          NailGrow needs camera access to take your daily photo. Photos never leave your device.
        </AppText>
        <Button label="Allow camera access" onPress={requestPermission} />
        <Button label="Not now" variant="ghost" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  // ---------- confirm / retake ----------
  if (shot) {
    return (
      <View className="flex-1 bg-black">
        <Image source={{ uri: shot.uri }} style={StyleSheet.absoluteFill} contentFit="contain" />
        <SafeAreaView edges={['bottom']} className="mt-auto gap-3 bg-black/80 px-4 pb-2 pt-4">
          {errorText ? (
            <AppText variant="footnote" className="text-danger">
              {errorText}
            </AppText>
          ) : null}

          {!referencePhoto ? (
            <Pressable
              onPress={() => setPinAsReference((value) => !value)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: pinAsReference }}
              className="flex-row items-center gap-3 py-2"
            >
              <Ionicons
                name={pinAsReference ? 'checkbox' : 'square-outline'}
                size={24}
                color={pinAsReference ? colors.accent : colors.tertiaryLabel}
              />
              <AppText variant="callout" className="flex-1 text-white">
                Use as the alignment reference for your {hand} hand
              </AppText>
            </Pressable>
          ) : null}

          <View className="flex-row gap-3">
            <Button label="Retake" variant="secondary" fill onPress={onRetake} disabled={busy} />
            <Button label={busy ? 'Saving…' : 'Use photo'} fill onPress={onUse} disabled={busy} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ---------- camera ----------
  const shutterDisabled = !ready || busy;

  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={camera}
        style={StyleSheet.absoluteFill}
        facing="back"
        onCameraReady={() => setReady(true)}
      />

      {/* Ghost overlay. Non-interactive (no onPress); the controls render after
          this and sit on top. */}
      {referencePhoto ? (
        <Image
          source={{ uri: referencePhoto.fileUri }}
          style={[StyleSheet.absoluteFill, { opacity: OVERLAY_OPACITY[overlayLevel] }]}
          contentFit="cover"
        />
      ) : null}

      <SafeAreaView className="flex-1" pointerEvents="box-none">
        <View className="gap-3 p-4" pointerEvents="box-none">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close"
            className="h-9 w-9 items-center justify-center self-start rounded-full bg-black/40"
          >
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>
          <SegmentedControl
            options={HAND_OPTIONS}
            value={hand}
            onChange={setHand}
            accessibilityLabel="Which hand"
          />
        </View>

        <View className="flex-1" pointerEvents="none" />

        <View className="gap-4 p-4" pointerEvents="box-none">
          {referencePhoto ? (
            <View className="gap-2 rounded-3xl bg-black/40 p-3">
              <AppText variant="caption1" className="text-white/70">
                Reference overlay
              </AppText>
              <SegmentedControl
                options={OVERLAY_OPTIONS}
                value={overlayLevel}
                onChange={setOverlayLevel}
                accessibilityLabel="Reference overlay strength"
              />
            </View>
          ) : null}

          {errorText ? (
            <AppText variant="footnote" className="text-center text-danger">
              {errorText}
            </AppText>
          ) : null}

          <View className="items-center">
            <Pressable
              onPress={onShutter}
              disabled={shutterDisabled}
              accessibilityRole="button"
              accessibilityLabel="Take photo"
              style={({ pressed }) => [
                { width: 74, height: 74, opacity: shutterDisabled ? 0.5 : 1 },
                pressed && !shutterDisabled ? { transform: [{ scale: 0.92 }] } : null,
              ]}
              className="items-center justify-center rounded-full border-[5px] border-white/80"
            >
              <View className="h-[52px] w-[52px] rounded-full bg-white" />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
