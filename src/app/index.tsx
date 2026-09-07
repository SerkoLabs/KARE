import { Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { StateView } from '@/components/ui/StateView';
import { spacing } from '@/design/tokens';
import { useAuthBootstrap } from '@/features/auth/bootstrap/AuthBootstrapProvider';

export default function BootstrapRoute() {
  const { status, configErrorMessage, enterDevelopmentPreview } =
    useAuthBootstrap();

  if (status === 'loading') {
    return (
      <Screen>
        <StateView
          kind="loading"
          title="KARE hazırlanıyor"
          message="Uygulama durumu güvenli şekilde kontrol ediliyor."
        />
      </Screen>
    );
  }

  if (status === 'config-error') {
    return (
      <Screen>
        <View style={styles.fill}>
          <StateView
            kind="error"
            title="Yapılandırma gerekli"
            message={configErrorMessage ?? 'Public uygulama yapılandırması eksik.'}
          />
          {typeof __DEV__ !== 'undefined' && __DEV__ ? (
            <View style={styles.previewAction}>
              <Button
                label="Geliştirici önizlemesini aç"
                onPress={enterDevelopmentPreview}
                variant="ghost"
              />
            </View>
          ) : null}
        </View>
      </Screen>
    );
  }

  if (status === 'preview-authenticated') {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  previewAction: {
    paddingBottom: spacing.xl,
  },
});
