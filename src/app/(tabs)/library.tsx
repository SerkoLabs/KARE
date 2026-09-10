import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { colors, radius, spacing } from '@/design/tokens';
import { useKareState } from '@/features/library/KareStateProvider';

type Filter = 'watched' | 'watchlist' | 'favorite';
const filters: [Filter, string][] = [
  ['watched', 'İzlediklerim'],
  ['watchlist', 'İzleyeceklerim'],
  ['favorite', 'Favoriler'],
];

export default function LibraryScreen() {
  const { state, hydrated, persistenceError } = useKareState();
  const [filter, setFilter] = useState<Filter>('watchlist');
  const entries = state.library.filter((entry) => entry[filter]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText accessibilityRole="header" variant="title">
          Kütüphanem
        </AppText>
        <AppText tone="secondary">
          {state.library.length} benzersiz film · bu cihazda saklanır
        </AppText>
        {persistenceError ? (
          <View style={styles.warning} accessibilityRole="alert">
            <AppText>{persistenceError}</AppText>
          </View>
        ) : null}
        <View style={styles.tabs}>
          {filters.map(([key, label]) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: filter === key }}
              key={key}
              onPress={() => setFilter(key)}
              style={[styles.tab, filter === key && styles.active]}
            >
              <AppText
                tone={filter === key ? 'primary' : 'secondary'}
                variant="label"
              >
                {label}
              </AppText>
            </Pressable>
          ))}
        </View>
        {!hydrated ? (
          <AppText tone="secondary">Kütüphane açılıyor…</AppText>
        ) : !entries.length ? (
          <View style={styles.empty}>
            <AppText variant="heading">Bu raf henüz boş</AppText>
            <AppText tone="secondary">
              Ne İzlesem? kararından sonra film burada kalıcı olarak görünür.
            </AppText>
          </View>
        ) : (
          <View style={styles.grid}>
            {entries.map(({ movie: entryMovie }) => (
              <View key={entryMovie.tmdbId} style={styles.card}>
                {entryMovie.posterUrl ? (
                  <Image source={entryMovie.posterUrl} style={styles.poster} />
                ) : (
                  <View style={[styles.poster, styles.missing]} />
                )}
                <AppText variant="label" numberOfLines={2}>
                  {entryMovie.title}
                </AppText>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tab: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  active: { backgroundColor: colors.accent, borderColor: colors.accent },
  warning: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.control,
  },
  empty: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    gap: spacing.xs,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  card: { width: '47%', gap: spacing.xs },
  poster: { width: '100%', aspectRatio: 2 / 3, borderRadius: radius.poster },
  missing: { backgroundColor: colors.surfaceSecondary },
});
