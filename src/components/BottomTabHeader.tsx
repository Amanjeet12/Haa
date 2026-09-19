import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import MessageCircleMore from 'lucide-react-native/icons/message-circle-more';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAppTheme } from '../theme';
import { RootStackParamList } from '../types/navigation';
import { AppText } from './AppText';
import { HaaLogo } from './HaaLogo';

export function BottomTabHeader() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <View style={styles.header}>
      <HaaLogo style={styles.logo} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Need help?"
        onPress={() => navigation.navigate('Support')}
        style={[
          styles.helpButton,
          {
            backgroundColor: theme.colors.primarySoft,
            borderColor: theme.colors.border2,
          },
        ]}
      >
        <View
          style={[styles.helpIcon, { backgroundColor: theme.colors.primary }]}
        >
          <MessageCircleMore color="#FFFFFF" size={17} strokeWidth={2.4} />
        </View>
        <AppText
          color={theme.colors.primary}
          style={styles.helpText}
          weight="700"
        >
          Need help?
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  logo: { width: 112, height: 52 },
  helpButton: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 15,
    borderWidth: 1,
    paddingLeft: 5,
    paddingRight: 12,
  },
  helpIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: { fontSize: 12, lineHeight: 15 },
});
