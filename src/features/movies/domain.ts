export type Mood =
  | 'calm'
  | 'fun'
  | 'dark'
  | 'romantic'
  | 'tense'
  | 'thoughtful';
export type DurationChoice = 'short' | 'normal' | 'long';
export type AttentionChoice = 'easy' | 'medium' | 'intense';
export type WatchContext = 'alone' | 'couple' | 'group';

export type RecommendationInput = {
  mood: Mood;
  duration: DurationChoice;
  attention: AttentionChoice;
  context?: WatchContext | undefined;
};

export type Movie = {
  tmdbId: number;
  title: string;
  originalTitle?: string | undefined;
  overview?: string | undefined;
  releaseYear?: number | undefined;
  runtimeMinutes?: number | undefined;
  genres: string[];
  keywords: string[];
  originalLanguage?: string | undefined;
  originCountries: string[];
  posterUrl?: string | undefined;
  backdropUrl?: string | undefined;
  voteAverage?: number | undefined;
  voteCount?: number | undefined;
  popularity?: number | undefined;
  director?: string | undefined;
  cast: string[];
};

export type ScoreEvidence = {
  code:
    | 'mood'
    | 'duration'
    | 'attention'
    | 'context'
    | 'taste'
    | 'quality'
    | 'history';
  label: string;
  points: number;
};

export type RankedMovie = {
  movie: Movie;
  score: number;
  evidence: ScoreEvidence[];
  explanation: string;
};

export type LibraryEntry = {
  movie: Movie;
  watchlist: boolean;
  watched: boolean;
  favorite: boolean;
  rating?: number | undefined;
  updatedAt: string;
};

export type RecommendationRecord = {
  movieId: number;
  input: RecommendationInput;
  score: number;
  explanation: string;
  recommendedAt: string;
};

export type PersistedKareState = {
  version: 1;
  library: LibraryEntry[];
  recommendations: RecommendationRecord[];
  latest?: RankedMovie | null | undefined;
};
