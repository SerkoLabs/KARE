import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing } from '@/design/tokens';
import { tryParsePublicEnv } from '@/lib/env';

export default function FoundationScreen() {
  const config = tryParsePublicEnv();

  return (
    <Screen>
      <View style={styles.container}>
        <View accessibilityElementsHidden style={styles.frame}>
          <View style={styles.frameInner} />
        </View>
        <AppText accessibilityRole="header" variant="display" style={styles.brand}>
          KARE
        </AppText>
        <AppText tone="secondary" style={styles.tagline}>
          Filmlerini biriktir. Sinemayı keşfet.
        </AppText>
        {!config.ok ? (
          <View accessibilityRole="alert" style={styles.configNotice}>
            <AppText variant="caption" tone="secondary" style={styles.configText}>
              Geliştirme yapılandırması bekleniyor. Uygulama public Supabase
              değişkenleri eklenene kadar güvenli yapılandırma modunda çalışıyor.
            </AppText>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  frame: {
    width: 72,
    height: 72,
    borderWidth: 10,
    borderColor: colors.accent,
    marginBottom: spacing.md,
  },
  frameInner: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.background,
  },
  brand: {
    letterSpacing: 8,
  },
  tagline: {
    textAlign: 'center',
  },
  configNotice: {
    marginTop: spacing.xl,
    maxWidth: 320,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  configText: {
    textAlign: 'center',
  },
});
