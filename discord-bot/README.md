# Discord bot

A movie bot for Discord built with discord.js v14. `/movie title:<name>` replies with an embed for the best match: title, year, overview, rating, release date, a poster thumbnail and the IMDb id as plain text. `/trending` replies with up to 5 embeds for the most popular movies this week.

amodb is a paid API. Get a key at https://amodb.dev/pricing. The same code works against any TMDB v3 compatible base URL: set `AMODB_BASE_URL`.

## Setup

1. In the Discord developer portal, create an application and add a bot. Copy the bot token and the application id (the client id).
2. Invite the bot to your server with the `bot` and `applications.commands` scopes.
3. Install and configure:

```sh
npm install
cp .env.example .env
# open .env and set DISCORD_TOKEN, DISCORD_CLIENT_ID and AMODB_API_KEY
```

4. Register the slash commands once, then start the bot.

```sh
# Node 20.6 or newer: reads .env for you
npm run deploy:dev
npm run dev

# Node 18: export the variables first, then use the plain scripts
export DISCORD_TOKEN=... DISCORD_CLIENT_ID=... AMODB_API_KEY=...
npm run deploy
npm start
```

| Variable | Required | Notes |
|---|---|---|
| `DISCORD_TOKEN` | yes | Bot token |
| `DISCORD_CLIENT_ID` | yes | Application id |
| `DISCORD_GUILD_ID` | no | Register in one server so the commands appear at once |
| `AMODB_API_KEY` | yes | Needed by `index.js` only |
| `AMODB_BASE_URL` | no | Defaults to `https://api.amodb.dev/3` |

## Commands

| Command | What it does |
|---|---|
| `/movie title:inception` | Embed for the top search match |
| `/trending` | Up to 5 embeds for this week's popular movies |

## How the code works

- `commands.js` defines both commands with `SlashCommandBuilder`. `deploy-commands.js` and `index.js` share it.
- `deploy-commands.js` sends the definitions with `REST` and `Routes`. With `DISCORD_GUILD_ID` it uses `applicationGuildCommands`, otherwise `applicationCommands`.
- `index.js` defers every reply first, because an API call can outlast Discord's 3 second window, then calls the handler for the command name and sends its result with `editReply`.
- `movieEmbed()` builds the embed. The thumbnail is `https://img.amodb.dev/t/p/w342{poster_path}`. The IMDb id is a plain text field, not a link.
- `amodb.js` is the whole API client: one `fetch` call with the Bearer header and a single retry on HTTP 429.

## Checks

```sh
npm run check
```

This runs `node --check` on every file.

## License

MIT
