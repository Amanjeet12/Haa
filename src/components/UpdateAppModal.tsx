import Download from 'lucide-react-native/icons/download';
import Smartphone from 'lucide-react-native/icons/smartphone';
import React from 'react';
import {
  Linking,
  Modal,
  NativeModules,
  Platform,
  StyleSheet,
  View,
} from 'react-native';

import { getVersionControl } from '../api/versionControl';
import { useAppTheme } from '../theme';
import { AppButton } from './AppButton';
import { AppText } from './AppText';

type AppVersionNativeModule = {
  versionCode?: number;
};

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.haa_health';

export function shouldPromptForUpdate(
  currentVersion: number,
  requiredVersion: string,
) {
  const parsedRequiredVersion = Number(requiredVersion);
  return (
    Number.isFinite(parsedRequiredVersion) &&
    parsedRequiredVersion > currentVersion
  );
}

export function UpdateAppModal() {
  const { theme } = useAppTheme();
  const [visible, setVisible] = React.useState(false);
  const [requiredVersion, setRequiredVersion] = React.useState('');

  React.useEffect(() => {
    if (Platform.OS !== 'android') return;

    const currentVersion = (
      NativeModules.AppVersion as AppVersionNativeModule | undefined
    )?.versionCode;
    if (typeof currentVersion !== 'number') return;

    let active = true;
    getVersionControl()
      .then(response => {
        if (
          active &&
          response.success &&
          shouldPromptForUpdate(currentVersion, response.requiredAndroidVersion)
        ) {
          setRequiredVersion(response.requiredAndroidVersion);
          setVisible(true);
        }
      })
      .catch(() => {
        // A version-check failure must not prevent the app from opening.
      });

    return () => {
      active = false;
    };
  }, []);

  const openStore = React.useCallback(() => {
    Linking.openURL(PLAY_STORE_URL).catch(() => {
      // Keep the prompt visible if the store cannot be opened.
    });
  }, []);

  return (
    <Modal
      animationType="fade"
      transparent
      statusBarTranslucent
      visible={visible}
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: theme.colors.primarySoft },
            ]}
          >
            <Smartphone color={theme.colors.primary} size={30} />
          </View>
          <AppText variant="title" weight="800" style={styles.title}>
            Update available
          </AppText>
          <AppText color={theme.colors.textMuted} style={styles.message}>
            A newer version of Haa Health is available. Update now for the
            latest improvements and fixes.
          </AppText>
          {requiredVersion ? (
            <AppText
              variant="caption"
              color={theme.colors.textMuted}
              style={styles.version}
            >
              Required Android version: {requiredVersion}
            </AppText>
          ) : null}
          <AppButton
            fullWidth
            label="Update app"
            icon={<Download color={theme.colors.onPrimary} size={18} />}
            onPress={openStore}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(2, 6, 23, 0.55)',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  iconContainer: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    marginTop: 8,
    textAlign: 'center',
  },
  version: {
    marginTop: 12,
    marginBottom: 20,
  },
});
