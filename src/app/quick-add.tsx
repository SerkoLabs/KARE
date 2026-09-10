import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { colors, radius, spacing } from '@/design/tokens';

const plannedActions = [
  ['Film ara', 'Gerçek TMDB araması ilk dikey dilimde bağlanacak.'],
  ['İzlediğim filmi ekle', 'Film seçimi ve kalıcı kütüphane durumu henüz bağlı değil.'],
  ['İzleme listeme ekle', 'Kalıcı watchlist davranışı Supabase RLS ile birlikte gelecek.'],
  ['Yeni liste oluştur', 'Kişisel liste yazma akışı veri katmanından sonra etkinleşecek.'],
] as const;

export default function QuickAddScreen() {
  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <AppText accessibilityRole="header" variant="title">
            Hızlı ekle
          </AppText>
          <AppText tone="secondary">
            Bu menü gerçek olmayan kayıt yapmaz; veri sınırları bağlandıkça seçenekler etkinleşir.
          </AppText>
        </View>

        <View style={styles.actions}>
          {plannedActions.map(([title, detail]) => (
            <View key={title} style={styles.actionCard}>
              <AppText variant="heading">{title}</AppText>
              <AppText tone="secondary" variant="caption">
                {detail}
              </AppText>
            </View>
          ))}
        </View>

        <Button label="Kapat" onPress={() => router.back()} variant="secondary" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  header: {
    gap: spacing.xs,
  },
  actions: {
    gap: spacing.sm,
  },
  actionCard: {
    gap: spacing.xs,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    opacity: 0.72,
  },
});
