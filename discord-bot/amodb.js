// Minimal amodb client built on fetch. Works on Node 18 and newer.
const IMAGE_BASE = 'https://img.amodb.dev/t/p/';

// GET a TMDB style path such as "/search/movie". Retries once on HTTP 429.
export async function amodb(path, params = {}, attempt = 0) {
  const key = process.env.AMODB_API_KEY;
  if (!key) throw new Error('AMODB_API_KEY is not set');

  const base = (process.env.AMODB_BASE_URL || 'https://api.amodb.dev/3').replace(/\/+$/, '');
  const url = new URL(base + path);
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') url.searchParams.set(name, value);
  }

  const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
  if (res.status === 429 && attempt === 0) {
    const seconds = Math.min(Number(res.headers.get('retry-after')) || 1, 30);
    await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
    return amodb(path, params, 1);
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.status_message ?? `HTTP ${res.status}`);
  return body;
}

export const imageUrl = (path, size = 'w500') => (path ? `${IMAGE_BASE}${size}${path}` : null);

// "Title (1999)", or just the title when the release date is unknown.
export const titleWithYear = (title, date) => (date ? `${title} (${date.slice(0, 4)})` : title);

export const truncate = (text, max) => (text.length > max ? `${text.slice(0, max - 3).trimEnd()}...` : text);
