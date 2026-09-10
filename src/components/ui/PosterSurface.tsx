import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, layout, radius, spacing } from '@/design/tokens';

type PosterSurfaceProps = {
  uri?: string | null;
  title: string;
};

export function PosterSurface({ uri, title }: PosterSurfaceProps) {
  if (!uri) {
    return (
      <View
        accessibilityLabel={`${title} posteri bulunamadı`}
        style={[styles.poster, styles.fallback]}
      >
        <AppText variant="caption" tone="secondary" style={styles.fallbackText}>
          Poster yok
        </AppText>
      </View>
    );
  }

  return (
    <Image
      accessibilityLabel={`${title} posteri`}
      contentFit="cover"
      source={{ uri }}
      style={styles.poster}
      transition={120}
    />
  );
}

const styles = StyleSheet.create({
  poster: {
    width: '100%',
    aspectRatio: layout.posterAspectRatio,
    borderRadius: radius.poster,
    backgroundColor: colors.surfaceSecondary,
    overflow: 'hidden',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fallbackText: {
    textAlign: 'center',
  },
});
