import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Card } from './card';
import { AppText } from './text';
import { colors } from './tokens';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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
  const firstWeekday = new Date(year, monthIndex, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const monthLabel = month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
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
    <Card className="gap-3">
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={() => onChangeMonth(-1)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          className="h-11 w-11 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={20} color={colors.label} />
        </Pressable>
        <AppText variant="headline" className="text-label">
          {monthLabel}
        </AppText>
        <Pressable
          onPress={() => onChangeMonth(1)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Next month"
          className="h-11 w-11 items-center justify-center"
        >
          <Ionicons name="chevron-forward" size={20} color={colors.label} />
        </Pressable>
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
            return <View key={`blank-${i}`} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />;
          }
          const key = dateKey(date);
          const isSelected = key === selectedKey;
          const isToday = key === todayKey;
          const isFlagged = flaggedDates.has(key);
          const hasPhoto = markedDates.has(key);
          const isFuture = date.getTime() > now.getTime();

          return (
            <View key={key} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} className="p-0.5">
              <Pressable
                onPress={() => onSelectDate(date)}
                disabled={isFuture}
                accessibilityRole="button"
                accessibilityLabel={date.toDateString()}
                accessibilityState={{ selected: isSelected, disabled: isFuture }}
                className={`flex-1 items-center justify-center rounded-full ${
                  isSelected ? 'bg-accent' : isToday ? 'border border-accent' : ''
                }`}
              >
                <AppText
                  variant="subheadline"
                  className={
                    isSelected ? 'text-white' : isFuture ? 'text-tertiaryLabel' : 'text-label'
                  }
                >
                  {date.getDate()}
                </AppText>
                {/* Selected already shows its detail below — skip the redundant
                    (and, on the accent-filled circle, invisible) dot. */}
                {!isSelected && (hasPhoto || isFlagged) ? (
                  <View
                    className="absolute bottom-1 h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: isFlagged ? colors.danger : colors.accent }}
                  />
                ) : null}
              </Pressable>
            </View>
          );
        })}
      </View>

      <View className="flex-row items-center justify-center gap-4 pt-1">
        <View className="flex-row items-center gap-1.5">
          <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors.accent }} />
          <AppText variant="caption2" className="text-tertiaryLabel">
            Photo logged
          </AppText>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors.danger }} />
          <AppText variant="caption2" className="text-tertiaryLabel">
            Needs attention
          </AppText>
        </View>
      </View>
    </Card>
  );
}
