import React, { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  screenGradientColors,
  screenGradientLocations,
  useAppTheme,
} from '../theme';

type AuthScaffoldProps = PropsWithChildren<{
  contentContainerStyle?: StyleProp<ViewStyle>;
}>;

export function AuthScaffold({
  children,
  contentContainerStyle,
}: AuthScaffoldProps) {
  const { theme } = useAppTheme();

  return (
    <LinearGradient
      colors={screenGradientColors(theme)}
      end={{ x: 0, y: 1 }}
      locations={screenGradientLocations}
      start={{ x: 0, y: 0 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.safeArea}
        >
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.content, contentContainerStyle]}
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
  },
});
