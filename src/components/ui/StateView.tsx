import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { colors, spacing } from '@/design/tokens';

type StateViewProps = {
  title: string;
  message?: string | undefined;
  kind?: 'loading' | 'empty' | 'error';
  retryLabel?: string;
  onRetry?: (() => void) | undefined;
};

export function StateView({
  title,
  message,
  kind = 'empty',
  retryLabel = 'Tekrar dene',
  onRetry,
}: StateViewProps) {
  return (
    <View
      accessibilityRole={kind === 'error' ? 'alert' : undefined}
      style={styles.container}
    >
      {kind === 'loading' ? (
        <ActivityIndicator
          accessibilityLabel="Yükleniyor"
          color={colors.accent}
          size="small"
        />
      ) : null}
      <AppText variant="heading">{title}</AppText>
      {message ? (
        <AppText variant="body" tone="secondary" style={styles.message}>
          {message}
        </AppText>
      ) : null}
      {kind === 'error' && onRetry ? (
        <View style={styles.action}>
          <Button label={retryLabel} onPress={onRetry} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  message: {
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.xs,
    minWidth: 160,
  },
});
