/**
 * Home — the full screen from the Stitch "NailGrow - Today (Home)" design,
 * implemented against the actual rendered HTML/screenshot (assets/mockup-
 * preview/), not a text description of it — element-for-element, with three
 * deliberate exclusions (see below). The trial countdown uses minimal real
 * backing logic rather than a fully-built feature — flagged inline.
 *
 * Excluded, not "simplified": the mockup's "82% Cuticle Health" metric, its
 * "Bed tissue restoring" line, its per-photo "Edge smooth / Cuticle calm"
 * tags, and its "Healthy regrowth" status pill. All four assert a physical
 * assessment of the user's nails, or a healing process, that nothing in this
 * app computes — CLAUDE.md rules out fabricated metrics, AI grading, and
 * medical/therapeutic claims explicitly, and that doesn't bend for a reskin.
 * Nothing stands in their place.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { db } from '@/db/client';
import { logRelapse } from '@/db/queries';
import type { Photo } from '@/db/schema';
import { useCapturedPhotos } from '@/photos/use-captured-photos';
import { useStreak } from '@/photos/use-streak';
import { useTrialStatus } from '@/purchases/use-trial-status';
import { Button } from '@/ui/button';
import { CalendarGrid, dateKey } from '@/ui/calendar-grid';
import { Card } from '@/ui/card';
import { useTabBarClearance } from '@/ui/tab-bar';
import { AppText } from '@/ui/text';
import { colors } from '@/ui/tokens';

const HAND_LABEL: Record<Photo['hand'], string> = { left: 'Left Hand', right: 'Right Hand' };
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const PHOTO_CARD_HEIGHT = 128; // matches the design's fixed h-32, not a square aspect ratio

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** "Captured this morning at 9:15 AM" — real timestamp, phrased the way the design calls for. */
function capturedAtLabel(date: Date): string {
  const hour = date.getHours();
  const partOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `Captured this ${partOfDay} at ${time}`;
}

