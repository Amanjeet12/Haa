import BadgeCheck from 'lucide-react-native/icons/badge-check';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import Clock3 from 'lucide-react-native/icons/clock-3';
import FileText from 'lucide-react-native/icons/file-text';
import FlaskConical from 'lucide-react-native/icons/flask-conical';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import React from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SvgUri } from 'react-native-svg';

import { useAppTheme } from '../../theme';
import { AppText } from '../AppText';
import { Lab } from '../labs';

export function LabDetailsHero({
  lab,
  onBack,
}: {
  lab: Lab;
  onBack: () => void;
}) {
  const { theme } = useAppTheme();
  const isSvgLogo = lab.image?.toLowerCase().endsWith('.svg');
  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.nav,
          {
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <Pressable
          accessibilityLabel="Go back"
          onPress={onBack}
          style={[
            styles.back,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <ChevronLeft color={theme.colors.text} size={22} />
        </Pressable>
        <AppText style={styles.title} weight="800">
          Lab Details
        </AppText>
        <View style={styles.backSpacer} />
      </View>
      <ImageBackground
        source={lab.banner ? { uri: lab.banner } : undefined}
        style={[styles.banner, { backgroundColor: lab.accent }]}
        imageStyle={styles.bannerImage}
      >
        <LinearGradient
          colors={[
            'rgba(8,35,61,0)',
            'rgba(8,35,61,0.12)',
            'rgba(8,35,61,0.42)',
          ]}
          locations={[0, 0.65, 1]}
          style={styles.gradient}
        >
          {(lab.partner || lab.verified) && (
            <View style={styles.verified}>
              <BadgeCheck color="#08233D" size={12} />
              <AppText color="#08233D" style={styles.verifiedText} weight="700">
                {lab.partner ? 'Premium Partner' : 'HAA Verified'}
              </AppText>
            </View>
          )}
        </LinearGradient>
      </ImageBackground>
      <View
        style={[
          styles.infoCard,
          {
            backgroundColor: theme.isDark ? '#121C2D' : theme.colors.surface,
            borderColor: theme.isDark ? '#3B4A62' : 'transparent',
            shadowColor: theme.colors.shadow,
          },
        ]}
      >
        <View style={styles.identity}>
          <View style={[styles.logo, { borderColor: theme.colors.surface }]}>
            {isSvgLogo && lab.image ? (
              <SvgUri uri={lab.image} width="100%" height="100%" />
            ) : lab.image ? (
              <Image
                source={{ uri: lab.image }}
                resizeMode="cover"
                style={styles.logoImage}
              />
            ) : (
              <>
                <FlaskConical color={theme.colors.primary} size={25} />
                <AppText
                  color={theme.colors.primary}
                  style={styles.logoFallback}
                  weight="800"
                >
                  {lab.name.split(' ')[0]}
                </AppText>
              </>
            )}
          </View>
          <View style={styles.copy}>
            <AppText
              color={theme.colors.primary}
              style={styles.name}
              weight="800"
            >
              {lab.name}
            </AppText>
            <AppText
              color={theme.colors.textMuted}
              numberOfLines={1}
              style={styles.address}
            >
              Individual diagnostics · Preventive packages
            </AppText>
          </View>
        </View>
        <View style={styles.certifications}>
          {lab.certifications.slice(0, 2).map(item => (
            <View
              key={item}
              style={[
                styles.cert,
                { backgroundColor: theme.isDark ? '#123A34' : '#DCF7EF' },
              ]}
            >
              <ShieldCheck
                color={theme.isDark ? '#5EEAD4' : '#078A73'}
                size={12}
              />
              <AppText
                color={theme.isDark ? '#5EEAD4' : '#078A73'}
                style={styles.certText}
                weight="700"
              >
                {item}
              </AppText>
            </View>
          ))}
          <View
            style={[
              styles.cert,
              { backgroundColor: theme.isDark ? '#123A34' : '#DCF7EF' },
            ]}
          >
            <AppText
              color={theme.isDark ? '#5EEAD4' : '#078A73'}
              style={styles.certText}
              weight="700"
            >
              {lab.reportTime} turnaround
            </AppText>
          </View>
        </View>
        <View style={styles.features}>
          <Feature
            icon={<FlaskConical color={theme.colors.primary} size={20} />}
            title="Home collection"
          />
          <Feature
            icon={<Clock3 color={theme.colors.primary} size={20} />}
            title="24–48 hr reports"
          />
          <Feature
            icon={<FileText color={theme.colors.primary} size={20} />}
            title="Secure digital reports"
          />
        </View>
      </View>
    </View>
  );
}

function Feature({ icon, title }: { icon: React.ReactNode; title: string }) {
  const { theme } = useAppTheme();
  return (
    <View
      style={[
        styles.feature,
        {
          backgroundColor: theme.isDark ? '#1A263A' : theme.colors.surface,
          borderColor: theme.isDark ? '#3B4A62' : theme.colors.border,
        },
      ]}
    >
      {icon}
      <AppText style={styles.featureText} weight="700">
        {title}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingBottom: 18 },
  nav: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  backSpacer: { width: 36 },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 18, lineHeight: 22 },
  banner: { height: 205 },
  bannerImage: { resizeMode: 'cover' },
  gradient: { flex: 1 },
  verified: {
    position: 'absolute',
    right: 11,
    top: 11,
    height: 31,
    paddingHorizontal: 11,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    elevation: 3,
  },
  verifiedText: { fontSize: 8, lineHeight: 10 },
  infoCard: {
    marginHorizontal: 20,
    marginTop: -52,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 13,
    elevation: 7,
    shadowOpacity: 0.13,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  identity: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 3,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  logoImage: { width: '100%', height: '100%' },
  logoFallback: { maxWidth: 56, fontSize: 7, lineHeight: 9 },
  copy: { flex: 1 },
  name: { fontSize: 18, lineHeight: 22 },
  address: { marginTop: 4, fontSize: 9, lineHeight: 12 },
  certifications: { flexDirection: 'row', gap: 6, marginTop: 8 },
  cert: {
    flex: 1,
    minHeight: 31,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 4,
    borderRadius: 9,
  },
  certText: { flexShrink: 1, fontSize: 6, lineHeight: 8, textAlign: 'center' },
  features: { flexDirection: 'row', gap: 7, marginTop: 12 },
  feature: {
    flex: 1,
    minHeight: 64,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 3,
  },
  featureText: { fontSize: 7, lineHeight: 10, textAlign: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: 18, lineHeight: 22 },
});
