# Python CLI

A single file command line client: `amodb_cli.py`. It searches titles, shows movie and TV details, lists trending titles, and runs OMDb style and external id lookups. It uses only the Python standard library, so there is nothing to install from PyPI. Tested on Python 3.13.

amodb is a paid API. Get a key at https://amodb.dev/pricing. The same code works against any TMDB v3 compatible base URL: set `AMODB_BASE_URL`. The `omdb` command calls `/omdb/` on the same host as that base URL, so it needs the amodb API.

## Setup

No install step. Set the key in your shell and run the file.

```sh
export AMODB_API_KEY=your_key_here
python amodb_cli.py --help
```

On Windows PowerShell use `$env:AMODB_API_KEY = "your_key_here"`.

| Variable | Required | Default |
|---|---|---|
| `AMODB_API_KEY` | yes | none |
| `AMODB_BASE_URL` | no | `https://api.amodb.dev/3` |

## Commands

```sh
python amodb_cli.py search "inception"
python amodb_cli.py search "nolan" --type person
python amodb_cli.py movie 550
python amodb_cli.py tv 1399 --language ru-RU
python amodb_cli.py trending --window week
python amodb_cli.py omdb tt0137523
python amodb_cli.py find tt0137523
python amodb_cli.py search "inception" --json
```

Options go after the command. `--type` takes `movie`, `tv`, `person` or `multi` (the default) for `search`. `--language` (or `-l`) takes a tag such as `ru-RU` or `pt-BR`. `--json` prints the raw response instead of a table.

On an API error the CLI prints the `status_message` to stderr and exits with code 1. A 429 response is retried once after the number of seconds in `Retry-After`.

## How the code works

- `get_json(url)` is the only function that touches the network. It uses `urllib.request`, sends the key as `Authorization: Bearer`, and turns every failure into an `ApiError`.
- `retry_delay()` reads `Retry-After` as seconds or as an HTTP date and clamps it to 0 to 60 seconds. `get_json` sleeps that long and tries once more on HTTP 429.
- `error_message()` returns the TMDB `status_message` (or the OMDb `Error` text) from the body, and falls back to the HTTP status line for non JSON bodies.
- `api()` and `omdb()` build the URL. The OMDb call sends the same key as the `apikey` query parameter.
- `build_parser()` defines the commands with `argparse`. Each command has a small `render_*` function for the table or lines, and `--json` bypasses it.

## Tests

The tests start a local `http.server` stub, point `AMODB_BASE_URL` at it, and cover search, movie, error handling and the 429 retry. They never use the network and need no key.

```sh
python -m unittest
```

## License

MIT
