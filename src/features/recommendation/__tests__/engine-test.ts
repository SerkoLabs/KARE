import { rankMovies } from '../engine';
import type { Movie, RecommendationInput } from '../../movies/domain';

const movie = (id: number, genres = ['Drama']): Movie => ({
  tmdbId: id,
  title: `Film ${id}`,
  overview: 'Özet',
  runtimeMinutes: 115,
  genres,
  keywords: [],
  originCountries: [],
  posterUrl: 'https://image.tmdb.org/t/p/w500/x.jpg',
  voteAverage: 8,
  voteCount: 1000,
  cast: [],
});

const input: RecommendationInput = {
  mood: 'thoughtful',
  duration: 'normal',
  attention: 'medium',
  context: 'alone',
};

test('ranking is deterministic with a stable tie break', () => {
  expect(rankMovies([movie(20), movie(10)], input, []).map((x) => x.movie.tmdbId)).toEqual([10, 20]);
  expect(rankMovies([movie(10), movie(20)], input, []).map((x) => x.movie.tmdbId)).toEqual([10, 20]);
});

test('watched titles are excluded', () => {
  const watched = movie(1);
  expect(
    rankMovies(
      [watched],
      input,
      [
        {
          movie: watched,
          watched: true,
          watchlist: false,
          favorite: false,
          updatedAt: 'x',
        },
      ],
    ),
  ).toHaveLength(0);
});

test('explanation comes from score evidence', () => {
  const result = rankMovies(
    [movie(1, ['Drama', 'Science Fiction'])],
    input,
    [],
  )[0]!;
  expect(result.evidence.some((item) => item.code === 'mood')).toBe(true);
  expect(result.explanation).toContain('düşündürücü yapısına');
  expect(result.explanation).not.toContain('AI');
});

test('a prior recommendation cannot repeat while a fresh eligible title exists', () => {
  const seenHighScore = movie(1, ['Drama', 'Science Fiction']);
  seenHighScore.voteAverage = 10;
  seenHighScore.voteCount = 100000;
  const freshLowerScore = movie(2, ['Comedy']);
  freshLowerScore.voteAverage = 6;
  freshLowerScore.voteCount = 100;

  const ranked = rankMovies(
    [seenHighScore, freshLowerScore],
    input,
    [],
    new Set([seenHighScore.tmdbId]),
  );

  expect(ranked[0]!.movie.tmdbId).toBe(freshLowerScore.tmdbId);
  expect(ranked[1]!.evidence).toContainEqual(
    expect.objectContaining({ code: 'history' }),
  );
});
