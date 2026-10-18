#!/usr/bin/env python3
"""Command line client for the amodb API. Standard library only.

    export AMODB_API_KEY=your_key
    python amodb_cli.py search "inception"
    python amodb_cli.py movie 550

amodb is a paid API. Get a key at https://amodb.dev/pricing. The same code
works against any TMDB v3 compatible base URL: set AMODB_BASE_URL.
"""

import argparse
import json
import os
import sys
import textwrap
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

VERSION = "0.1.0"
DEFAULT_BASE_URL = "https://api.amodb.dev/3"
TIMEOUT = 15


class ApiError(Exception):
    """An API or network failure. status is 0 when no HTTP response was received."""

    def __init__(self, status, message):
        super().__init__(message)
        self.status = status


# HTTP


def retry_delay(header):
    """Seconds to wait before the single retry. Accepts an integer or an HTTP date."""
    if header:
        try:
            return min(max(int(header), 0), 60)
        except ValueError:
            try:
                wait = (parsedate_to_datetime(header) - datetime.now(timezone.utc)).total_seconds()
                return min(max(int(wait), 0), 60)
            except (TypeError, ValueError):
                pass
    return 1


def error_message(err):
    """Read status_message (TMDB style) or Error (OMDb style) from an error body."""
    try:
        body = json.loads(err.read().decode("utf-8", "replace"))
        return body.get("status_message") or body["Error"]
    except (ValueError, KeyError, AttributeError):
        return f"HTTP {err.code} {err.reason}".strip()


def get_json(url):
    """GET a JSON document. Retries once on HTTP 429, waiting for Retry-After."""
    key = os.environ["AMODB_API_KEY"].strip()
    headers = {"Authorization": f"Bearer {key}", "Accept": "application/json", "User-Agent": f"amodb-cli/{VERSION}"}
    for attempt in (1, 2):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=TIMEOUT) as response:
                return json.load(response)
        except urllib.error.HTTPError as err:
            if err.code == 429 and attempt == 1:
                time.sleep(retry_delay(err.headers.get("Retry-After")))
                continue
            raise ApiError(err.code, error_message(err)) from None
        except (json.JSONDecodeError, UnicodeDecodeError):
            raise ApiError(0, "The API returned a body that is not JSON.") from None
        except OSError as err:
            raise ApiError(0, f"Could not reach the API: {getattr(err, 'reason', err)}") from None


def base_url():
    if not os.environ.get("AMODB_API_KEY", "").strip():
        raise ApiError(0, "AMODB_API_KEY is not set. amodb is a paid API, get a key at https://amodb.dev/pricing")
    url = (os.environ.get("AMODB_BASE_URL") or DEFAULT_BASE_URL).rstrip("/")
    if not url.startswith(("http://", "https://")):
        raise ApiError(0, "AMODB_BASE_URL must start with http:// or https://")
    return url


def clean(params):
    return urllib.parse.urlencode({k: v for k, v in params.items() if v not in (None, "")})


def api(path, **params):
    """TMDB style call: base URL + path, key in the Authorization header."""
    return get_json(f"{base_url()}{path}?{clean(params)}")


def omdb(**params):
    """OMDb style call on the same host. The key goes in the apikey parameter."""
    parts = urllib.parse.urlsplit(base_url())
    params["apikey"] = os.environ["AMODB_API_KEY"].strip()
    data = get_json(f"{parts.scheme}://{parts.netloc}/omdb/?{clean(params)}")
    if str(data.get("Response")).lower() == "false":
        raise ApiError(0, data.get("Error", "OMDb lookup failed."))
    return data


# Formatting


def year(date):
    return (date or "")[:4] or "n/a"


def clip(text, width):
    text = str(text)
    return text if len(text) <= width else text[: width - 1] + "..."


def table(headers, rows):
    widths = [max(len(str(cell)) for cell in column) for column in zip(headers, *rows)]
    lines = ["  ".join(str(cell).ljust(width) for cell, width in zip(row, widths)).rstrip() for row in [headers, *rows]]
    return "\n".join(lines)


