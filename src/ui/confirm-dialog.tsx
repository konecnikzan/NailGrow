import type { ComponentProps } from 'react';
import { Modal, View } from 'react-native';

import { Button } from './button';
import { Card } from './card';
import { AppText } from './text';
import { colors } from './tokens';

export interface ConfirmDialogProps {
  visible: boolean;
  icon: ComponentProps<typeof Button>['icon'];
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Red confirm button + red icon wash, for a destructive action (e.g. delete). */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * The one confirmation dialog — a Card-styled surface in the middle of a
 * dimmed backdrop, not the OS `Alert`. CLAUDE.md's default is to keep native
 * alerts for exactly this kind of interaction; this is a deliberate,
 * explicit exception (asked for directly) so a destructive confirmation
 * reads as part of the app's own design system rather than switching to
 * system chrome for one moment, the same trade-off already made for the tab
 * bar. Everything underneath — the actual keyboard, gestures, etc. — is
 * still left to the OS; only this one dialog's pixels are custom.
 */
export function ConfirmDialog({
  visible,
  icon,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-black/40 px-8">
        <Card className="w-full max-w-sm items-center gap-4 p-6">
          <View
            className="h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: destructive ? colors.danger + '1A' : colors.tertiaryBackground }}
          >
            {icon}
          </View>
          <View className="gap-1">
            <AppText variant="title3" className="text-center text-label">
              {title}
            </AppText>
            <AppText variant="footnote" className="text-center text-secondaryLabel">
              {message}
            </AppText>
          </View>
          <View className="w-full flex-row gap-3 pt-1">
            <Button label={cancelLabel} variant="secondary" fill onPress={onCancel} />
            <Button
              label={confirmLabel}
              variant={destructive ? 'danger' : 'primary'}
              fill
              onPress={onConfirm}
            />
          </View>
        </Card>
      </View>
    </Modal>
  );
}
