import Link from 'next/link';
import { titleOf, yearOf } from '@/lib/format';
import type { MediaItem } from '@/lib/types';
import { Poster } from './ImageFromAmodb';

export function MediaGrid({ items, type }: { items: MediaItem[]; type: 'movie' | 'tv' }) {
  // Search results carry their own media_type. Trending and list endpoints do not.
  const cards = items.filter((item) => (item.media_type ?? type) !== 'person');
  if (!cards.length) return <p className="notice">Nothing to show.</p>;

  return (
    <ul className="grid">
      {cards.map((item) => {
        const kind = item.media_type === 'tv' ? 'tv' : item.media_type === 'movie' ? 'movie' : type;
        const title = titleOf(item);
        return (
          <li key={`${kind}-${item.id}`}>
            <Link href={`/${kind}/${item.id}`} className="card">
              <Poster path={item.poster_path} alt={`Poster of ${title}`} />
              <span className="card-title">{title}</span>
              <span className="card-meta">
                <span>{yearOf(item.release_date ?? item.first_air_date)}</span>
                {item.vote_average ? <span>{item.vote_average.toFixed(1)}</span> : null}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
