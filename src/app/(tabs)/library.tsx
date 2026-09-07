import { StyleSheet, View } from 'react-native';

import { MoviePosterGrid } from '@/components/movie/MoviePosterGrid';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { spacing } from '@/design/tokens';

export default function LibraryScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <AppText accessibilityRole="header" variant="title">
          Kütüphanem
        </AppText>
        <AppText tone="secondary">0 film</AppText>
      </View>
      <View style={styles.tabs}>
        <AppText tone="accent" variant="label">İzlediklerim</AppText>
        <AppText tone="secondary" variant="label">İzleyeceklerim</AppText>
        <AppText tone="secondary" variant="label">Favoriler</AppText>
      </View>
      <View style={styles.grid}>
        <MoviePosterGrid
          emptyMessage="İzlediğin ilk filmi gerçek arama akışı bağlandığında buraya ekleyebilirsin."
          emptyTitle="Kütüphanen henüz boş"
          items={[]}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.lg,
    gap: spacing.xs,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingVertical: spacing.lg,
  },
  grid: {
    flex: 1,
  },
});
