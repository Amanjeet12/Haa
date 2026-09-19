import React from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet } from 'react-native';

import { images } from '../assets/images';
import { useAppTheme } from '../theme';

type HaaLogoProps = {
  style?: StyleProp<ImageStyle>;
};

export function HaaLogo({ style }: HaaLogoProps) {
  const { theme } = useAppTheme();
  
  return (
    <Image
      accessibilityLabel="Haa Health"
      resizeMode="contain"
      source={images.logo}
      style={[styles.logo, theme.isDark && styles.nightLogo]}
    />
  );
}

const styles = StyleSheet.create({
  nightLogo: {},
  logo: {
    width: 78,
    height: 40,
  },
});
