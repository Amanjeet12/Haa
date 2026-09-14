import React, { PropsWithChildren } from 'react';
import { StyleProp, Text, TextProps, TextStyle } from 'react-native';

import { useAppTheme } from '../theme';

type TextVariant = 'caption' | 'body' | 'subtitle' | 'title' | 'display';

function fontFamilyForWeight(
  weight: TextStyle['fontWeight'],
  fontFamily: ReturnType<
    typeof useAppTheme
  >['theme']['typography']['fontFamily'],
) {
  if (weight === '900') {
    return fontFamily.black;
  }

  if (weight === '800') {
    return fontFamily.extraBold;
  }

  if (weight === 'bold' || weight === '700') {
    return fontFamily.bold;
  }

  if (weight === '600') {
    return fontFamily.semibold;
  }

  if (weight === '500') {
    return fontFamily.medium;
  }

  if (weight === '300') {
    return fontFamily.light;
  }

  if (weight === '200') {
    return fontFamily.extraLight;
  }

  if (weight === '100') {
    return fontFamily.thin;
  }

  return fontFamily.regular;
}

type AppTextProps = PropsWithChildren<
  TextProps & {
    variant?: TextVariant;
    color?: string;
    weight?: TextStyle['fontWeight'];
    style?: StyleProp<TextStyle>;
  }
>;

export function AppText({
  children,
  variant = 'body',
  color,
  weight = '400',
  style,
  ...props
}: AppTextProps) {
  const { theme } = useAppTheme();

  return (
    <Text
      {...props}
      style={[
        {
          color: color ?? theme.colors.text,
          fontSize: theme.typography.size[variant],
          lineHeight: theme.typography.lineHeight[variant],
          fontFamily: fontFamilyForWeight(weight, theme.typography.fontFamily),
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
