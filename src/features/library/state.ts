import type {
  LibraryEntry,
  Movie,
  PersistedKareState,
  RankedMovie,
  RecommendationRecord,
} from '../movies/domain';

export const EMPTY_STATE: PersistedKareState = {
  version: 1,
  library: [],
  recommendations: [],
  latest: null,
};

export type LibraryAction =
  | { type: 'hydrate'; state: PersistedKareState }
  | {
      type: 'watchlist' | 'watched' | 'favorite';
      movie: Movie;
      at: string;
    }
  | { type: 'recommendation'; record: RecommendationRecord }
  | { type: 'latest'; result: RankedMovie };

function current(
  state: PersistedKareState,
  movie: Movie,
  at: string,
): LibraryEntry {
  return (
    state.library.find((entry) => entry.movie.tmdbId === movie.tmdbId) ?? {
      movie,
      watchlist: false,
      watched: false,
      favorite: false,
      updatedAt: at,
    }
  );
}

function replace(
  state: PersistedKareState,
  entry: LibraryEntry,
): PersistedKareState {
  return {
    ...state,
    library: [
      ...state.library.filter(
        (item) => item.movie.tmdbId !== entry.movie.tmdbId,
      ),
      entry,
    ].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
  };
}

function isMovie(value: unknown): value is Movie {
  if (!value || typeof value !== 'object') return false;
  const movie = value as Partial<Movie>;
  return (
    Number.isInteger(movie.tmdbId) &&
    typeof movie.title === 'string' &&
    Array.isArray(movie.genres) &&
    Array.isArray(movie.keywords) &&
    Array.isArray(movie.originCountries) &&
    Array.isArray(movie.cast)
  );
}

function isLatest(value: unknown): value is RankedMovie {
  if (!value || typeof value !== 'object') return false;
  const latest = value as Partial<RankedMovie>;
  return (
    isMovie(latest.movie) &&
    typeof latest.score === 'number' &&
    Array.isArray(latest.evidence) &&
    typeof latest.explanation === 'string'
  );
}

export function sanitizeState(value: unknown): PersistedKareState {
  if (!value || typeof value !== 'object') return EMPTY_STATE;
  const candidate = value as Partial<PersistedKareState>;
  if (
    candidate.version !== 1 ||
    !Array.isArray(candidate.library) ||
    !Array.isArray(candidate.recommendations)
  ) {
    return EMPTY_STATE;
  }

  const library = new Map<number, LibraryEntry>();
  for (const entry of candidate.library) {
    if (
      entry &&
      isMovie(entry.movie) &&
      typeof entry.watchlist === 'boolean' &&
      typeof entry.watched === 'boolean' &&
      typeof entry.favorite === 'boolean' &&
      typeof entry.updatedAt === 'string'
    ) {
      library.set(entry.movie.tmdbId, entry);
    }
  }

  const recommendations = candidate.recommendations
    .filter(
      (record) =>
        record &&
        Number.isInteger(record.movieId) &&
        typeof record.score === 'number' &&
        typeof record.explanation === 'string' &&
        typeof record.recommendedAt === 'string' &&
        record.input &&
        typeof record.input === 'object',
    )
    .slice(0, 50);

  return {
    version: 1,
    library: [...library.values()],
    recommendations,
    latest: isLatest(candidate.latest) ? candidate.latest : null,
  };
}

export function kareReducer(
  state: PersistedKareState,
  action: LibraryAction,
): PersistedKareState {
  if (action.type === 'hydrate') return sanitizeState(action.state);
  if (action.type === 'latest') return { ...state, latest: action.result };
  if (action.type === 'recommendation') {
    return {
      ...state,
      recommendations: [action.record, ...state.recommendations].slice(0, 50),
    };
  }

  const entry = current(state, action.movie, action.at);
  if (action.type === 'watchlist') {
    return replace(state, {
      ...entry,
      movie: action.movie,
      watchlist: !entry.watchlist,
      updatedAt: action.at,
    });
  }
  if (action.type === 'watched') {
    return replace(state, {
      ...entry,
      movie: action.movie,
      watched: true,
      watchlist: false,
      updatedAt: action.at,
    });
  }
  return replace(state, {
    ...entry,
    movie: action.movie,
    favorite: !entry.favorite,
    updatedAt: action.at,
  });
}
