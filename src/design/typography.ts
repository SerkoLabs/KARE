import type { TextStyle } from 'react-native';

export const typography = {
  display: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '600',
    letterSpacing: 0.2,
  } satisfies TextStyle,
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
  } satisfies TextStyle,
  heading: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  } satisfies TextStyle,
  body: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '400',
  } satisfies TextStyle,
  label: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  } satisfies TextStyle,
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  } satisfies TextStyle,
} as const;
