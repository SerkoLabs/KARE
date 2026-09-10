export const colors = {
  background: '#101010',
  surface: '#181818',
  surfaceSecondary: '#212121',
  textPrimary: '#F3F0E8',
  textSecondary: '#A7A49E',
  accent: '#8E1F2D',
  accentPressed: '#741925',
  success: '#4F8A67',
  rating: '#D8B35A',
  border: '#2C2C2C',
  danger: '#B84A4A',
  overlay: 'rgba(0, 0, 0, 0.64)',
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  poster: 8,
  card: 12,
  control: 12,
  sheet: 24,
  pill: 999,
} as const;

export const layout = {
  screenPadding: 16,
  sectionGap: 32,
  posterAspectRatio: 2 / 3,
} as const;
