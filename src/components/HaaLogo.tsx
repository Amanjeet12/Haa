import React from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet } from 'react-native';

import { images } from '../assets/images';

type HaaLogoProps = {
  style?: StyleProp<ImageStyle>;
};

export function HaaLogo({ style }: HaaLogoProps) {
  return (
    <Image
      accessibilityLabel="Haa Health"
      resizeMode="contain"
      source={images.logo}
      style={[styles.logo, style]}
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 78,
    height: 40,
  },
});
