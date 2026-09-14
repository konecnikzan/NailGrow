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
// The real markup's partial-check-in dot is literally Tailwind's emerald-500
// — not one of CLAUDE.md's documented palette colours (the muted teal there
// is a different, darker hue) — used as-is to match the mockup exactly.
const PARTIAL_DOT_COLOR = '#10B981';
// A soft halo around today's filled circle when it's the day being viewed.
// RN has no separate ring layer, so this is a border on the same box as the
// fill — but the background paints the FULL border-box (not just the padding
// box), so a semi-transparent border just blends with whatever fill colour
// sits under it, e.g. reading green-tinted on a partial-check-in day instead
// of neutral gray. Must be fully opaque to actually mask the fill underneath.
const TODAY_RING_WIDTH = 4;
const TODAY_RING_COLOR = '#EAEBEF';

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
  /** Date keys where only one hand was photographed that day — takes priority over `markedDates`. */
  partialDates: Set<string>;
}

/**
 * Month calendar, habit-tracker style: every day is a cell, days with a photo
 * are marked, days with only one hand logged are marked distinctly, and
 * selecting a day is how the rest of the screen knows what to show below.
 */
export function CalendarGrid({
  month,
  selectedDate,
  onSelectDate,
  onChangeMonth,
  markedDates,
  partialDates,
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
          const isPartial = partialDates.has(key);
          const hasPhoto = markedDates.has(key);
          const isFuture = date.getTime() > now.getTime();

          // Solid fill is reserved for today and whichever day is currently
          // selected/viewed below — same as the mockup's "18". A partial
          // check-in on some OTHER day doesn't get promoted to a filled
          // circle just for being partial; it's still a plain number with a
          // green dot, same treatment a fully-logged day gets with a blue
          // one. Partial only changes the FILL COLOUR on a day that's
          // already filled for one of those other reasons.
          const isFilled = isSelected || isToday;
          const fillColor = isPartial ? PARTIAL_DOT_COLOR : colors.accent;
          // The halo only marks the exact combined state the mockup shows it
          // for: today, and currently the day being viewed.
          const showTodayRing = isToday && isSelected;
          const outerSize = CELL_SIZE + (showTodayRing ? TODAY_RING_WIDTH * 2 : 0);

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
                style={[
                  { width: outerSize, height: outerSize },
                  isFilled ? { backgroundColor: fillColor } : null,
                  // Sizing both dimensions up by the ring width and adding an
                  // opaque border draws a ring flush outside the circle
                  // without shrinking the visible filled area (the border
                  // sits in the outer band the size increase created) — no
                  // separate overlay view needed. The border must be opaque
                  // (see TODAY_RING_COLOR) or the fill shows through it.
                  showTodayRing
                    ? { borderWidth: TODAY_RING_WIDTH, borderColor: TODAY_RING_COLOR }
                    : null,
                ]}
                // Every cell centers just the number, full stop — nothing
                // about a dot's presence ever changes how the number itself
                // is centered, which is what keeps every date on the exact
                // same inline baseline. The today+selected cell shows no dot
                // at all: clicking on today is confirmation enough on its
                // own, on top of the ring.
                className="items-center justify-center rounded-full"
              >
                <AppText
                  variant="caption1"
                  className={
                    isFilled ? 'text-white' : isFuture ? 'text-tertiaryLabel' : 'text-label'
                  }
                >
                  {date.getDate()}
                </AppText>
              </Pressable>
              {/* Sibling of the Pressable, not a child — an absolutely
                  positioned dot here never affects the number's centering
                  above, unlike putting it inside the circle's own flex flow.
                  Only for plain (unfilled) days: a filled circle (today or
                  selected) already communicates its own status by colour,
                  and a dot sitting outside a solid fill on the plain card
                  background would either be redundant or, for a white dot,
                  invisible. Green for a partial check-in, same blue as the
                  "Photos logged" legend otherwise. */}
              {!isFilled && hasPhoto ? (
                <View
                  className="absolute bottom-0 h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: isPartial ? PARTIAL_DOT_COLOR : colors.accent }}
                />
              ) : null}
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
          <View className="h-2 w-2 rounded-full" style={{ backgroundColor: PARTIAL_DOT_COLOR }} />
          <AppText variant="caption2" className="text-secondaryLabel">
            Partial check-in
          </AppText>
        </View>
      </View>
    </Card>
  );
}
