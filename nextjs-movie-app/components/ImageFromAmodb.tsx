import Image from 'next/image';

const IMAGE_BASE = 'https://img.amodb.dev/t/p/';

type Size = 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'w1280';

type Props = {
  path: string | null | undefined;
  size: Size;
  alt: string;
  width: number;
  height: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
};

// `path` comes straight from the API, for example "/abc123.jpg".
export function ImageFromAmodb({ path, size, alt, width, height, sizes, priority, className = '' }: Props) {
  if (!path) {
    return (
      <div className={`no-image ${className}`} style={{ aspectRatio: `${width} / ${height}` }}>
        No image
      </div>
    );
  }
  return (
    <Image
      src={`${IMAGE_BASE}${size}${path}`}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      className={className}
    />
  );
}

export function Poster({ path, alt, size = 'w342', priority }: { path: string | null | undefined; alt: string; size?: 'w342' | 'w500'; priority?: boolean }) {
  const width = size === 'w500' ? 500 : 342;
  return (
    <ImageFromAmodb
      path={path}
      size={size}
      alt={alt}
      width={width}
      height={Math.round(width * 1.5)}
      sizes="(max-width: 640px) 45vw, 260px"
      priority={priority}
      className="poster"
    />
  );
}
