import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { StateView } from '@/components/ui/StateView';
import { spacing } from '@/design/tokens';

export default function ListsScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <AppText accessibilityRole="header" variant="title">
          Listelerim
        </AppText>
        <AppText tone="secondary">
          Kişisel film koleksiyonlarını burada düzenleyeceksin.
        </AppText>
      </View>
      <StateView
        title="Henüz listen yok"
        message="Liste oluşturma gerçek kullanıcı verisi bağlandığında etkinleşecek."
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.lg,
    gap: spacing.xs,
  },
});
