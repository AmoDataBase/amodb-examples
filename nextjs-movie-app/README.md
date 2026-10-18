# Next.js movie app

A small movie browser: trending movies, search, and detail pages for movies and TV shows. Built with Next.js 15, React 19, the App Router and TypeScript. Every page is a server component, so no client JavaScript is needed.

amodb is a paid API. Get a key at https://amodb.dev/pricing. The same code works against any TMDB v3 compatible base URL: set `AMODB_BASE_URL` and nothing else changes. The amodb `ratings` block is an extension, so the movie page hides it when the API does not return it.

## Setup

```sh
npm install
cp .env.example .env.local
# open .env.local and set AMODB_API_KEY
npm run dev
```

Then open `localhost:3000`.

| Variable | Required | Default |
|---|---|---|
| `AMODB_API_KEY` | yes | none |
| `AMODB_BASE_URL` | no | `https://api.amodb.dev/3` |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build. Needs no key and no network |
| `npm start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |

## Pages

| Route | API call |
|---|---|
| `/` | `/trending/movie/week`, plus a search form |
| `/search?q=inception` | `/search/multi` |
| `/movie/550` | `/movie/550?append_to_response=credits,videos,ratings` |
| `/tv/1399` | `/tv/1399?append_to_response=credits,videos,ratings` |

## How the code works

- `lib/amodb.ts` is one typed `amodb(path, params)` function. It runs only on the server, sends the key as a Bearer header, caches each response for 600 seconds with `next: { revalidate: 600 }`, and throws an `AmodbError` carrying the API `status_message` on any non-2xx response.
- The data pages export `dynamic = 'force-dynamic'`, so the build never calls the API. The 10 minute cache still applies at request time.
- `components/ImageFromAmodb.tsx` builds `https://img.amodb.dev/t/p/{size}{path}` for `next/image`. `next.config.ts` allows the `img.amodb.dev` host in `images.remotePatterns`.
- `append_to_response=credits,videos,ratings` returns the cast, the videos and the ratings in one request instead of four.
- The search box is a plain GET form to `/search`, so it works without JavaScript.
- The trailer line prints the video name, site and key from the API. Build the player URL from `site` and `key` for the video host you use.

## License

MIT
