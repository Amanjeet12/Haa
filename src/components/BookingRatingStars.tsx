import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Star from 'lucide-react-native/icons/star';
import { AppText } from './AppText';
import { useAppTheme } from '../theme';

type Props = {
  rating: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
  label?: string;
};

export function BookingRatingStars({
  rating,
  onChange,
  disabled,
  label = 'Booking',
}: Props) {
  const { theme } = useAppTheme();
  return (
    <View>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map(value => (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${value} star${
              value === 1 ? '' : 's'
            }`}
            accessibilityState={{
              selected: rating === value,
              disabled: Boolean(disabled),
            }}
            disabled={disabled}
            onPress={() => onChange(value)}
            style={styles.star}
          >
            <Star
              size={30}
              color={rating >= value ? '#F5A623' : theme.colors.textMuted}
              fill={rating >= value ? '#F5A623' : 'transparent'}
            />
          </Pressable>
        ))}
      </View>
      <AppText color={theme.colors.textMuted} style={styles.hint}>
        {
          [
            'Tap a star to rate',
            'Poor',
            'Fair',
            'Good',
            'Very good',
            'Excellent',
          ][rating]
        }
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  stars: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  star: {
    flex: 1,
    maxWidth: 56,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { textAlign: 'center', fontSize: 11, lineHeight: 16, marginTop: 4 },
});
