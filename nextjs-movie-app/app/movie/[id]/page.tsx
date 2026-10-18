import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Detail } from '@/components/Detail';
import { ErrorNotice } from '@/components/ErrorNotice';
import { AmodbError, amodb, errorMessage } from '@/lib/amodb';
import { isId, yearOf } from '@/lib/format';
import type { MovieDetails } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

// One call returns details, cast, videos and the amodb ratings block.
const loadMovie = (id: string) =>
  amodb<MovieDetails>(`/movie/${id}`, { append_to_response: ['credits', 'videos', 'ratings'] });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!isId(id)) return {};
  try {
    return { title: (await loadMovie(id)).title };
  } catch {
    return {};
  }
}

export default async function MoviePage({ params }: Props) {
  const { id } = await params;
  if (!isId(id)) notFound();

  let movie: MovieDetails;
  try {
    movie = await loadMovie(id);
  } catch (e) {
    if (e instanceof AmodbError && e.status === 404) notFound();
    return <ErrorNotice message={errorMessage(e)} />;
  }

  const facts = [
    movie.release_date,
    movie.runtime ? `${movie.runtime} min` : '',
    movie.vote_average ? `Rating ${movie.vote_average.toFixed(1)}` : '',
    movie.imdb_id ?? '',
  ];

  return (
    <Detail
      title={movie.title}
      year={yearOf(movie.release_date)}
      tagline={movie.tagline}
      overview={movie.overview}
      facts={facts}
      genres={movie.genres}
      posterPath={movie.poster_path}
      backdropPath={movie.backdrop_path}
      cast={movie.credits?.cast}
      videos={movie.videos?.results}
      ratings={movie.ratings}
    />
  );
}
