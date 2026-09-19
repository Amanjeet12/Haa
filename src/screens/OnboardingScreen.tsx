import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ArrowRight from 'lucide-react-native/icons/arrow-right';
import React from 'react';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';

import { images } from '../assets/images';
import { AppButton, AppText, AuthScaffold, HaaLogo } from '../components';
import { useAppTheme } from '../theme';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export function OnboardingScreen({ navigation }: Props) {
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const artworkWidth = Math.min(width, 410);
  const artworkHeight = artworkWidth * (1555 / 1608);

  return (
    <AuthScaffold contentContainerStyle={styles.content}>
      <HaaLogo />

      <Image
        accessibilityLabel="At-home labs, quick commerce, and global store"
        resizeMode="contain"
        source={images.onboardingCards}
        style={[styles.artwork, { height: artworkHeight, width: artworkWidth }]}
      />

      <View style={styles.copy}>
        <AppText variant="title" weight="500" style={styles.title}>
          Three ways to care.{`\n`}
          <AppText
            variant="title"
            weight="500"
            color={theme.colors.primary}
            style={{ fontSize: 36 }}
          >
            One HAA Health.
          </AppText>
        </AppText>
        <AppText
          variant="caption"
          color={theme.colors.textMuted}
          style={{ fontSize: 12 }}
        >
          Browse freely, choose what fits, and sign in only when you are ready
          to book or buy.
        </AppText>
      </View>

      <View style={styles.spacer} />

      <View style={styles.actions}>
        <AppButton
          fullWidth
          icon={<ArrowRight color={theme.colors.onPrimary} size={17} />}
          iconPosition="end"
          label="Get started"
          onPress={() => navigation.navigate('Location')}
        />
        <AppButton
          fullWidth
          label="Browse as guest"
          onPress={() => navigation.replace('Home')}
          variant="secondary"
        />
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  artwork: {
    alignSelf: 'center',
    marginTop: 0,
    marginBottom: -6,
  },
  copy: {
    gap: 8,
  },
  title: {
    fontSize: 36,
    lineHeight: 45,
    letterSpacing: -1.1,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
  },
  activeDot: {
    width: 18,
    height: 5,
    borderRadius: 3,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  spacer: {
    flex: 1,
    minHeight: 24,
  },
  actions: {
    gap: 10,
    marginBottom: 36,
  },
});
