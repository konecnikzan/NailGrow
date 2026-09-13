import { Text, type TextProps } from 'react-native';

import { fonts } from './tokens';

export type TextVariant =
  | 'largeTitle'
  | 'title1'
  | 'title2'
  | 'title3'
  | 'headline'
  | 'label'
  | 'body'
  | 'callout'
  | 'subheadline'
  | 'footnote'
  | 'caption1'
  | 'caption2';

// NOTE (Android dev): in React Native, a custom font's weight is baked into
// the family name itself (there's no single "Manrope" family that a separate
// `font-weight` switches between, the way there is on the web/in a TextView
// with a variable font) — `@expo-google-fonts` ships one family string per
// weight. So each variant maps straight to an exact loaded family; don't also
// set `fontWeight`, it can't do anything a static font file didn't already do.
const FONT_FAMILY: Record<TextVariant, string> = {
  largeTitle: fonts.headlineBold,
  title1: fonts.headlineSemibold,
  title2: fonts.headlineSemibold,
  title3: fonts.headlineSemibold,
  headline: fonts.headlineSemibold,
  // The actual button/interactive-label size (14/20 SemiBold Jakarta) —
  // confirmed from the real markup, which uses this for every button, not the
  // larger `headline` size buttons were built with initially.
  label: fonts.labelSemibold,
  body: fonts.bodyRegular,
  callout: fonts.bodyRegular,
  subheadline: fonts.bodyRegular,
  footnote: fonts.bodyRegular,
  caption1: fonts.labelSemibold,
  caption2: fonts.labelMedium,
};

// NativeWind's content scanner needs to see each `text-*` class literally
// somewhere to generate it; `text-${variant}` below is runtime-only and won't
// be found by the scanner on its own. This dead string is the safelist.
// text-largeTitle text-title1 text-title2 text-title3 text-headline text-label
// text-body text-callout text-subheadline text-footnote text-caption1 text-caption2

export interface AppTextProps extends TextProps {
  variant: TextVariant;
}

/**
 * The one text component. Applies the correct size/line-height (via the
 * matching `text-*` class) and the correct Manrope/Plus Jakarta Sans weight
 * (via `style`, since RN can't select a weight the way CSS can) for every
 * named type-scale step, so call sites never have to pair the two by hand.
 */
export function AppText({ variant, className, style, ...rest }: AppTextProps) {
  return (
    <Text
      className={`text-${variant}${className ? ` ${className}` : ''}`}
      style={[{ fontFamily: FONT_FAMILY[variant] }, style]}
      {...rest}
    />
  );
}
