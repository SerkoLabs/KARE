import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { colors, radius, spacing } from '@/design/tokens';

export default function DiscoverScreen() {
  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <AppText tone="secondary">KARE</AppText>
          <AppText accessibilityRole="header" variant="title">
            Bu gece ne izlemek istiyorsun?
          </AppText>
        </View>

        <View style={styles.hero}>
          <AppText variant="display">NE İZLESEM?</AppText>
          <AppText tone="secondary">
            Ruh haline, zamanına ve zevkine göre az sayıda güçlü seçenek.
          </AppText>
          <Button
            disabled
            label="Bana bir film seç"
            onPress={() => undefined}
          />
          <AppText tone="secondary" variant="caption">
            Karar motoru gerçek veri ve açıklama sınırı hazır olduğunda etkinleşecek.
          </AppText>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText variant="heading">Senin için</AppText>
            <AppText tone="secondary" variant="caption">
              Henüz kişiselleştirme yok
            </AppText>
          </View>
          <View style={styles.emptyCard}>
            <AppText tone="secondary">
              Gerçek zevk sinyali oluşana kadar burada sahte öneri gösterilmiyor.
            </AppText>
          </View>
        </View>

        <Button
          label="Film ekleme menüsünü aç"
          onPress={() => router.push('/quick-add')}
          variant="secondary"
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    gap: spacing.xs,
  },
  hero: {
    gap: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  emptyCard: {
    minHeight: 112,
    justifyContent: 'center',
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
});
