import { router } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Placeholder route — the real camera + ghost-overlay screen is Step 2.
export default function Capture() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center gap-4 bg-background">
      <Text className="text-title1 font-bold text-label">Capture</Text>
      <Text className="text-body text-secondaryLabel">Coming up next</Text>
      <Pressable
        onPress={() => router.back()}
        className="min-h-11 min-w-11 items-center justify-center rounded-xl bg-secondaryBackground px-6"
      >
        <Text className="text-headline text-accent">Close</Text>
      </Pressable>
    </SafeAreaView>
  );
}
