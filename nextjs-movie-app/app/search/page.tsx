import { ErrorNotice } from '@/components/ErrorNotice';
import { MediaGrid } from '@/components/MediaGrid';
import { SearchForm } from '@/components/SearchForm';
import { amodb, errorMessage } from '@/lib/amodb';
import type { MediaItem, Paged } from '@/lib/types';

export const dynamic = 'force-dynamic';

// In Next.js 15, searchParams is a promise.
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? '').trim();

  let results: MediaItem[] = [];
  let error: string | null = null;
  if (q) {
    try {
      results = (await amodb<Paged<MediaItem>>('/search/multi', { query: q, include_adult: false })).results;
    } catch (e) {
      error = errorMessage(e);
    }
  }

  return (
    <>
      <section className="intro">
        <h1>{q ? `Results for "${q}"` : 'Search'}</h1>
        <SearchForm defaultValue={q} />
      </section>
      {error ? <ErrorNotice message={error} /> : q ? <MediaGrid items={results} type="movie" /> : null}
    </>
  );
}
