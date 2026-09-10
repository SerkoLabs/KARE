import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, spacing } from '@/design/tokens';

export function OfflineBanner() {
  return (
    <View accessibilityRole="alert" style={styles.container}>
      <AppText variant="caption">
        Çevrimdışısın. Kaydedilmiş içerikler görüntülenebilir; değişiklikler şu anda kaydedilmez.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
