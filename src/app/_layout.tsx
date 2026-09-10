import '@/global.css'; // NativeWind: compiled Tailwind is injected via this import

import { Stack } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

import { useDatabaseMigrations } from '@/db/migrate';

export default function RootLayout() {
  const { success, error } = useDatabaseMigrations();

  // Every screen below assumes the schema exists, so hold rendering until the
  // migrations have run. On device this is a single frame after first launch.
  if (error) {
    return (
      <View className="flex-1 items-center justify-center gap-2 bg-background p-6">
        <Text className="text-headline text-label">Database migration failed</Text>
        <Text className="text-center text-footnote text-secondaryLabel">{error.message}</Text>
      </View>
    );
  }

  if (!success) {
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
