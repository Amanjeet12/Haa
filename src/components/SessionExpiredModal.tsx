import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { subscribeToSessionExpiry } from '../api/sessionExpiry';
import { useAppDispatch, useAppSelector } from '../store';
import { signOut } from '../store/authSlice';
import { useAppTheme } from '../theme';
import { AppText } from './AppText';

export function SessionExpiredModal() {
  const dispatch = useAppDispatch();
  const { theme } = useAppTheme();
  const session = useAppSelector(state => state.auth.session);
  const [visible, setVisible] = useState(false);
  const handling = useRef(false);
  const hasSession = useRef(Boolean(session));
  hasSession.current = Boolean(session);

  useEffect(() =>
    subscribeToSessionExpiry(() => {
      if (!hasSession.current || handling.current) return;
      handling.current = true;
      setVisible(true);
      dispatch(signOut());
    }),
  [dispatch]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <AppText style={styles.title} weight="800">Session expired</AppText>
          <AppText color={theme.colors.textMuted} style={styles.message}>
            Your session has expired. Please log in again to continue.
          </AppText>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setVisible(false);
              handling.current = false;
            }}
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
          >
            <AppText color="#FFFFFF" weight="800">Log in again</AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  card: { borderRadius: 18, padding: 24 },
  title: { fontSize: 20 },
  message: { marginTop: 10, fontSize: 14, lineHeight: 20 },
  button: {
    marginTop: 24,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