def fields(pairs):
    pairs = [(label, value) for label, value in pairs if value not in (None, "", [])]
    width = max((len(label) for label, _ in pairs), default=0) + 1
    return "\n".join(f"{(label + ':').ljust(width)} {value}" for label, value in pairs)


def score(item):
    average = item.get("vote_average")
    if not average:
        return None
    return f"{average:.1f} ({item.get('vote_count', 0)} votes)"


def names(items, limit=None):
    return ", ".join(item["name"] for item in (items or [])[:limit])


def ratings_block(ratings):
    rows = [(name.replace("_", " "), rating) for name, rating in (ratings or {}).items() if rating]
    lines = []
    for name, rating in rows:
        votes = f" ({rating['votes']} votes)" if rating.get("votes") else ""
        lines.append(f"  {name}: {rating.get('value')}{votes}")
    return "Ratings:\n" + "\n".join(lines) if lines else ""


def paragraph(text):
    return textwrap.fill(text, width=78) if text else ""


def join_blocks(*blocks):
    return "\n".join(block for block in blocks if block is not None)


def results_table(results, default_type):
    rows = []
    for item in results:
        kind = item.get("media_type") or default_type
        title = item.get("title") or item.get("name") or "?"
        when = item.get("release_date") or item.get("first_air_date")
        rating = item.get("vote_average")
        rows.append([kind, item.get("id"), clip(title, 50), year(when) if when else "-", f"{rating:.1f}" if rating else "-"])
    return table(["TYPE", "ID", "TITLE", "YEAR", "RATING"], rows) if rows else "No results."


def render_movie(movie):
    credits = movie.get("credits") or {}
    directors = [p["name"] for p in credits.get("crew", []) if p.get("job") == "Director"]
    return join_blocks(
        f"{movie.get('title')} ({year(movie.get('release_date'))})",
        fields([
            ("Tagline", movie.get("tagline")),
            ("Runtime", f"{movie['runtime']} min" if movie.get("runtime") else None),
            ("Genres", names(movie.get("genres"))),
            ("Rating", score(movie)),
            ("IMDb id", movie.get("imdb_id")),
            ("Director", ", ".join(directors)),
            ("Cast", names(credits.get("cast"), 5)),
        ]),
        ratings_block(movie.get("ratings")) or None,
        "",
        paragraph(movie.get("overview")),
    )


def render_tv(show):
    credits = show.get("credits") or {}
    runtime = (show.get("episode_run_time") or [None])[0]
    return join_blocks(
        f"{show.get('name')} ({year(show.get('first_air_date'))})",
        fields([
            ("Tagline", show.get("tagline")),
            ("Status", show.get("status")),
            ("Seasons", show.get("number_of_seasons")),
            ("Episodes", show.get("number_of_episodes")),
            ("Runtime", f"{runtime} min per episode" if runtime else None),
            ("Genres", names(show.get("genres"))),
            ("Rating", score(show)),
            ("Cast", names(credits.get("cast"), 5)),
        ]),
        ratings_block(show.get("ratings")) or None,
        "",
        paragraph(show.get("overview")),
    )


def render_omdb(item):
    ratings = [f"  {r['Source']}: {r['Value']}" for r in item.get("Ratings", [])]
    return join_blocks(
        f"{item.get('Title')} ({item.get('Year')})",
        fields([
            ("Rated", item.get("Rated")),
            ("Runtime", item.get("Runtime")),
            ("Genre", item.get("Genre")),
            ("Director", item.get("Director")),
            ("Actors", item.get("Actors")),
            ("IMDb", f"{item.get('imdbRating')} ({item.get('imdbVotes')} votes)" if item.get("imdbRating") else None),
            ("Awards", item.get("Awards")),
            ("IMDb id", item.get("imdbID")),
        ]),
        "Ratings:\n" + "\n".join(ratings) if ratings else None,
        "",
        paragraph(item.get("Plot")),
    )


