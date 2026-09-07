import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { colors, radius, spacing } from '@/design/tokens';
import { useAuthBootstrap } from '@/features/auth/bootstrap/AuthBootstrapProvider';

export default function ProfileScreen() {
  const { status, leaveDevelopmentPreview } = useAuthBootstrap();

  const closePreview = () => {
    leaveDevelopmentPreview();
    router.replace('/');
  };

  return (
    <Screen>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatar} accessibilityLabel="Profil görseli yer tutucusu" />
          <View style={styles.identity}>
            <AppText accessibilityRole="header" variant="title">
              Profil
            </AppText>
            <AppText tone="secondary">Kişisel sinema özetin</AppText>
          </View>
        </View>

        <View style={styles.stats}>
          <Stat value="0" label="Film" />
          <Stat value="0" label="Favori" />
          <Stat value="0" label="Not" />
        </View>

        <View style={styles.panel}>
          <AppText variant="heading">2026</AppText>
          <AppText tone="secondary">
            Gerçek izleme verisi oluştuğunda yıl özeti burada hesaplanacak.
          </AppText>
        </View>

        {typeof __DEV__ !== 'undefined' && __DEV__ && status === 'preview-authenticated' ? (
          <Button
            label="Geliştirici önizlemesinden çık"
            onPress={closePreview}
            variant="ghost"
          />
        ) : null}
      </View>
    </Screen>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <AppText variant="heading">{value}</AppText>
      <AppText tone="secondary" variant="caption">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: spacing.xl,
    paddingTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  identity: {
    flex: 1,
    gap: spacing.xs,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  panel: {
    gap: spacing.xs,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
});
