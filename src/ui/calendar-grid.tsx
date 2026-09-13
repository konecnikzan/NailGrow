import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Card } from './card';
import { AppText } from './text';
import { colors } from './tokens';

// Monday-first, matching the real design ("M T W T F S S") — not the Sunday
// start `Date.getDay()` gives you.
const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const CELL_SIZE = 32;

/** Local-calendar-day key (not UTC) — a capture at 11pm shouldn't jump to the next day. */
export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

export interface CalendarGridProps {
  /** Any date within the month to display. */
  month: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onChangeMonth: (direction: -1 | 1) => void;
  /** Date keys (see `dateKey`) that have at least one captured photo. */
  markedDates: Set<string>;
  /** Date keys where the integrity check flagged a photo — takes priority over `markedDates`. */
  flaggedDates: Set<string>;
}

/**
 * Month calendar, habit-tracker style: every day is a cell, days with a photo
 * are marked, days the integrity check flagged are marked distinctly, and
 * selecting a day is how the rest of the screen knows what to show below.
 */
export function CalendarGrid({
  month,
  selectedDate,
  onSelectDate,
  onChangeMonth,
  markedDates,
  flaggedDates,
}: CalendarGridProps) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  // getDay() is 0=Sunday; shift so 0=Monday to match the Monday-first grid.
  const firstWeekday = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const monthLabel = month.toLocaleDateString(undefined, { month: 'long' });
  // Snapshot "now" once per mount via useState's lazy initializer, not a plain
  // `new Date()` call during render (React Compiler requires render to stay
  // pure — a `useMemo` factory doesn't get the same exemption).
  const [now] = useState(() => new Date());
  const todayKey = dateKey(now);
  const selectedKey = dateKey(selectedDate);

  const cells: (Date | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, monthIndex, i + 1)),
  ];

  return (
    <Card className="gap-3 p-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-baseline gap-2">
          <AppText variant="headline" className="text-label">
            {monthLabel}
          </AppText>
          <AppText variant="caption1" className="text-tertiaryLabel">
            {year}
          </AppText>
        </View>
        <View className="flex-row items-center gap-1">
          <Pressable
            onPress={() => onChangeMonth(-1)}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            className="h-7 w-7 items-center justify-center rounded-full"
          >
            <Ionicons name="chevron-back" size={18} color={colors.secondaryLabel} />
          </Pressable>
          <Pressable
            onPress={() => onChangeMonth(1)}
            accessibilityRole="button"
            accessibilityLabel="Next month"
            className="h-7 w-7 items-center justify-center rounded-full"
          >
            <Ionicons name="chevron-forward" size={18} color={colors.secondaryLabel} />
          </Pressable>
        </View>
      </View>

      <View className="flex-row">
        {WEEKDAY_LABELS.map((label, i) => (
          <View key={i} style={{ width: `${100 / 7}%` }} className="items-center">
            <AppText variant="caption2" className="text-tertiaryLabel">
              {label}
            </AppText>
          </View>
        ))}
      </View>

      <View className="flex-row flex-wrap">
        {cells.map((date, i) => {
          if (!date) {
            return (
              <View
                key={`blank-${i}`}
                style={{ width: `${100 / 7}%`, height: CELL_SIZE + 8 }}
              />
            );
          }
          const key = dateKey(date);
          const isSelected = key === selectedKey;
          const isToday = key === todayKey;
          const isFlagged = flaggedDates.has(key);
          const hasPhoto = markedDates.has(key);
          const isFuture = date.getTime() > now.getTime();

          return (
            <View
              key={key}
              style={{ width: `${100 / 7}%`, height: CELL_SIZE + 8 }}
              className="items-center justify-center"
            >
              <Pressable
                onPress={() => onSelectDate(date)}
                disabled={isFuture}
                accessibilityRole="button"
                accessibilityLabel={date.toDateString()}
                accessibilityState={{ selected: isSelected, disabled: isFuture }}
                style={{ width: CELL_SIZE, height: CELL_SIZE }}
                className={`items-center justify-center rounded-full ${
                  isSelected
                    ? 'bg-accent'
                    : isFlagged
                      ? 'border border-dashed border-tertiaryAccent bg-tertiaryAccentFill/20'
                      : isToday
                        ? 'border border-accent'
                        : ''
                }`}
              >
                <AppText
                  variant="caption1"
                  className={
                    isSelected
                      ? 'text-white'
                      : isFlagged
                        ? 'text-tertiaryAccent'
                        : isFuture
                          ? 'text-tertiaryLabel'
                          : 'text-label'
                  }
                >
                  {date.getDate()}
                </AppText>
                {/* Selected already shows its detail below — skip the redundant
                    (and, on the accent-filled circle, invisible) dot. */}
                {!isSelected && hasPhoto ? (
                  <View
                    className="absolute bottom-0.5 h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: isFlagged ? colors.tertiaryAccent : colors.accent }}
                  />
                ) : null}
              </Pressable>
            </View>
          );
        })}
      </View>

      <View className="flex-row items-center justify-between border-t border-separator/30 pt-2.5">
        <View className="flex-row items-center gap-1.5">
          <View className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.accent }} />
          <AppText variant="caption2" className="text-secondaryLabel">
            Photos logged
          </AppText>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View
            className="h-2.5 w-2.5 rounded-full border border-dashed"
            style={{
              borderColor: colors.tertiaryAccent,
              backgroundColor: colors.tertiaryAccentFill + '4D', // ~30% alpha
            }}
          />
          <AppText variant="caption2" className="text-secondaryLabel">
            Gentle check-in
          </AppText>
        </View>
      </View>
    </Card>
  );
}
