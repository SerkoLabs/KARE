import type {
  LibraryEntry,
  Movie,
  RankedMovie,
  RecommendationInput,
  ScoreEvidence,
} from '../movies/domain';

const moodRules: Record<
  RecommendationInput['mood'],
  { genres: string[]; keywords: string[]; label: string }
> = {
  calm: {
    genres: ['Drama', 'Animation', 'Documentary'],
    keywords: ['gentle', 'slice of life', 'meditative'],
    label: 'sakin tonuna',
  },
  fun: {
    genres: ['Comedy', 'Adventure', 'Animation'],
    keywords: ['feel-good', 'buddy', 'family'],
    label: 'eğlenceli ritmine',
  },
  dark: {
    genres: ['Crime', 'Horror', 'Thriller'],
    keywords: ['noir', 'psychological', 'mystery'],
    label: 'karanlık atmosferine',
  },
  romantic: {
    genres: ['Romance', 'Drama', 'Comedy'],
    keywords: ['relationship', 'love'],
    label: 'romantik tonuna',
  },
  tense: {
    genres: ['Thriller', 'Crime', 'Mystery', 'Action'],
    keywords: ['suspense', 'survival'],
    label: 'gerilim beklentine',
  },
  thoughtful: {
    genres: ['Drama', 'Science Fiction', 'Documentary'],
    keywords: ['philosophy', 'identity', 'society'],
    label: 'düşündürücü yapısına',
  },
};

const durationRange: Record<
  RecommendationInput['duration'],
  [number, number]
> = {
  short: [1, 105],
  normal: [90, 145],
  long: [120, 260],
};

const attentionRules: Record<
  RecommendationInput['attention'],
  { genres: string[]; label: string }
> = {
  easy: {
    genres: ['Comedy', 'Adventure', 'Animation', 'Romance'],
    label: 'kolay takip edilen anlatımına',
  },
  medium: {
    genres: ['Drama', 'Crime', 'Thriller', 'Adventure'],
    label: 'dengeli anlatım yoğunluğuna',
  },
  intense: {
    genres: ['Drama', 'Mystery', 'Science Fiction', 'History'],
    label: 'yoğun anlatımına',
  },
};

const contextRules = {
  alone: {
    genres: ['Drama', 'Horror', 'Documentary', 'Mystery'],
    label: 'tek başına izlemeye uygun oluşuna',
  },
  couple: {
    genres: ['Romance', 'Drama', 'Comedy', 'Thriller'],
    label: 'birlikte izlemeye uygun tonuna',
  },
  group: {
    genres: ['Comedy', 'Adventure', 'Action', 'Animation'],
    label: 'grup izlemeye uygun ritmine',
  },
} as const;

function overlap(values: string[], expected: readonly string[]) {
  const set = new Set(values.map((value) => value.toLowerCase()));
  return expected.filter((value) => set.has(value.toLowerCase())).length;
}

export function isEligible(
  movie: Movie,
  input: RecommendationInput,
  watched: ReadonlySet<number>,
) {
  if (
    watched.has(movie.tmdbId) ||
    !movie.title ||
    !movie.overview ||
    !movie.posterUrl ||
    (movie.voteCount ?? 0) < 80
  ) {
    return false;
  }

  const [minimum, maximum] = durationRange[input.duration];
  return movie.runtimeMinutes == null
    ? input.duration === 'normal'
    : movie.runtimeMinutes >= minimum && movie.runtimeMinutes <= maximum;
}

function quality(movie: Movie) {
  const rating = Math.max(0, Math.min(10, movie.voteAverage ?? 0));
  const confidence = Math.min(
    1,
    Math.log10(Math.max(10, movie.voteCount ?? 0)) / 4,
  );
  return Math.round(rating * confidence * 2);
}

export function scoreMovie(
  movie: Movie,
  input: RecommendationInput,
  library: LibraryEntry[],
): RankedMovie {
  const evidence: ScoreEvidence[] = [];
  const mood = moodRules[input.mood];
  const moodHits =
    overlap(movie.genres, mood.genres) +
    overlap(movie.keywords, mood.keywords);

  if (moodHits) {
    evidence.push({
      code: 'mood',
      label: mood.label,
      points: Math.min(32, 18 + (moodHits - 1) * 7),
    });
  }

  if (movie.runtimeMinutes != null) {
    const target =
      input.duration === 'short'
        ? 95
        : input.duration === 'normal'
          ? 120
          : 165;
    evidence.push({
      code: 'duration',
      label: `${movie.runtimeMinutes} dakikalık süresine`,
      points: Math.max(
        4,
        18 - Math.round(Math.abs(movie.runtimeMinutes - target) / 10),
      ),
    });
  }

  const attention = attentionRules[input.attention];
  if (overlap(movie.genres, attention.genres)) {
    evidence.push({
      code: 'attention',
      label: attention.label,
      points: 11,
    });
  }

  if (input.context) {
    const context = contextRules[input.context];
    if (overlap(movie.genres, context.genres)) {
      evidence.push({ code: 'context', label: context.label, points: 7 });
    }
  }

  const favorites = library
    .filter((entry) => entry.favorite || (entry.rating ?? 0) >= 4)
    .flatMap((entry) => entry.movie.genres);
  const taste = overlap(movie.genres, favorites);
  if (taste) {
    evidence.push({
      code: 'taste',
      label: 'kütüphanendeki beğendiğin türlerle kesişmesine',
      points: Math.min(15, taste * 5),
    });
  }

  const qualityPoints = quality(movie);
  if (qualityPoints) {
    evidence.push({
      code: 'quality',
      label: 'izleyici puanı ve oy güvenine',
      points: qualityPoints,
    });
  }

  const score = evidence.reduce((sum, item) => sum + item.points, 0);
  const reasons = evidence
    .filter((item) => item.code !== 'quality')
    .sort((left, right) => right.points - left.points)
    .slice(0, 3)
    .map((item) => item.label);

  return {
    movie,
    score,
    evidence,
    explanation: reasons.length
      ? `Bu filmi ${reasons.join(', ')} göre seçtik. Puan ve oy sayısı yalnızca güven sinyali olarak kullanıldı.`
      : 'Bu film süre uygunluğu ile yeterli puan ve oy güvenini birlikte sağladığı için seçildi.',
  };
}

export function rankMovies(
  movies: Movie[],
  input: RecommendationInput,
  library: LibraryEntry[],
  previous: ReadonlySet<number> = new Set(),
) {
  const watched = new Set(
    library
      .filter((entry) => entry.watched)
      .map((entry) => entry.movie.tmdbId),
  );

  return movies
    .filter((movie) => isEligible(movie, input, watched))
    .map((movie) => {
      const ranked = scoreMovie(movie, input, library);
      return previous.has(movie.tmdbId)
        ? {
            ...ranked,
            score: ranked.score - 24,
            evidence: [
              ...ranked.evidence,
              {
                code: 'history' as const,
                label: 'yakın zamanda gösterilmiş olmasına',
                points: -24,
              },
            ],
          }
        : ranked;
    })
    .sort((left, right) => {
      const leftSeen = previous.has(left.movie.tmdbId);
      const rightSeen = previous.has(right.movie.tmdbId);
      if (leftSeen !== rightSeen) return leftSeen ? 1 : -1;
      return (
        right.score - left.score ||
        (right.movie.voteCount ?? 0) - (left.movie.voteCount ?? 0) ||
        left.movie.tmdbId - right.movie.tmdbId
      );
    });
}