def render_find(data):
    rows = []
    for key, kind in (("movie_results", "movie"), ("tv_results", "tv"), ("person_results", "person"),
                      ("tv_episode_results", "episode"), ("tv_season_results", "season")):
        rows += [{**item, "media_type": kind} for item in data.get(key, [])]
    return results_table(rows, "movie")


# Commands


def emit(args, data, render):
    print(json.dumps(data, indent=2, ensure_ascii=False) if args.json else render(data))


def cmd_search(args):
    data = api(f"/search/{args.type}", query=args.query, language=args.language)
    emit(args, data, lambda d: results_table(d.get("results", []), args.type))


def cmd_movie(args):
    data = api(f"/movie/{args.id}", append_to_response="credits,ratings", language=args.language)
    emit(args, data, render_movie)


def cmd_tv(args):
    data = api(f"/tv/{args.id}", append_to_response="credits,ratings", language=args.language)
    emit(args, data, render_tv)


def cmd_trending(args):
    data = api(f"/trending/{args.type}/{args.window}", language=args.language)
    emit(args, data, lambda d: results_table(d.get("results", []), args.type))


def cmd_omdb(args):
    emit(args, omdb(i=args.imdb_id, plot=args.plot), render_omdb)


def cmd_find(args):
    data = api(f"/find/{urllib.parse.quote(args.external_id, safe='')}", external_source=args.source, language=args.language)
    emit(args, data, render_find)


def build_parser():
    as_json = argparse.ArgumentParser(add_help=False)
    as_json.add_argument("--json", action="store_true", help="print the raw JSON response")
    with_language = argparse.ArgumentParser(add_help=False, parents=[as_json])
    with_language.add_argument("-l", "--language", help="language tag such as ru-RU or pt-BR")

    parser = argparse.ArgumentParser(
        prog="amodb_cli.py",
        description="Look up movies and TV shows with the amodb API.",
        epilog="Environment: AMODB_API_KEY (required), AMODB_BASE_URL (optional, default " + DEFAULT_BASE_URL + ").",
    )
    parser.add_argument("--version", action="version", version=f"amodb-cli {VERSION}")
    sub = parser.add_subparsers(dest="command", required=True, metavar="command")

    p = sub.add_parser("search", parents=[with_language], help="search by title or name")
    p.add_argument("query")
    p.add_argument("--type", choices=["movie", "tv", "person", "multi"], default="multi")
    p.set_defaults(func=cmd_search)

    p = sub.add_parser("movie", parents=[with_language], help="movie details by id")
    p.add_argument("id", type=int)
    p.set_defaults(func=cmd_movie)

    p = sub.add_parser("tv", parents=[with_language], help="TV show details by id")
    p.add_argument("id", type=int)
    p.set_defaults(func=cmd_tv)

    p = sub.add_parser("trending", parents=[with_language], help="trending titles")
    p.add_argument("--window", choices=["day", "week"], default="day")
    p.add_argument("--type", choices=["all", "movie", "tv", "person"], default="all")
    p.set_defaults(func=cmd_trending)

    p = sub.add_parser("omdb", parents=[as_json], help="OMDb style lookup by IMDb id")
    p.add_argument("imdb_id")
    p.add_argument("--plot", choices=["short", "full"], default="short")
    p.set_defaults(func=cmd_omdb)

    p = sub.add_parser("find", parents=[with_language], help="find titles by an external id")
    p.add_argument("external_id")
    p.add_argument("--source", choices=["imdb_id", "tvdb_id", "wikidata_id", "kinopoisk_id"], default="imdb_id")
    p.set_defaults(func=cmd_find)
    return parser


def main(argv=None):
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(errors="replace")
    args = build_parser().parse_args(argv)
    try:
        args.func(args)
    except ApiError as err:
        print(f"Error {err.status}: {err}" if err.status >= 400 else f"Error: {err}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
