// Server side helper. Import it only from server components: the key is read
// from AMODB_API_KEY (no NEXT_PUBLIC_ prefix), so it never reaches the browser.

type Param = string | number | boolean | string[] | undefined;

export class AmodbError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'AmodbError';
  }
}

export async function amodb<T>(path: string, params: Record<string, Param> = {}): Promise<T> {
  const key = process.env.AMODB_API_KEY;
  if (!key) {
    throw new AmodbError(0, 'AMODB_API_KEY is not set. Copy .env.example to .env.local and add your key.');
  }

  const base = (process.env.AMODB_BASE_URL || 'https://api.amodb.dev/3').replace(/\/+$/, '');
  const url = new URL(base + path);
  for (const [name, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    url.searchParams.set(name, Array.isArray(value) ? value.join(',') : String(value));
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
    next: { revalidate: 600 },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { status_message?: string } | null;
    throw new AmodbError(res.status, body?.status_message ?? `Request failed with HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}
