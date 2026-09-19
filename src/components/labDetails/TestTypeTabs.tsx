import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LabTestType } from '../../api/labTests';
import { useAppTheme } from '../../theme';
import { AppText } from '../AppText';

type Props = {
  value: LabTestType;
  individualCount: number | null;
  packageCount: number | null;
  onChange: (value: LabTestType) => void;
};
export function TestTypeTabs({
  value,
  individualCount,
  packageCount,
  onChange,
}: Props) {
  const { theme } = useAppTheme();
  const tabs: Array<{ key: LabTestType; label: string; subtitle: string }> = [
    {
      key: 'individual_test',
      label: 'Individual Tests',
      subtitle: `${individualCount ?? '—'} standalone tests`,
    },
    {
      key: 'health_package',
      label: 'Health Packages',
      subtitle: `${packageCount ?? '—'} multi-test plans`,
    },
  ];
  return (
    <View
      style={[
        styles.tabs,
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {tabs.map(tab => {
        const active = value === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[
              styles.tab,
              active && styles.activeTab,
              active && theme.isDark && styles.activeTabDark,
            ]}
          >
            <AppText
              color={active ? '#FFFFFF' : theme.colors.text}
              style={styles.label}
              weight="800"
            >
              {tab.label}
            </AppText>
            <AppText
              color={active ? '#D7E0EA' : theme.colors.textMuted}
              style={styles.subtitle}
            >
              {tab.subtitle}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  tabs: {
    height: 64,
    borderRadius: 16,
    borderWidth: 1,
    padding: 5,
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  activeTab: {
    backgroundColor: '#08233D',
    elevation: 4,
    shadowColor: '#08233D',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  activeTabDark: {
    backgroundColor: '#21324C',
    borderWidth: 1,
    borderColor: '#4B5E7A',
  },
  label: { fontSize: 10, lineHeight: 13 },
  subtitle: { marginTop: 2, fontSize: 8, lineHeight: 10 },
});
