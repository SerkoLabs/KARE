import { router } from 'expo-router';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing } from '@/design/tokens';
import { useAuthBootstrap } from '@/features/auth/bootstrap/AuthBootstrapProvider';

export default function SignInScreen() {
  const { enterDevelopmentPreview } = useAuthBootstrap();

  const openPreview = () => {
    enterDevelopmentPreview();
    router.replace('/');
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <AppText variant="display">KARE</AppText>
          <AppText variant="title">Sinemana dön.</AppText>
          <AppText tone="secondary">
            İzlediklerini biriktir, listelerini düzenle ve yeni filmler keşfet.
          </AppText>
        </View>

        <View style={styles.form}>
          <TextInput
            accessibilityLabel="E-posta"
            autoCapitalize="none"
            autoComplete="email"
            editable={false}
            keyboardType="email-address"
            placeholder="E-posta"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />
          <TextInput
            accessibilityLabel="Şifre"
            editable={false}
            placeholder="Şifre"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            style={styles.input}
          />
          <Button disabled label="Giriş yap" onPress={() => undefined} />
        </View>

        {typeof __DEV__ !== 'undefined' && __DEV__ ? (
          <>
            <AppText variant="caption" tone="secondary" style={styles.center}>
              Geliştirme notu: gerçek Supabase oturumu Phase 2'de bağlanacak; bu buton yalnızca kabuk önizlemesidir.
            </AppText>
            <Button
              label="Geliştirici uygulama önizlemesi"
              onPress={openPreview}
              variant="secondary"
            />
          </>
        ) : null}

        <Button
          label="Yeni hesap ekranı"
          onPress={() => router.push('/(auth)/sign-up')}
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
  header: {
    gap: spacing.xs,
  },
  form: {
    gap: spacing.sm,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  center: {
    textAlign: 'center',
  },
});
