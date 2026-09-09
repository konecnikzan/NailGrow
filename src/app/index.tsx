/**
 * Photo-pipeline test harness. NOT shipping UI — it exists to exercise capture,
 * listing, fullscreen view, delete, and the integrity check on a real device in
 * Expo Go. Styled with plain StyleSheet (not NativeWind) and hardcoded strings
 * on purpose: it is a throwaway dev tool, not a product screen.
 */
import { CameraView } from 'expo-camera';
import { Image } from 'expo-image';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Photo } from '@/db/schema';
import { deletePhoto, runIntegrityCheck, type IntegrityReport } from '@/photos';
import { useCapturedPhotos } from '@/photos/use-captured-photos';
import { usePhotoCapture } from '@/photos/use-photo-capture';

type ButtonTone = 'primary' | 'neutral' | 'danger';

function Button({
  label,
  onPress,
  disabled,
  tone = 'primary',
  fill,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: ButtonTone;
  fill?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      android_ripple={{ color: '#00000022' }}
      style={({ pressed }) => [
        styles.button,
        styles[`button_${tone}`],
        fill && styles.buttonFill,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
    >
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

export default function Harness() {
  const camera = useRef<CameraView>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const { permissionGranted, requestPermission, capture, busy, lastError } = usePhotoCapture();
  const { photos, flaggedIds, reload } = useCapturedPhotos();

  const [integrity, setIntegrity] = useState<IntegrityReport | null>(null);
  const [integrityRunning, setIntegrityRunning] = useState(false);
  const [selected, setSelected] = useState<Photo | null>(null);

  const sections = useMemo(() => groupByDay(photos), [photos]);

  async function onCapture(hand: 'left' | 'right') {
    const created = await capture(camera.current, hand);
    if (created) reload();
  }

  async function onRunIntegrity() {
    setIntegrityRunning(true);
    const result = await runIntegrityCheck({ decode: true });
    setIntegrityRunning(false);
    setIntegrity(result.ok ? result.value : null);
    reload();
  }

  async function onDelete(photo: Photo) {
    const result = await deletePhoto(photo.id);
    setSelected(null);
    reload();
    if (!result.ok) {
      console.warn('deletePhoto:', result.error.code, result.error.message);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>NailGrow — pipeline harness</Text>

        <View style={styles.cameraBox}>
          {permissionGranted ? (
            <CameraView
              ref={camera}
              style={StyleSheet.absoluteFill}
              facing="back"
              onCameraReady={() => setCameraReady(true)}
            />
          ) : (
            <View style={styles.cameraPlaceholder}>
              <Text style={styles.cameraPlaceholderText}>Camera permission needed</Text>
              <Button label="Grant camera access" onPress={requestPermission} tone="neutral" />
            </View>
          )}
        </View>

        <View style={styles.row}>
          <Button
            label="Capture left hand"
            onPress={() => onCapture('left')}
            disabled={!permissionGranted || !cameraReady || busy}
            fill
          />
          <Button
            label="Capture right hand"
            onPress={() => onCapture('right')}
            disabled={!permissionGranted || !cameraReady || busy}
            fill
          />
        </View>

        <View style={styles.row}>
          <Button
            label={integrityRunning ? 'Checking…' : 'Run integrity check'}
            onPress={onRunIntegrity}
            disabled={integrityRunning}
            tone="neutral"
            fill
          />
          {(busy || integrityRunning) && <ActivityIndicator />}
        </View>

        {lastError ? (
          <ScrollView style={styles.errorBox} contentContainerStyle={styles.errorBoxContent}>
            <Text style={styles.errorText}>Last capture error: {lastError}</Text>
          </ScrollView>
        ) : null}

        {integrity ? (
          <View style={styles.integrityBox}>
            <Text style={styles.integrityHeadline}>
              Integrity: checked {integrity.checked} ·{' '}
              {integrity.healthy ? 'healthy' : `${integrity.issues.length} issue(s)`}
            </Text>
            {integrity.issues.slice(0, 6).map((issue, i) => (
              <Text key={`${issue.photoId}-${i}`} style={styles.integrityIssue}>
                {issue.kind} — {issue.photoId.slice(0, 8)} ({issue.detail})
              </Text>
            ))}
          </View>
        ) : null}

        <Text style={styles.count}>
          {photos.length} photo{photos.length === 1 ? '' : 's'}
        </Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setSelected(item)}
            style={({ pressed }) => [styles.listItem, pressed && styles.listItemPressed]}
          >
            <Image source={{ uri: item.thumbUri }} style={styles.thumb} contentFit="cover" />
            <View style={styles.listItemBody}>
              <Text style={styles.listItemTitle}>
                {item.capturedAt.toLocaleTimeString()} · {item.hand} hand
              </Text>
              <Text style={styles.listItemMeta}>
                {item.width}×{item.height} · orient {item.normalisedOrientation}
              </Text>
              {flaggedIds.has(item.id) ? (
                <Text style={styles.listItemFlag}>⚠ file missing or unreadable</Text>
              ) : null}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No photos yet — capture one above.</Text>
        }
      />

      <Modal
        visible={selected !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modal}>
          <Pressable style={styles.modalImageArea} onPress={() => setSelected(null)}>
            {selected ? (
              <Image source={{ uri: selected.fileUri }} style={StyleSheet.absoluteFill} contentFit="contain" />
            ) : null}
          </Pressable>
          <View style={styles.modalBar}>
            {selected ? (
              <>
                <Text style={styles.modalPath} numberOfLines={2}>
                  {selected.fileUri}
                </Text>
                <View style={styles.row}>
                  <Button label="Delete" tone="danger" fill onPress={() => onDelete(selected)} />
                  <Button label="Close" tone="neutral" fill onPress={() => setSelected(null)} />
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function groupByDay(photos: Photo[]): { title: string; data: Photo[] }[] {
  const byDay = new Map<string, Photo[]>();
  for (const photo of photos) {
    const key = photo.capturedAt.toISOString().slice(0, 10);
    const bucket = byDay.get(key);
    if (bucket) bucket.push(photo);
    else byDay.set(key, [photo]);
  }
  return [...byDay.entries()].map(([title, data]) => ({ title, data }));
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 16, gap: 12 },
  title: { fontSize: 18, fontWeight: '700' },

  cameraBox: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  cameraPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  cameraPlaceholderText: { color: '#fff' },

  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },

  button: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonFill: { flex: 1 },
  button_primary: { backgroundColor: '#2563eb' },
  button_neutral: { backgroundColor: '#374151' },
  button_danger: { backgroundColor: '#dc2626' },
  buttonDisabled: { backgroundColor: '#9ca3af' },
  buttonPressed: { opacity: 0.75 },
  buttonLabel: { color: '#fff', fontSize: 15, fontWeight: '600', textAlign: 'center' },

  errorBox: { maxHeight: 96, borderRadius: 8, backgroundColor: '#fef2f2' },
  errorBoxContent: { padding: 8 },
  errorText: { color: '#b91c1c', fontSize: 13 },

  integrityBox: { borderRadius: 8, backgroundColor: '#f3f4f6', padding: 10, gap: 2 },
  integrityHeadline: { fontSize: 13, fontWeight: '600' },
  integrityIssue: { fontSize: 11, color: '#b91c1c' },

  count: { fontSize: 14, fontWeight: '600' },

  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  sectionHeader: {
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    backgroundColor: '#fff',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  listItemPressed: { backgroundColor: '#f9fafb' },
  listItemBody: { flex: 1, gap: 2 },
  listItemTitle: { fontSize: 14 },
  listItemMeta: { fontSize: 12, color: '#6b7280' },
  listItemFlag: { fontSize: 12, fontWeight: '600', color: '#dc2626' },
  thumb: { width: 56, height: 56, borderRadius: 6, backgroundColor: '#eee' },

  empty: { paddingVertical: 32, textAlign: 'center', fontSize: 14, color: '#9ca3af' },

  modal: { flex: 1, backgroundColor: '#000' },
  modalImageArea: { flex: 1 },
  modalBar: { padding: 16, gap: 10, backgroundColor: 'rgba(0,0,0,0.85)' },
  modalPath: { color: '#d1d5db', fontSize: 11 },
});
