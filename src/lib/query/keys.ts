export const queryKeys = {
  movie: {
    all: ['movie'] as const,
    detail: (movieId: string) => ['movie', 'detail', movieId] as const,
    search: (query: string) => ['movie', 'search', query] as const,
  },
  library: {
    all: ['library'] as const,
    owner: (userId: string) => ['library', userId] as const,
  },
  profile: {
    all: ['profile'] as const,
    owner: (userId: string) => ['profile', userId] as const,
  },
  recommendation: {
    all: ['recommendation'] as const,
    run: (runId: string) => ['recommendation', 'run', runId] as const,
  },
} as const;
