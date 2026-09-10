import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { colors, radius, spacing } from '@/design/tokens';
import { useKareState } from '@/features/library/KareStateProvider';
import type {
  AttentionChoice,
  DurationChoice,
  Mood,
  RecommendationInput,
} from '@/features/movies/domain';
import { rankMovies } from '@/features/recommendation/engine';
import {
  discoverMovies,
  MovieDataError,
} from '@/features/tmdb/repository';

const moods: [Mood, string][] = [
  ['calm', 'Sakin'],
  ['fun', 'Eğlenceli'],
  ['dark', 'Karanlık'],
  ['romantic', 'Romantik'],
  ['tense', 'Gerilimli'],
  ['thoughtful', 'Düşündürücü'],
];
const durations: [DurationChoice, string][] = [
  ['short', 'Kısa'],
  ['normal', 'Normal'],
  ['long', 'Uzun'],
];
const attention: [AttentionChoice, string][] = [
  ['easy', 'Kolay'],
  ['medium', 'Orta'],
  ['intense', 'Yoğun'],
];

function Chips<T extends string>({
  values,
  selected,
  onSelect,
}: {
  values: [T, string][];
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.chips}>
      {values.map(([value, label]) => (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: value === selected }}
          key={value}
          onPress={() => onSelect(value)}
          style={[styles.chip, value === selected && styles.chipSelected]}
        >
          <AppText
            tone={value === selected ? 'primary' : 'secondary'}
            variant="label"
          >
            {label}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

export default function Recommend() {
  const {
    state,
    latest,
    setLatest,
    recordRecommendation,
    toggleWatchlist,
    markWatched,
  } = useKareState();
  const [mood, setMood] = useState<Mood>('thoughtful');
  const [duration, setDuration] = useState<DurationChoice>('normal');
  const [focus, setFocus] = useState<AttentionChoice>('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input: RecommendationInput = {
    mood,
    duration,
    attention: focus,
  };

  async function choose(alternate = false) {
    setLoading(true);
    setError(null);

    try {
      const movies = await discoverMovies(input);
      const previous = new Set(
        state.recommendations.map((record) => record.movieId),
      );
      if (alternate && latest) previous.add(latest.movie.tmdbId);

      const result = rankMovies(movies, input, state.library, previous)[0];
      if (!result) {
        throw new MovieDataError(
          'İzlediklerini eledikten sonra uygun film kalmadı.',
          'invalid-response',
        );
      }

      setLatest(result);
      recordRecommendation(result, input);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Beklenmeyen bir hata oluştu.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()}>
          <AppText tone="secondary">← Keşfet</AppText>
        </Pressable>
        <AppText variant="display">NE İZLESEM?</AppText>
        <AppText tone="secondary">Üç hızlı seçim. Tek, gerekçeli karar.</AppText>

        <AppText variant="heading">Bu akşam nasıl hissetsin?</AppText>
        <Chips values={moods} selected={mood} onSelect={setMood} />
        <AppText variant="heading">Ne kadar vaktin var?</AppText>
        <Chips
          values={durations}
          selected={duration}
          onSelect={setDuration}
        />
        <AppText variant="heading">Ne kadar odaklanmak istersin?</AppText>
        <Chips values={attention} selected={focus} onSelect={setFocus} />

        <Pressable
          disabled={loading}
          onPress={() => void choose()}
          style={styles.primary}
        >
          <AppText variant="label">
            {loading ? 'KARE seçiyor…' : 'Bana bir film seç'}
          </AppText>
        </Pressable>

        {error ? (
          <View style={styles.error}>
            <AppText>{error}</AppText>
            <Pressable onPress={() => void choose()}>
              <AppText tone="accent" variant="label">
                Tekrar dene
              </AppText>
            </Pressable>
          </View>
        ) : null}

        {latest ? (
          <View style={styles.result}>
            {latest.movie.posterUrl ? (
              <Image source={latest.movie.posterUrl} style={styles.poster} />
            ) : null}
            <View style={styles.copy}>
              <AppText variant="title">{latest.movie.title}</AppText>
              <AppText tone="secondary">
                {[
                  latest.movie.releaseYear,
                  latest.movie.runtimeMinutes &&
                    `${latest.movie.runtimeMinutes} dk`,
                  latest.movie.genres.slice(0, 2).join(' · '),
                ]
                  .filter(Boolean)
                  .join(' • ')}
              </AppText>
              <AppText variant="heading">Neden bunu seçtik?</AppText>
              <AppText tone="secondary">{latest.explanation}</AppText>
              <View style={styles.actions}>
                <Pressable
                  onPress={() =>
                    router.push(`/movie/${latest.movie.tmdbId}`)
                  }
                  style={styles.secondary}
                >
                  <AppText variant="label">Film detayını aç</AppText>
                </Pressable>
                <Pressable
                  onPress={() => toggleWatchlist(latest.movie)}
                  style={styles.secondary}
                >
                  <AppText variant="label">İzleyeceklerime ekle</AppText>
                </Pressable>
                <Pressable
                  onPress={() => markWatched(latest.movie)}
                  style={styles.secondary}
                >
                  <AppText variant="label">İzledim</AppText>
                </Pressable>
              </View>
              <Pressable onPress={() => void choose(true)}>
                <AppText tone="accent" variant="label">
                  Başka bir tane göster
                </AppText>
              </Pressable>
            </View>
          </View>
        ) : null}
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  primary: {
    backgroundColor: colors.accent,
    borderRadius: radius.control,
    padding: spacing.md,
    alignItems: 'center',
  },
  secondary: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.control,
    padding: spacing.sm,
    alignItems: 'center',
  },
  error: {
    gap: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.card,
  },
  result: {
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
  },
  poster: { width: '100%', aspectRatio: 2 / 3 },
  copy: { padding: spacing.md, gap: spacing.sm },
  actions: { gap: spacing.sm },
});