export default function Home() {
  const { streak, dayCount, reload: reloadStreak } = useStreak();
  const { photos, flaggedIds } = useCapturedPhotos();
  const { daysRemaining } = useTrialStatus();
  const tabBarClearance = useTabBarClearance();

  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [fullscreenPhoto, setFullscreenPhoto] = useState<Photo | null>(null);

  const { photosByDay, markedDates, flaggedDates } = useMemo(() => {
    const byDay = new Map<string, Photo[]>();
    const flagged = new Set<string>();
    for (const photo of photos) {
      const key = dateKey(photo.capturedAt);
      const bucket = byDay.get(key);
      if (bucket) bucket.push(photo);
      else byDay.set(key, [photo]);
      if (flaggedIds.has(photo.id)) flagged.add(key);
    }
    return { photosByDay: byDay, markedDates: new Set(byDay.keys()), flaggedDates: flagged };
  }, [photos, flaggedIds]);

  const selectedPhotos = photosByDay.get(dateKey(selectedDate)) ?? [];
  const selectedIsFlagged = flaggedDates.has(dateKey(selectedDate));
  const isToday = dateKey(selectedDate) === dateKey(new Date());

  // Which day of the current streak `selectedDate` falls on, or null if it
  // predates the streak (e.g. browsing history from before a relapse).
  const streakDayNumber = (() => {
    const diff = Math.round(
      (startOfDay(selectedDate).getTime() - startOfDay(streak.startedAt).getTime()) / MS_PER_DAY,
    );
    return diff >= 0 ? diff + 1 : null;
  })();

  const dayHeading = isToday
    ? 'Today'
    : streakDayNumber !== null
      ? `Day ${streakDayNumber}`
      : selectedDate.toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        });

  function onChangeMonth(direction: -1 | 1) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  }

  function onLogRelapse() {
    Alert.alert(
      'Log a relapse?',
      "This starts a new streak. Nothing is deleted — your photos and history stay exactly as they are.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log relapse',
          style: 'destructive',
          onPress: () => {
            logRelapse(db, {});
            reloadStreak();
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScrollView
        // px-5 = the design's `margin` token (1.25rem/20px). gap-5 = the real
        // markup's `space-y-5` (1.25rem/20px) — confirmed from code.html, not
        // the 24px `space-lg` guessed previously. Bottom padding is computed
        // per-device (see useTabBarClearance) rather than a borrowed constant.
        contentContainerClassName="gap-5 px-5 pt-2"
        contentContainerStyle={{ paddingBottom: tabBarClearance }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Ionicons name="leaf-outline" size={22} color={colors.accent} />
            <AppText variant="title2" className="text-label">
              NailGrow
            </AppText>
          </View>
          <View className="flex-row items-center gap-2">
            {daysRemaining > 0 ? (
              <View className="rounded-full bg-tertiaryBackground px-2.5 py-1">
                {/* caption2's font file is Medium(500); the design's badge is
                    SemiBold(600) at this size, which isn't one of our loaded
                    weights — Medium is close enough not to warrant a sixth
                    font file for one badge. */}
                <AppText variant="caption2" className="text-accentText">
                  {daysRemaining} day{daysRemaining === 1 ? '' : 's'} free
                </AppText>
              </View>
            ) : null}
            <Pressable
              onPress={() => router.push('/settings')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Settings"
              className="h-9 w-9 items-center justify-center"
            >
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.secondaryLabel} />
            </Pressable>
          </View>
        </View>

        {/* Streak / milestone card. The capture CTA sits below it, not nested
            inside — matches the design's layout (a card, then a full-width
            button as its own element), not just its colours. */}
        <Card className="gap-4 p-5">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 gap-2">
              <View className="flex-row items-center gap-1.5 self-start rounded-full bg-tertiaryBackground px-2.5 py-0.5">
                <Ionicons name="checkmark-circle" size={14} color={colors.secondaryAccent} />
                <AppText variant="caption2" className="text-secondaryAccent">
                  Personal Milestone
                </AppText>
              </View>
              <View>
                <AppText variant="largeTitle" className="text-label">
                  {dayCount}
                </AppText>
                <AppText variant="footnote" className="text-secondaryLabel">
                  {dayCount === 1 ? 'day tracked' : 'days tracked'}
                </AppText>
              </View>
            </View>
            <View className="h-12 w-12 items-center justify-center rounded-full bg-tertiaryBackground">
              <Ionicons name="leaf" size={24} color={colors.accentText} />
            </View>
          </View>
        </Card>
        <Button
          label="Take today's photo"
          onPress={() => router.push('/capture')}
          icon={<Ionicons name="camera" size={22} color="#fff" />}
          fill
        />

        {/* Calendar */}
        <CalendarGrid
          month={month}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onChangeMonth={onChangeMonth}
          markedDates={markedDates}
          flaggedDates={flaggedDates}
        />

        {/* Selected day detail. The design pairs this heading with a
            "Healthy regrowth"-style status pill — excluded, see file header. */}
        <Card className="gap-3 p-4">
          <AppText variant="title2" className="text-label">
            {dayHeading}
          </AppText>

          {selectedPhotos.length === 0 ? (
            <View className="flex-row items-start gap-3 rounded-card border border-dashed border-separator bg-tertiaryBackground/60 p-4">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-tertiaryBackground">
                <Ionicons name="information-circle-outline" size={18} color={colors.accentText} />
              </View>
              <View className="flex-1 gap-1">
                <AppText variant="label" className="text-label">
                  Gentle Observation
                </AppText>
                <AppText variant="footnote" className="text-secondaryLabel">
                  No photo logged this day. That’s alright — pick up again whenever you’re ready.
                </AppText>
              </View>
            </View>
          ) : (
            <View className="gap-3">
              <AppText variant="footnote" className="text-tertiaryLabel">
                {capturedAtLabel(selectedPhotos[0]?.capturedAt ?? selectedDate)}
              </AppText>
              {selectedIsFlagged ? (
                <AppText variant="footnote" className="text-danger">
                  ⚠ One of this day’s photos couldn’t be verified.
                </AppText>
              ) : null}
              <View className="flex-row gap-3">
                {selectedPhotos.map((photo) => (
                  <Pressable
                    key={photo.id}
                    onPress={() => setFullscreenPhoto(photo)}
                    className="relative flex-1 overflow-hidden rounded-2xl border border-separator/40 bg-tertiaryBackground"
                    style={{ height: PHOTO_CARD_HEIGHT }}
                    accessibilityRole="button"
                    accessibilityLabel={`View ${HAND_LABEL[photo.hand]} photo fullscreen`}
                  >
                    <Image
                      source={{ uri: photo.thumbUri }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                    />
                    {/* Hand label as an overlaid pill, top-left of the image —
                        matches the design; unlike its bottom tag (excluded),
                        this is just a factual label, not a judgment. */}
                    <View className="absolute left-2 top-2 rounded-full bg-black/40 px-2 py-0.5">
                      <AppText variant="caption2" className="text-white">
                        {HAND_LABEL[photo.hand]}
                      </AppText>
                    </View>
                  </Pressable>
                ))}
              </View>
              <View className="flex-row items-center justify-center gap-1">
                <Ionicons name="scan-outline" size={14} color={colors.tertiaryLabel} />
                <AppText variant="caption2" className="text-tertiaryLabel">
                  Tap thumbnails to expand fullscreen
                </AppText>
              </View>
            </View>
          )}
        </Card>

        {/* Discreet relapse-logging action, then the reassurance line below it
            — that order (not reversed) matches the design. This is
            deliberately NOT the shared `Button` — the real markup renders it
            as a small inline text+icon row (11px label), not a full button. */}
        <View className="items-center gap-1 pb-4 pt-1">
          <Pressable
            onPress={onLogRelapse}
            accessibilityRole="button"
            accessibilityLabel="Log a relapse or reset streak"
            className="flex-row items-center gap-1.5 rounded-full px-3 py-2"
          >
            <Ionicons name="refresh" size={16} color={colors.tertiaryAccent} />
            <AppText variant="caption2" className="text-secondaryLabel">
              Log a relapse or reset streak
            </AppText>
          </Pressable>
          <AppText variant="caption2" className="text-center text-tertiaryLabel">
            Judgment-free tracking keeps self-compassion first.
          </AppText>
        </View>
      </ScrollView>

      <Modal
        visible={fullscreenPhoto !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreenPhoto(null)}
      >
        <Pressable className="flex-1 bg-black" onPress={() => setFullscreenPhoto(null)}>
          {fullscreenPhoto ? (
            <Image
              source={{ uri: fullscreenPhoto.fileUri }}
              style={StyleSheet.absoluteFill}
              contentFit="contain"
            />
          ) : null}
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
