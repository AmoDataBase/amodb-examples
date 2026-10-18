# Telegram bot

A movie bot for Telegram built with grammY. `/search <title>` returns the top 5 matches as inline buttons. Tapping a button sends a movie card with the poster, year, rating, runtime, genres and a short overview. `/trending` lists the 5 most popular movies this week.

amodb is a paid API. Get a key at https://amodb.dev/pricing. The same code works against any TMDB v3 compatible base URL: set `AMODB_BASE_URL`.

## Setup

1. Message BotFather in Telegram, create a bot, and copy the token it gives you.
2. Install and configure:

```sh
npm install
cp .env.example .env
# open .env and set TELEGRAM_BOT_TOKEN and AMODB_API_KEY
```

3. Run it. The bot uses long polling, so it needs no public URL.

```sh
# Node 20.6 or newer: reads .env for you
npm run dev

# Node 18: export the variables, then start
export TELEGRAM_BOT_TOKEN=... AMODB_API_KEY=...
npm start
```

| Variable | Required | Default |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | yes | none |
| `AMODB_API_KEY` | yes | none |
| `AMODB_BASE_URL` | no | `https://api.amodb.dev/3` |

## Commands

| Command | What it does |
|---|---|
| `/start` | Short help |
| `/search inception` | Top 5 movies for the title, as buttons |
| `/trending` | Top 5 movies this week, as buttons |

## How the code works

- `amodb.js` is the whole API client: one `fetch` call with the Bearer header, a single retry on HTTP 429, and an `Error` that carries the API `status_message`.
- `movieButtons()` builds the inline keyboard. Each button's callback data is `movie:<id>`, which fits the 64 byte limit.
- `bot.callbackQuery(/^movie:(\d+)$/)` handles the tap, loads `/movie/{id}` and builds the card text.
- `replyWithPhoto` is given the URL `https://img.amodb.dev/t/p/w500{poster_path}`. Telegram downloads the poster itself. Movies without a poster get a text card.
- `bot.catch` keeps the bot alive when an API call fails and tells the user what happened.

## Checks

```sh
npm run check
```

This runs `node --check` on both files.

## License

MIT
