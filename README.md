<!-- GitHub topics: amodb, tmdb, omdb, examples, nextjs, python, telegram-bot, discord-bot, grammy, discordjs, movie-api -->

# amodb examples

Four small, independent examples that call the amodb movie and TV API. Each one uses plain `fetch` or the Python standard library. None of them needs an SDK package.

amodb is a paid API that is compatible with TMDB v3 and OMDb. Get a key at https://amodb.dev/pricing. Every example reads the key from `AMODB_API_KEY`. The same code works against any TMDB v3 compatible base URL: set the optional `AMODB_BASE_URL` (default `https://api.amodb.dev/3`).

## Examples

| Folder | What it does | Run |
|---|---|---|
| [`nextjs-movie-app`](nextjs-movie-app) | Next.js 15 movie browser with trending, search, movie and TV pages. Server components only | `cd nextjs-movie-app && npm install && npm run dev` |
| [`python-cli`](python-cli) | One file command line client for search, details, trending, OMDb and external id lookups | `python python-cli/amodb_cli.py search "inception"` |
| [`telegram-bot`](telegram-bot) | grammY bot with `/search`, `/trending` and movie cards that include the poster | `cd telegram-bot && npm install && npm start` |
| [`discord-bot`](discord-bot) | discord.js v14 bot with `/movie` and `/trending` embeds | `cd discord-bot && npm install && npm run deploy && npm start` |

Each folder has its own `README.md`, `.env.example` and dependency file. Copy `.env.example` to `.env` (or `.env.local` for the Next.js app) and fill in the values.

## Environment

| Variable | Used by | Notes |
|---|---|---|
| `AMODB_API_KEY` | all | 32 character key from your account |
| `AMODB_BASE_URL` | all | Optional. Point it at any TMDB v3 compatible server, including a local stub |
| `TELEGRAM_BOT_TOKEN` | telegram-bot | From BotFather in Telegram |
| `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_GUILD_ID` | discord-bot | The guild id is optional |

Never commit a key. The `.gitignore` in this repository excludes `.env` and `.env.local`.

## Rate limits

Every plan returns all data. Plans differ only in requests per minute. When you go over the limit the API answers with HTTP 429 and a `Retry-After` header. The Python CLI and both bots retry once after that delay. See https://api.amodb.dev/plans for the current plans.

## Links

- Website and pricing: https://amodb.dev/pricing
- API host: https://api.amodb.dev
- Images: https://img.amodb.dev

## License

MIT. See [LICENSE](LICENSE).
