import type { PropsWithChildren } from 'react';
import { Text, type TextProps } from 'react-native';

import { colors } from '@/design/tokens';
import { typography } from '@/design/typography';

type TextVariant = keyof typeof typography;

type AppTextProps = PropsWithChildren<
  TextProps & {
    variant?: TextVariant;
    tone?: 'primary' | 'secondary' | 'accent' | 'rating' | 'danger';
  }
>;

const toneColor = {
  primary: colors.textPrimary,
  secondary: colors.textSecondary,
  accent: colors.accent,
  rating: colors.rating,
  danger: colors.danger,
} as const;

export function AppText({
  children,
  variant = 'body',
  tone = 'primary',
  style,
  ...props
}: AppTextProps) {
  return (
    <Text
      {...props}
      style={[typography[variant], { color: toneColor[tone] }, style]}
    >
      {children}
    </Text>
  );
}
