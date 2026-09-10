import { discoverMovies, MovieDataError } from '../repository';
import type { RecommendationInput } from '../../movies/domain';

const input: RecommendationInput = {
  mood: 'thoughtful',
  duration: 'normal',
  attention: 'medium',
};

const validMovie = {
  id: 550,
  title: 'Fight Club',
  overview: 'Özet',
  runtime: 139,
  poster_path: '/poster.jpg',
  genres: [{ name: 'Drama' }],
  production_countries: [],
  vote_average: 8.4,
  vote_count: 30000,
};

const originalUrl = process.env.EXPO_PUBLIC_KARE_API_URL;
const originalFetch = globalThis.fetch;

afterEach(() => {
  process.env.EXPO_PUBLIC_KARE_API_URL = originalUrl;
  globalThis.fetch = originalFetch;
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('fails explicitly when the API boundary is not configured', async () => {
  delete process.env.EXPO_PUBLIC_KARE_API_URL;
  await expect(discoverMovies(input)).rejects.toMatchObject({
    code: 'configuration',
  });
});

test('maps a valid normalized provider response', async () => {
  process.env.EXPO_PUBLIC_KARE_API_URL = 'https://api.example.test/';
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ movies: [validMovie] }),
  });

  await expect(discoverMovies(input)).resolves.toEqual([
    expect.objectContaining({ tmdbId: 550, title: 'Fight Club' }),
  ]);
  expect(globalThis.fetch).toHaveBeenCalledWith(
    expect.stringContaining('https://api.example.test/tmdb-discover?'),
    expect.objectContaining({ headers: { Accept: 'application/json' } }),
  );
});

test('retries one transient provider failure then succeeds', async () => {
  jest.useFakeTimers();
  process.env.EXPO_PUBLIC_KARE_API_URL = 'https://api.example.test';
  globalThis.fetch = jest
    .fn()
    .mockResolvedValueOnce({ ok: false, status: 503 })
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ movies: [validMovie] }),
    });

  const request = discoverMovies(input);
  const assertion = expect(request).resolves.toHaveLength(1);
  await jest.advanceTimersByTimeAsync(200);
  await assertion;
  expect(globalThis.fetch).toHaveBeenCalledTimes(2);
});

test('reports an upstream error after bounded 429 retries', async () => {
  jest.useFakeTimers();
  process.env.EXPO_PUBLIC_KARE_API_URL = 'https://api.example.test';
  globalThis.fetch = jest.fn().mockResolvedValue({ ok: false, status: 429 });

  const request = discoverMovies(input);
  const assertion = expect(request).rejects.toEqual(
    expect.objectContaining<Partial<MovieDataError>>({ code: 'upstream' }),
  );
  await jest.advanceTimersByTimeAsync(200);
  await assertion;
  expect(globalThis.fetch).toHaveBeenCalledTimes(2);
});

test('distinguishes malformed JSON and empty responses', async () => {
  process.env.EXPO_PUBLIC_KARE_API_URL = 'https://api.example.test';
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => {
      throw new SyntaxError('bad json');
    },
  });
  await expect(discoverMovies(input)).rejects.toMatchObject({
    code: 'invalid-response',
  });

  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ movies: [] }),
  });
  await expect(discoverMovies(input)).rejects.toMatchObject({
    code: 'invalid-response',
  });
});
