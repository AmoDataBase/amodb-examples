// Only the fields this app reads. Responses follow the TMDB v3 shapes.

export type Paged<T> = { page: number; results: T[]; total_pages: number; total_results: number };

export type MediaItem = {
  id: number;
  media_type?: 'movie' | 'tv' | 'person';
  title?: string; // movies
  name?: string; // tv shows and people
  release_date?: string;
  first_air_date?: string;
  poster_path: string | null;
  vote_average?: number;
};

export type Genre = { id: number; name: string };
export type CastMember = { id: number; name: string; character?: string; profile_path: string | null };
export type Video = { id: string; name: string; site: string; key: string; type: string; official?: boolean };

// Each source is { value, votes } or null. The block exists only when amodb has data.
export type Ratings = Record<string, { value: number; votes: number } | null>;

type Extras = {
  credits?: { cast: CastMember[] };
  videos?: { results: Video[] };
  ratings?: Ratings | null;
};

export type MovieDetails = Extras & {
  id: number;
  title: string;
  tagline?: string;
  overview?: string;
  release_date?: string;
  runtime?: number | null;
  genres: Genre[];
  vote_average?: number;
  poster_path: string | null;
  backdrop_path: string | null;
  imdb_id?: string | null;
};

export type TvDetails = Extras & {
  id: number;
  name: string;
  tagline?: string;
  overview?: string;
  first_air_date?: string;
  episode_run_time?: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  genres: Genre[];
  vote_average?: number;
  poster_path: string | null;
  backdrop_path: string | null;
};
