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
  const cardHeight = Math.min(width - 40, 420) * 0.82;

  return (
    <AuthScaffold contentContainerStyle={styles.content}>
      <HaaLogo style={styles.logo} />

      <View style={styles.intro}>
        <AppText
          color={theme.colors.primary}
          style={styles.eyebrow}
          weight="800"
        >
          CARE BEGINS WITH CLARITY
        </AppText>
        <AppText style={styles.title} weight="500">
          Find the right lab{'\n'}test for{' '}
          <AppText
            color={theme.colors.primary}
            style={styles.title}
            weight="500"
          >
            you.
          </AppText>
        </AppText>
        <AppText color={theme.colors.textMuted} style={styles.description}>
          Compare trusted labs, individual tests and health packages—all in one
          place.
        </AppText>
      </View>

      <View style={[styles.photoCard, { height: cardHeight }]}>
        <Image
          accessibilityLabel="Blood sample tubes and a lab test on a counter"
          resizeMode="cover"
          source={images.onboardingLabPhoto}
          style={styles.photo}
        />
        <View style={styles.photoCaption}>
          <AppText style={styles.photoEyebrow} weight="800">
            HAA HEALTH LABS
          </AppText>
          <AppText style={styles.photoTitle} weight="800">
            Clear choices. Confident care.
          </AppText>
        </View>
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
          label="Browse labs as guest"
          onPress={() => navigation.replace('Home')}
          variant="secondary"
        />
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  logo: { width: 82, height: 43 },
  intro: { marginTop: 28 },
  eyebrow: { fontSize: 9, lineHeight: 13, letterSpacing: 1.2 },
  title: {
    marginTop: 12,
    fontSize: 30,
    lineHeight: 33,
    letterSpacing: -0.9,
  },
  description: { marginTop: 11, fontSize: 12, lineHeight: 17, maxWidth: 310 },
  photoCard: {
    marginTop: 22,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#071D39',
    shadowColor: '#071D39',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 6,
  },
  photo: { width: '100%', height: '100%' },
  photoCaption: { position: 'absolute', left: 16, right: 16, bottom: 16 },
  photoEyebrow: {
    color: '#FFBFC7',
    fontSize: 8,
    lineHeight: 11,
    letterSpacing: 0.7,
  },
  photoTitle: { color: '#FFFFFF', fontSize: 13, lineHeight: 17 },
  spacer: {
    flexGrow: 1,
    minHeight: 28,
  },
  actions: {
    gap: 10,
  },
});
