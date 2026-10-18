// A plain GET form. The browser navigates to /search?q=... with no client JavaScript.
export function SearchForm({ defaultValue = '' }: { defaultValue?: string }) {
  return (
    <form action="/search" method="get" role="search" className="search">
      <input type="search" name="q" defaultValue={defaultValue} placeholder="Search movies and TV shows" aria-label="Search" required />
      <button type="submit">Search</button>
    </form>
  );
}
