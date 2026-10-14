import React from 'react';
import { Modal, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Group, Row } from '@/components/ui';
import { describeEvent, EventRow } from '@/lib/eventText';
import { useColors, font, radius } from '@/theme';

/** Bottom sheet opened from a row's three-dot button. */
export function EventActionSheet({ event, onClose, onView, onEdit, onDuplicate, onDelete }: {
  event: EventRow | null; onClose: () => void; onView: () => void; onEdit: () => void; onDuplicate?: () => void; onDelete: () => void;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={!!event} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable accessibilityLabel="Close menu" onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <Pressable onPress={() => {}} style={{ backgroundColor: c.bg, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: 16, paddingBottom: 16 + insets.bottom }}>
          <Text numberOfLines={1} style={{ fontFamily: font.bold, fontSize: 16, color: c.text, marginBottom: 12 }}>{event ? describeEvent(event) : ''}</Text>
          <Group>
            <Row icon="eye-outline" label="View details" onPress={onView} />
            <Row icon="create-outline" label="Edit" onPress={onEdit} />
            {onDuplicate ? <Row icon="copy-outline" label="Duplicate as new" onPress={onDuplicate} /> : null}
            <Row icon="trash-outline" label="Delete" danger last onPress={onDelete} />
          </Group>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
