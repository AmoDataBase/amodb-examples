import type { CastMember, Genre, Ratings, Video } from '@/lib/types';
import { ImageFromAmodb, Poster } from './ImageFromAmodb';

export type DetailProps = {
  title: string;
  year: string;
  tagline?: string;
  overview?: string;
  facts: (string | undefined)[];
  genres: Genre[];
  posterPath: string | null;
  backdropPath: string | null;
  cast?: CastMember[];
  videos?: Video[];
  ratings?: Ratings | null;
};

function pickTrailer(videos: Video[] = []) {
  const trailers = videos.filter((video) => video.type === 'Trailer');
  return trailers.find((video) => video.official) ?? trailers[0];
}

// The amodb `ratings` block maps a source name to { value, votes } or null.
function RatingsBlock({ ratings }: { ratings?: Ratings | null }) {
  const rows = Object.entries(ratings ?? {}).flatMap(([source, rating]) => (rating ? [{ source, ...rating }] : []));
  if (!rows.length) return null;
  return (
    <section>
      <h2>Ratings</h2>
      <dl className="ratings">
        {rows.map((row) => (
          <div key={row.source}>
            <dt>{row.source.replace(/_/g, ' ')}</dt>
            <dd>
              {row.value}
              <small>{row.votes.toLocaleString('en-US')} votes</small>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function Detail({ title, year, tagline, overview, facts, genres, posterPath, backdropPath, cast = [], videos, ratings }: DetailProps) {
  const trailer = pickTrailer(videos);
  return (
    <article>
      <section className="hero">
        {backdropPath ? (
          <ImageFromAmodb path={backdropPath} size="w1280" alt="" width={1280} height={720} className="backdrop" priority />
        ) : null}
        <div className="hero-body">
          <Poster path={posterPath} alt={`Poster of ${title}`} size="w500" priority />
          <div>
            <h1>
              {title} <span className="year">({year})</span>
            </h1>
            {tagline ? <p className="tagline">{tagline}</p> : null}
            <p className="facts">{facts.filter(Boolean).join(' | ')}</p>
            <ul className="chips">
              {genres.map((genre) => (
                <li key={genre.id}>{genre.name}</li>
              ))}
            </ul>
            <p>{overview || 'No overview yet.'}</p>
            {trailer ? (
              <p className="trailer">
                Trailer: {trailer.name} ({trailer.site}, video key <code>{trailer.key}</code>)
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <RatingsBlock ratings={ratings} />

      {cast.length ? (
        <section>
          <h2>Cast</h2>
          <ul className="cast">
            {cast.slice(0, 12).map((person) => (
              <li key={person.id}>
                <ImageFromAmodb path={person.profile_path} size="w185" alt={person.name} width={185} height={278} className="avatar" />
                <strong>{person.name}</strong>
                <span>{person.character}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
