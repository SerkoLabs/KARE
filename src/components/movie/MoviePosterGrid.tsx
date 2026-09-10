import { FlatList, StyleSheet, View } from 'react-native';

import { MoviePosterCard, type MoviePosterItem } from '@/components/movie/MoviePosterCard';
import { StateView } from '@/components/ui/StateView';
import { spacing } from '@/design/tokens';

type MoviePosterGridProps = {
  items: MoviePosterItem[];
  emptyTitle: string;
  emptyMessage?: string | undefined;
  onPressMovie?: ((movieId: string) => void) | undefined;
};

export function MoviePosterGrid({
  items,
  emptyTitle,
  emptyMessage,
  onPressMovie,
}: MoviePosterGridProps) {
  if (items.length === 0) {
    return (
      <StateView
        title={emptyTitle}
        {...(emptyMessage ? { message: emptyMessage } : {})}
        kind="empty"
      />
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(item) => item.id}
      numColumns={3}
      renderItem={({ item }) => (
        <View style={styles.cell}>
          <MoviePosterCard
            movie={item}
            {...(onPressMovie ? { onPress: onPressMovie } : {})}
          />
        </View>
      )}
      removeClippedSubviews
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: spacing.md,
  },
  cell: {
    flex: 1 / 3,
    paddingHorizontal: spacing.xs / 2,
    paddingBottom: spacing.lg,
  },
});
