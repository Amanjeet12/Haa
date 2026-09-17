import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Check from 'lucide-react-native/icons/check';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import Moon from 'lucide-react-native/icons/moon';
import Smartphone from 'lucide-react-native/icons/smartphone';
import Sun from 'lucide-react-native/icons/sun';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../components';
import { ThemePreference, useAppTheme } from '../theme';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'AppearancePreferences'>;

export function AppearancePreferencesScreen({ navigation }: Props) {
  const { theme, preference, setPreference } = useAppTheme();
  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.flex}>
        <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}> 
          <Pressable onPress={navigation.goBack} style={[styles.back, { backgroundColor: theme.colors.surface }]}> 
            <ChevronLeft color={theme.colors.text} size={20} />
          </Pressable>
          <AppText style={styles.headerTitle} weight="800">Appearance</AppText>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.content}>
          <AppText style={styles.title} weight="800">Choose your app mode.</AppText>
          <AppText color={theme.colors.textMuted} style={styles.subtitle}>
            Choose an appearance or automatically match your device setting.
          </AppText>
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
            <ModeRow icon={<Smartphone color={preference === 'system' ? theme.colors.primary : theme.colors.textMuted} size={20} />} title="Use device setting" subtitle="Match your phone automatically" value="system" selected={preference === 'system'} onSelect={setPreference} />
            <ModeRow icon={<Sun color={preference === 'light' ? theme.colors.primary : theme.colors.textMuted} size={20} />} title="Light mode" subtitle="A bright and clear appearance" value="light" selected={preference === 'light'} onSelect={setPreference} />
            <ModeRow icon={<Moon color={preference === 'dark' ? theme.colors.primary : theme.colors.textMuted} size={20} />} title="Dark mode" subtitle="Comfortable viewing in low light" value="dark" selected={preference === 'dark'} onSelect={setPreference} last />
          </View>
          <View style={[styles.note, { backgroundColor: theme.colors.surfaceMuted }]}> 
            <AppText color={theme.colors.textMuted} style={styles.noteText}>
              Your preference is applied across Haa Health and saved on this device.
            </AppText>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function ModeRow({ icon, title, subtitle, value, selected, onSelect, last }: { icon: React.ReactNode; title: string; subtitle: string; value: ThemePreference; selected: boolean; onSelect: (value: ThemePreference) => void; last?: boolean }) {
  const { theme } = useAppTheme();
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => onSelect(value)} style={({ pressed }) => [styles.mode, selected && { backgroundColor: theme.colors.primarySoft }, !last && { borderBottomColor: theme.colors.border, borderBottomWidth: StyleSheet.hairlineWidth }, pressed && styles.pressed]}><View style={[styles.modeIcon, { backgroundColor: selected ? theme.colors.surface : theme.colors.surfaceMuted }]}>{icon}</View><View style={styles.grow}><AppText color={selected ? theme.colors.text : theme.colors.textMuted} style={styles.modeTitle} weight="700">{title}</AppText><AppText color={theme.colors.textMuted} style={styles.modeSubtitle}>{subtitle}</AppText></View><View style={[styles.radio, { borderColor: selected ? theme.colors.primary : theme.colors.border, backgroundColor: selected ? theme.colors.primary : 'transparent' }]}>{selected ? <Check color={theme.colors.onPrimary} size={14} strokeWidth={3} /> : null}</View></Pressable>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, header: { height: 54, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16 }, back: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 2 }, headerTitle: { flex: 1, textAlign: 'center', fontSize: 19, lineHeight: 23 }, headerSpacer: { width: 36 }, content: { padding: 18 },
  title: { marginTop: 18, fontSize: 25, lineHeight: 30 }, subtitle: { marginTop: 6, maxWidth: 330, fontSize: 11, lineHeight: 16 }, card: { borderWidth: 1, borderRadius: 18, marginTop: 24, overflow: 'hidden' }, mode: { minHeight: 72, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 11 }, pressed: { opacity: .72 }, modeIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, grow: { flex: 1 }, modeTitle: { fontSize: 12, lineHeight: 16 }, modeSubtitle: { marginTop: 2, fontSize: 9, lineHeight: 12 }, radio: { width: 24, height: 24, borderWidth: 1.5, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, note: { borderRadius: 13, marginTop: 12, padding: 13 }, noteText: { fontSize: 9, lineHeight: 13, textAlign: 'center' },
});
