import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type PropsWithChildren,
} from 'react';
import type {
  Movie,
  PersistedKareState,
  RankedMovie,
  RecommendationInput,
} from '../movies/domain';
import { EMPTY_STATE, kareReducer, sanitizeState } from './state';

const STORAGE_KEY = '@kare/state/v1';

type Value = {
  state: PersistedKareState;
  hydrated: boolean;
  persistenceError: string | null;
  latest: RankedMovie | null;
  setLatest: (value: RankedMovie) => void;
  toggleWatchlist: (movie: Movie) => void;
  markWatched: (movie: Movie) => void;
  toggleFavorite: (movie: Movie) => void;
  recordRecommendation: (
    result: RankedMovie,
    input: RecommendationInput,
  ) => void;
};

const KareStateContext = createContext<Value | null>(null);

export function KareStateProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(kareReducer, EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        dispatch({ type: 'hydrate', state: sanitizeState(JSON.parse(raw)) });
      })
      .catch(() => {
        setPersistenceError(
          'Cihazdaki KARE arşivi okunamadı. Yeni değişiklikler kaydedilmeyebilir.',
        );
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      .then(() => setPersistenceError(null))
      .catch(() => {
        setPersistenceError(
          'Değişiklik cihazına kaydedilemedi. Tekrar denemeden uygulamayı kapatma.',
        );
      });
  }, [hydrated, state]);

  const setLatest = useCallback(
    (result: RankedMovie) => dispatch({ type: 'latest', result }),
    [],
  );
  const toggleWatchlist = useCallback(
    (movie: Movie) =>
      dispatch({ type: 'watchlist', movie, at: new Date().toISOString() }),
    [],
  );
  const markWatched = useCallback(
    (movie: Movie) =>
      dispatch({ type: 'watched', movie, at: new Date().toISOString() }),
    [],
  );
  const toggleFavorite = useCallback(
    (movie: Movie) =>
      dispatch({ type: 'favorite', movie, at: new Date().toISOString() }),
    [],
  );
  const recordRecommendation = useCallback(
    (result: RankedMovie, input: RecommendationInput) =>
      dispatch({
        type: 'recommendation',
        record: {
          movieId: result.movie.tmdbId,
          input,
          score: result.score,
          explanation: result.explanation,
          recommendedAt: new Date().toISOString(),
        },
      }),
    [],
  );

  const value = useMemo(
    () => ({
      state,
      hydrated,
      persistenceError,
      latest: state.latest ?? null,
      setLatest,
      toggleWatchlist,
      markWatched,
      toggleFavorite,
      recordRecommendation,
    }),
    [
      state,
      hydrated,
      persistenceError,
      setLatest,
      toggleWatchlist,
      markWatched,
      toggleFavorite,
      recordRecommendation,
    ],
  );

  return (
    <KareStateContext.Provider value={value}>
      {children}
    </KareStateContext.Provider>
  );
}

export function useKareState() {
  const value = useContext(KareStateContext);
  if (!value) {
    throw new Error('useKareState must be inside KareStateProvider');
  }
  return value;
}
