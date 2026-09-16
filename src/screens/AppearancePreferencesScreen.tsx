import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import Moon from 'lucide-react-native/icons/moon';
import Smartphone from 'lucide-react-native/icons/smartphone';
import Sparkles from 'lucide-react-native/icons/sparkles';
import Sun from 'lucide-react-native/icons/sun';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../components';
import { useAppTheme } from '../theme';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'AppearancePreferences'>;

export function AppearancePreferencesScreen({ navigation }: Props) {
  const { theme } = useAppTheme();
  return (
    <LinearGradient
      colors={[theme.colors.gradientStart, theme.isDark ? theme.colors.background : '#FBF8F6', theme.colors.gradientEnd]}
      locations={[0, 0.48, 1]}
      style={styles.flex}
    >
      <SafeAreaView edges={['top', 'bottom']} style={styles.flex}>
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <Pressable onPress={navigation.goBack} style={[styles.back, { backgroundColor: theme.colors.surface }]}>
            <ChevronLeft color={theme.colors.text} size={20} />
          </Pressable>
          <AppText style={styles.headerTitle} weight="800">Appearance</AppText>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.content}>
          <View style={[styles.badge, { backgroundColor: theme.colors.primarySoft }]}>
            <Sparkles color={theme.colors.primary} size={15} />
            <AppText color={theme.colors.primary} style={styles.badgeText} weight="800">COMING LATER</AppText>
          </View>
          <AppText style={styles.title} weight="800">Choose your app mode.</AppText>
          <AppText color={theme.colors.textMuted} style={styles.subtitle}>
            Personal appearance controls are being prepared for a future update.
          </AppText>
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <ModeRow icon={<Smartphone color={theme.colors.textMuted} size={20} />} title="Use device setting" subtitle="Match your phone automatically" />
            <ModeRow icon={<Sun color={theme.colors.textMuted} size={20} />} title="Light mode" subtitle="A bright and clear appearance" />
            <ModeRow icon={<Moon color={theme.colors.textMuted} size={20} />} title="Dark mode" subtitle="Comfortable viewing in low light" last />
          </View>
          <View style={[styles.note, { backgroundColor: theme.colors.surfaceMuted }]}>
            <AppText color={theme.colors.textMuted} style={styles.noteText}>
              These options are previews only. Your current app appearance will remain unchanged.
            </AppText>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function ModeRow({ icon, title, subtitle, last }: { icon: React.ReactNode; title: string; subtitle: string; last?: boolean }) {
  const { theme } = useAppTheme();
  return <View style={[styles.mode, !last && { borderBottomColor: theme.colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}><View style={[styles.modeIcon, { backgroundColor: theme.colors.surfaceMuted }]}>{icon}</View><View style={styles.grow}><AppText color={theme.colors.textMuted} style={styles.modeTitle} weight="700">{title}</AppText><AppText color={theme.colors.textMuted} style={styles.modeSubtitle}>{subtitle}</AppText></View><View style={[styles.locked, { borderColor: theme.colors.border }]}><AppText color={theme.colors.textMuted} style={styles.lockedText} weight="700">Soon</AppText></View></View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, header: { height: 54, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16 }, back: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 2 }, headerTitle: { flex: 1, textAlign: 'center', fontSize: 19, lineHeight: 23 }, headerSpacer: { width: 36 }, content: { padding: 18 },
  badge: { alignSelf: 'flex-start', borderRadius: 9, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 }, badgeText: { fontSize: 8, lineHeight: 10, letterSpacing: .7 }, title: { marginTop: 18, fontSize: 25, lineHeight: 30 }, subtitle: { marginTop: 6, maxWidth: 330, fontSize: 11, lineHeight: 16 }, card: { borderWidth: 1, borderRadius: 18, marginTop: 24, overflow: 'hidden' }, mode: { minHeight: 72, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 11, opacity: .72 }, modeIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, grow: { flex: 1 }, modeTitle: { fontSize: 12, lineHeight: 16 }, modeSubtitle: { marginTop: 2, fontSize: 9, lineHeight: 12 }, locked: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4 }, lockedText: { fontSize: 7, lineHeight: 9 }, note: { borderRadius: 13, marginTop: 12, padding: 13 }, noteText: { fontSize: 9, lineHeight: 13, textAlign: 'center' },
});
