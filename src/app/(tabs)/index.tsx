/**
 * Home — the full screen from the Stitch "NailGrow - Today (Home)" design,
 * implemented element-for-element with two deliberate exclusions (see below).
 * Some pieces (the trial countdown) use minimal real backing logic rather
 * than a fully-built feature — flagged inline — per instruction to implement
 * the full surface now and deepen individual pieces later.
 *
 * Excluded, not "simplified": the mockup's "82% Cuticle Health" metric and its
 * per-photo "Edge smooth / Cuticle calm" tags. Both assert a physical
 * assessment of the user's nails that nothing in this app computes — CLAUDE.md
 * rules out fabricated metrics and AI grading of progress explicitly, and
 * that rule doesn't bend for a reskin. Nothing stands in their place.
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
import { AppText } from '@/ui/text';
import { colors } from '@/ui/tokens';

const HAND_LABEL: Record<Photo['hand'], string> = { left: 'Left hand', right: 'Right hand' };
const MS_PER_DAY = 24 * 60 * 60 * 1000;

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
        contentContainerClassName="gap-5 px-4 pb-10 pt-2"
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
              <View className="rounded-full bg-secondaryAccentFill px-3 py-1.5">
                <AppText variant="caption1" className="text-secondaryAccent">
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

        {/* Streak / milestone card */}
        <Card className="gap-4">
          <View className="flex-row items-center gap-1.5 self-start rounded-full bg-tertiaryBackground px-3 py-1">
            <Ionicons name="ribbon-outline" size={14} color={colors.accentText} />
            <AppText variant="caption2" className="text-accentText">
              Personal milestone
            </AppText>
          </View>
          <View>
            <AppText variant="largeTitle" className="text-label">
              {dayCount}
            </AppText>
            <AppText variant="body" className="text-secondaryLabel">
              {dayCount === 1 ? 'day tracked' : 'days tracked'}
            </AppText>
          </View>
          <Button
            label="Take today's photo"
            onPress={() => router.push('/capture')}
            icon={<Ionicons name="camera" size={18} color="#fff" />}
          />
        </Card>

        {/* Calendar */}
        <CalendarGrid
          month={month}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onChangeMonth={onChangeMonth}
          markedDates={markedDates}
          flaggedDates={flaggedDates}
        />

        {/* Selected day detail */}
        <Card className="gap-3">
          <AppText variant="caption1" className="text-tertiaryLabel">
            Gentle check-in
          </AppText>
          <AppText variant="title2" className="text-label">
            {dayHeading}
          </AppText>

          {selectedPhotos.length === 0 ? (
            <View className="items-center gap-2 py-4">
              <Ionicons name="images-outline" size={28} color={colors.tertiaryLabel} />
              <AppText variant="subheadline" className="text-center text-secondaryLabel">
                No photo logged this day. That’s alright — pick up again whenever you’re ready.
              </AppText>
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
                    className="flex-1 gap-2"
                    accessibilityRole="button"
                    accessibilityLabel={`View ${HAND_LABEL[photo.hand]} photo fullscreen`}
                  >
                    <Image
                      source={{ uri: photo.thumbUri }}
                      style={{ width: '100%', aspectRatio: 1, borderRadius: 16 }}
                      contentFit="cover"
                    />
                    <AppText variant="caption1" className="text-center text-secondaryLabel">
                      {HAND_LABEL[photo.hand]}
                    </AppText>
                  </Pressable>
                ))}
              </View>
              <AppText variant="caption2" className="text-center text-tertiaryLabel">
                Tap a photo to view it fullscreen
              </AppText>
            </View>
          )}
        </Card>

        {/* Reassurance + relapse logging */}
        <View className="items-center gap-3 px-2">
          <AppText variant="footnote" className="text-center text-tertiaryLabel">
            Tracking here is judgment-free. A relapse doesn’t erase your progress — it just starts
            a new streak.
          </AppText>
          <Button
            label="Log a relapse"
            variant="ghost"
            onPress={onLogRelapse}
            icon={<Ionicons name="refresh" size={16} color={colors.accentText} />}
          />
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
