import { Pressable, View } from 'react-native';

import { AppText } from './text';
import { MIN_TAP_TARGET } from './tokens';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
}

/**
 * Stadium-pill segmented control: a tinted track with the selected segment
 * raised on a white pill. Consistent on both platforms (no Material tab
 * indicator). Used for the capture-screen hand switch and overlay-strength
 * toggle; Compare will reuse it for its hand filter.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      className="flex-row rounded-full bg-tertiaryBackground p-1"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={{ minHeight: MIN_TAP_TARGET - 8 }}
            className={`flex-1 items-center justify-center rounded-full px-3 ${
              selected ? 'bg-secondaryBackground shadow-sm' : ''
            }`}
          >
            <AppText
              variant="subheadline"
              className={selected ? 'text-label' : 'text-secondaryLabel'}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
