import '@/global.css'; // NativeWind: compiled Tailwind is injected via this import

// Per-weight subpath imports, not the package barrels: each barrel's index.js
// requires() every weight (and, for Plus Jakarta Sans, every italic) as a
// static asset — the same bloat as importing all of @expo/vector-icons for one
// icon family. These subpaths pull in only the five files actually loaded.
import { Manrope_600SemiBold } from '@expo-google-fonts/manrope/600SemiBold';
import { Manrope_700Bold } from '@expo-google-fonts/manrope/700Bold';
import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans/400Regular';
import { PlusJakartaSans_500Medium } from '@expo-google-fonts/plus-jakarta-sans/500Medium';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

import { useDatabaseMigrations } from '@/db/migrate';

export default function RootLayout() {
  const { success: migrated, error: migrationError } = useDatabaseMigrations();
  const [fontsLoaded, fontError] = useFonts({
    Manrope_600SemiBold,
    Manrope_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
  });

  // Every screen below assumes the schema exists AND the Manrope/Plus Jakarta
  // Sans fonts are loaded (the design system has no system-font fallback path),
  // so hold rendering on both. On device this is a handful of frames after
  // first launch, not a spinner anyone dwells on.
  if (migrationError || fontError) {
    const message = migrationError?.message ?? fontError?.message ?? 'Unknown error';
    return (
      <View className="flex-1 items-center justify-center gap-2 bg-background p-6">
        <Text className="text-headline text-label">
          {migrationError ? 'Database migration failed' : 'Failed to load fonts'}
        </Text>
        <Text className="text-center text-footnote text-secondaryLabel">{message}</Text>
      </View>
    );
  }

  if (!migrated || !fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="capture" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
