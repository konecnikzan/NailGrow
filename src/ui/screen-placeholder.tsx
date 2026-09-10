import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Temporary stand-in for a screen whose route exists but whose content hasn't
 * been built yet. Every tab screen currently renders one of these — they get
 * replaced one at a time in the steps that follow the navigation shell.
 */
export function ScreenPlaceholder({ title }: { title: string }) {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-background" edges={['top']}>
      <Text className="text-title1 font-bold text-label">{title}</Text>
      <Text className="mt-2 text-body text-secondaryLabel">Coming up next</Text>
    </SafeAreaView>
  );
}
