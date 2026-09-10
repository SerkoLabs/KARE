import { EMPTY_STATE, kareReducer, sanitizeState } from '../state';
import type { Movie, RankedMovie } from '../../movies/domain';

const movie: Movie = {
  tmdbId: 1,
  title: 'KARE',
  genres: ['Drama'],
  keywords: [],
  originCountries: [],
  cast: [],
};

const recommendation: RankedMovie = {
  movie,
  score: 42,
  evidence: [{ code: 'mood', label: 'düşündürücü yapısına', points: 18 }],
  explanation: 'Kanıta dayalı açıklama.',
};

test('upsert prevents duplicates and watched clears watchlist', () => {
  let state = kareReducer(EMPTY_STATE, {
    type: 'watchlist',
    movie,
    at: '2026-09-09T10:00:00Z',
  });
  state = kareReducer(state, {
    type: 'favorite',
    movie,
    at: '2026-09-09T10:01:00Z',
  });
  expect(state.library).toHaveLength(1);

  state = kareReducer(state, {
    type: 'watched',
    movie,
    at: '2026-09-09T10:02:00Z',
  });
  expect(state.library[0]).toMatchObject({
    watched: true,
    watchlist: false,
    favorite: true,
  });
});

test('latest recommendation survives sanitize and reopen', () => {
  const state = kareReducer(EMPTY_STATE, {
    type: 'latest',
    result: recommendation,
  });
  const reopened = sanitizeState(JSON.parse(JSON.stringify(state)));
  expect(reopened.latest).toEqual(recommendation);
});

test('invalid persistence payload fails closed', () => {
  expect(sanitizeState(null)).toEqual(EMPTY_STATE);
  expect(
    sanitizeState({
      version: 1,
      library: [{ movie: { tmdbId: 'bad' } }],
      recommendations: [{ movieId: 'bad' }],
      latest: { movie: { tmdbId: 'bad' } },
    }),
  ).toEqual(EMPTY_STATE);
});
