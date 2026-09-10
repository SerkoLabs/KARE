import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { spacing } from '@/design/tokens';

export default function TasteOnboardingScreen() {
  return (
    <Screen>
      <View style={styles.container}>
        <AppText accessibilityRole="header" variant="title">
          Sinemanı biraz tanıyalım.
        </AppText>
        <AppText tone="secondary">
          Film seçimleri gerçek movie cache ve kullanıcı hesabı bağlandıktan sonra burada kaydedilecek.
        </AppText>
        <Button
          label="Şimdilik geri dön"
          onPress={() => router.replace('/')}
          variant="ghost"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
  },
});
