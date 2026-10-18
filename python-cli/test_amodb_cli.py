"""Tests for amodb_cli.py. They run against a local stub server, never the network.

    python -m unittest
"""

import io
import json
import os
import threading
import unittest
from contextlib import redirect_stderr, redirect_stdout
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from unittest import mock
from urllib.parse import parse_qs, urlsplit

import amodb_cli

NOT_FOUND = {"success": False, "status_code": 34, "status_message": "The resource you requested could not be found."}

MOVIE = {
    "id": 550,
    "title": "Fight Club",
    "tagline": "Mischief. Mayhem. Soap.",
    "overview": "An insomniac office worker starts an underground fight club.",
    "release_date": "1999-10-15",
    "runtime": 139,
    "vote_average": 8.4,
    "vote_count": 30000,
    "imdb_id": "tt0137523",
    "genres": [{"id": 18, "name": "Drama"}, {"id": 53, "name": "Thriller"}],
    "credits": {
        "cast": [{"name": "Edward Norton"}, {"name": "Brad Pitt"}],
        "crew": [{"name": "David Fincher", "job": "Director"}],
    },
    "ratings": {"imdb": {"value": 8.8, "votes": 2500000}, "rotten_tomatoes": None},
}


class Stub(BaseHTTPRequestHandler):
    """Serves queued responses per path. The last queued response repeats."""

    routes = {}  # path -> list of (status, headers, body)
    requests = []  # (path, query, headers)

    def do_GET(self):
        url = urlsplit(self.path)
        Stub.requests.append((url.path, parse_qs(url.query), dict(self.headers)))
        queue = Stub.routes.get(url.path)
        if queue is None:
            status, headers, body = 404, {}, NOT_FOUND
        else:
            status, headers, body = queue.pop(0) if len(queue) > 1 else queue[0]
        data = (body if isinstance(body, str) else json.dumps(body)).encode()
        self.send_response(status)
        for name, value in headers.items():
            self.send_header(name, value)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, *args):
        pass


class CliTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), Stub)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.origin = f"http://127.0.0.1:{cls.server.server_port}"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def setUp(self):
        Stub.routes = {}
        Stub.requests = []
        env = mock.patch.dict(os.environ, {"AMODB_API_KEY": "testkey", "AMODB_BASE_URL": self.origin + "/3", "NO_PROXY": "127.0.0.1"})
        env.start()
        self.addCleanup(env.stop)
        clock = mock.patch.object(amodb_cli, "time")
        self.time = clock.start()
        self.addCleanup(clock.stop)

    def route(self, path, body, status=200, headers=None):
        Stub.routes.setdefault(path, []).append((status, headers or {}, body))

    def run_cli(self, *argv):
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            code = amodb_cli.main(list(argv))
        return code, out.getvalue(), err.getvalue()

    def test_search_prints_table_and_sends_bearer_key(self):
        self.route("/3/search/multi", {"results": [
            {"id": 550, "media_type": "movie", "title": "Fight Club", "release_date": "1999-10-15", "vote_average": 8.4},
            {"id": 1399, "media_type": "tv", "name": "Game of Thrones", "first_air_date": "2011-04-17", "vote_average": 8.5},
        ]})
        code, out, _ = self.run_cli("search", "fight club", "--language", "ru-RU")
        self.assertEqual(code, 0)
        self.assertIn("TITLE", out)
        self.assertIn("Fight Club", out)
        self.assertIn("1999", out)
        self.assertIn("Game of Thrones", out)
        path, query, headers = Stub.requests[0]
        self.assertEqual(path, "/3/search/multi")
        self.assertEqual(query["query"], ["fight club"])
        self.assertEqual(query["language"], ["ru-RU"])
        self.assertEqual(headers["Authorization"], "Bearer testkey")
        self.assertNotIn("api_key", query)

    def test_search_type_picks_the_endpoint(self):
        self.route("/3/search/person", {"results": [{"id": 287, "name": "Brad Pitt"}]})
        code, out, _ = self.run_cli("search", "pitt", "--type", "person")
        self.assertEqual(code, 0)
        self.assertEqual(Stub.requests[0][0], "/3/search/person")
        self.assertIn("person", out)
        self.assertIn("Brad Pitt", out)

    def test_json_flag_prints_the_raw_response(self):
        body = {"results": [{"id": 1, "title": "Ünïcode"}]}
        self.route("/3/search/multi", body)
        code, out, _ = self.run_cli("search", "x", "--json")
        self.assertEqual(code, 0)
        self.assertEqual(json.loads(out), body)

    def test_movie_details(self):
        self.route("/3/movie/550", MOVIE)
        code, out, _ = self.run_cli("movie", "550")
        self.assertEqual(code, 0)
        for text in ("Fight Club (1999)", "139 min", "Drama, Thriller", "8.4", "tt0137523", "David Fincher", "Brad Pitt", "imdb: 8.8"):
            self.assertIn(text, out)
        self.assertNotIn("rotten tomatoes", out)  # null ratings are skipped
        self.assertEqual(Stub.requests[0][1]["append_to_response"], ["credits,ratings"])

    def test_tv_details(self):
        self.route("/3/tv/1399", {"name": "Game of Thrones", "first_air_date": "2011-04-17", "number_of_seasons": 8, "status": "Ended", "genres": []})
        code, out, _ = self.run_cli("tv", "1399")
        self.assertEqual(code, 0)
        self.assertIn("Game of Thrones (2011)", out)
        self.assertIn("Seasons:", out)

    def test_trending_window(self):
        self.route("/3/trending/all/week", {"results": [{"id": 1, "media_type": "movie", "title": "Dune"}]})
        code, out, _ = self.run_cli("trending", "--window", "week")
        self.assertEqual(code, 0)
        self.assertEqual(Stub.requests[0][0], "/3/trending/all/week")
        self.assertIn("Dune", out)

    def test_omdb_sends_apikey_parameter(self):
        self.route("/omdb/", {"Response": "True", "Title": "Fight Club", "Year": "1999", "imdbRating": "8.8", "imdbVotes": "2,500,000",
                              "Ratings": [{"Source": "Internet Movie Database", "Value": "8.8/10"}], "Plot": "An office worker."})
        code, out, _ = self.run_cli("omdb", "tt0137523")
        self.assertEqual(code, 0)
        self.assertIn("Fight Club (1999)", out)
        self.assertIn("8.8/10", out)
        query = Stub.requests[0][1]
        self.assertEqual(query["i"], ["tt0137523"])
        self.assertEqual(query["apikey"], ["testkey"])

    def test_omdb_response_false_exits_1(self):
        self.route("/omdb/", {"Response": "False", "Error": "Incorrect IMDb ID."})
        code, out, err = self.run_cli("omdb", "tt0")
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn("Incorrect IMDb ID.", err)

    def test_find_by_imdb_id(self):
        self.route("/3/find/tt0137523", {"movie_results": [{"id": 550, "title": "Fight Club", "release_date": "1999-10-15"}], "tv_results": []})
        code, out, _ = self.run_cli("find", "tt0137523")
        self.assertEqual(code, 0)
        self.assertEqual(Stub.requests[0][1]["external_source"], ["imdb_id"])
        self.assertIn("Fight Club", out)

    def test_http_error_prints_status_message_and_exits_1(self):
        code, out, err = self.run_cli("movie", "999999999")
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn("404", err)
        self.assertIn("The resource you requested could not be found.", err)

    def test_error_without_json_body_still_reports_the_status(self):
        self.route("/3/movie/1", "<html>bad gateway</html>", status=502)
        code, _, err = self.run_cli("movie", "1")
        self.assertEqual(code, 1)
        self.assertIn("502", err)

    def test_429_retries_once_after_retry_after(self):
        limit = {"success": False, "status_code": 25, "status_message": "Your request count (21) is over the allowed limit of (20)."}
        self.route("/3/movie/550", limit, status=429, headers={"Retry-After": "2"})
        self.route("/3/movie/550", MOVIE)
        code, out, _ = self.run_cli("movie", "550")
        self.assertEqual(code, 0)
        self.assertIn("Fight Club", out)
        self.assertEqual(len(Stub.requests), 2)
        self.time.sleep.assert_called_once_with(2)

    def test_429_twice_gives_up_after_one_retry(self):
        limit = {"success": False, "status_code": 25, "status_message": "Your request count (21) is over the allowed limit of (20)."}
        self.route("/3/movie/550", limit, status=429, headers={"Retry-After": "0"})
        code, out, err = self.run_cli("movie", "550")
        self.assertEqual(code, 1)
        self.assertEqual(len(Stub.requests), 2)
        self.assertIn("429", err)
        self.assertIn("over the allowed limit", err)

    def test_missing_key_exits_1_without_calling_the_api(self):
        with mock.patch.dict(os.environ, {"AMODB_API_KEY": ""}):
            code, _, err = self.run_cli("movie", "550")
        self.assertEqual(code, 1)
        self.assertIn("AMODB_API_KEY", err)
        self.assertEqual(Stub.requests, [])

    def test_retry_delay(self):
        self.assertEqual(amodb_cli.retry_delay("3"), 3)
        self.assertEqual(amodb_cli.retry_delay("999"), 60)
        self.assertEqual(amodb_cli.retry_delay("-5"), 0)
        self.assertEqual(amodb_cli.retry_delay(None), 1)
        self.assertEqual(amodb_cli.retry_delay("soon"), 1)
        self.assertEqual(amodb_cli.retry_delay("Wed, 21 Oct 2015 07:28:00 GMT"), 0)


if __name__ == "__main__":
    unittest.main()
