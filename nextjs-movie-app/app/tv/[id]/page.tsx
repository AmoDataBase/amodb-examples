import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Detail } from '@/components/Detail';
import { ErrorNotice } from '@/components/ErrorNotice';
import { AmodbError, amodb, errorMessage } from '@/lib/amodb';
import { isId, yearOf } from '@/lib/format';
import type { TvDetails } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

const loadShow = (id: string) =>
  amodb<TvDetails>(`/tv/${id}`, { append_to_response: ['credits', 'videos', 'ratings'] });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!isId(id)) return {};
  try {
    return { title: (await loadShow(id)).name };
  } catch {
    return {};
  }
}

export default async function TvPage({ params }: Props) {
  const { id } = await params;
  if (!isId(id)) notFound();

  let show: TvDetails;
  try {
    show = await loadShow(id);
  } catch (e) {
    if (e instanceof AmodbError && e.status === 404) notFound();
    return <ErrorNotice message={errorMessage(e)} />;
  }

  const runtime = show.episode_run_time?.[0];
  const facts = [
    show.first_air_date,
    show.number_of_seasons ? `${show.number_of_seasons} seasons` : '',
    show.number_of_episodes ? `${show.number_of_episodes} episodes` : '',
    runtime ? `${runtime} min per episode` : '',
    show.vote_average ? `Rating ${show.vote_average.toFixed(1)}` : '',
  ];

  return (
    <Detail
      title={show.name}
      year={yearOf(show.first_air_date)}
      tagline={show.tagline}
      overview={show.overview}
      facts={facts}
      genres={show.genres}
      posterPath={show.poster_path}
      backdropPath={show.backdrop_path}
      cast={show.credits?.cast}
      videos={show.videos?.results}
      ratings={show.ratings}
    />
  );
}
