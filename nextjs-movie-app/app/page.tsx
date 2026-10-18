import { ErrorNotice } from '@/components/ErrorNotice';
import { MediaGrid } from '@/components/MediaGrid';
import { SearchForm } from '@/components/SearchForm';
import { amodb, errorMessage } from '@/lib/amodb';
import type { MediaItem, Paged } from '@/lib/types';

// Render on every request so the build does not need network access or a key.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let movies: MediaItem[] = [];
  let error: string | null = null;
  try {
    movies = (await amodb<Paged<MediaItem>>('/trending/movie/week')).results;
  } catch (e) {
    error = errorMessage(e);
  }

  return (
    <>
      <section className="intro">
        <h1>Trending movies this week</h1>
        <SearchForm />
      </section>
      {error ? <ErrorNotice message={error} /> : <MediaGrid items={movies} type="movie" />}
    </>
  );
}
