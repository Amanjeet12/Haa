import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Card, Screen } from '../components';
import { useAppTheme } from '../theme';

type Props = {
  title: string;
  description: string;
  icon: ReactNode;
};

export function EmptyTabScreen({ title, description, icon }: Props) {
  const { theme } = useAppTheme();

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.heading}>
        <AppText variant="title" weight="800">
          {title}
        </AppText>
        <AppText color={theme.colors.textMuted}>{description}</AppText>
      </View>
      <Card style={styles.card}>
        <View
          style={[styles.icon, { backgroundColor: theme.colors.primarySoft }]}
        >
          {icon}
        </View>
        <AppText variant="subtitle" weight="700">
          Nothing here yet
        </AppText>
        <AppText color={theme.colors.textMuted} style={styles.body}>
          Your {title.toLowerCase()} will appear here when they are available.
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 28,
  },
  heading: {
    gap: 4,
    marginBottom: 24,
  },
  card: {
    alignItems: 'center',
    paddingVertical: 34,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  body: {
    marginTop: 5,
    textAlign: 'center',
  },
});
