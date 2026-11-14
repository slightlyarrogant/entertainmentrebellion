#!/usr/bin/env python3
"""Stolik jako strona WWW: gracz S ogląda stół i klika odzywki oraz karty. Reguł pilnuje bridge.py."""
import contextlib
import io
import json
import os
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

import bridge as b

HERE = os.path.dirname(os.path.abspath(__file__))
SEAT = "S"


def run(argv):
    out = io.StringIO()
    with contextlib.redirect_stdout(out):
        code = b.main(argv)
    return code == 0, out.getvalue().strip()


class H(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def send(self, body, ctype="application/json", code=200):
        data = body if isinstance(body, bytes) else json.dumps(body).encode()
        self.send_response(code)
        self.send_header("Content-Type", ctype + "; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        u = urlparse(self.path)
        if u.path.endswith("/api/state"):
            seen = int(parse_qs(u.query).get("v", ["-1"])[0])
            end = time.time() + 25
            while True:
                st = b.load()
                if st is None or st["v"] != seen or time.time() > end:
                    break
                time.sleep(0.25)
            return self.send(b.seat_json(st, SEAT) if st else {"v": 0, "phase": "none"})
        if u.path.rstrip("/").endswith("/api") or "/api/" in u.path:
            return self.send({"ok": False, "error": "Nie ma takiego adresu."}, code=404)
        with open(os.path.join(HERE, "table.html"), "rb") as f:
            return self.send(f.read(), "text/html")

    def do_POST(self):
        u = urlparse(self.path)
        n = int(self.headers.get("Content-Length") or 0)
        try:
            body = json.loads(self.rfile.read(n) or b"{}")
        except ValueError:
            body = {}
        name = u.path.rsplit("/", 1)[-1]
        if name == "bid":
            ok, msg = run(["bid", SEAT, str(body.get("call", ""))])
        elif name == "play":
            ok, msg = run(["play", SEAT, str(body.get("card", ""))])
        elif name == "deal":
            st = b.load()
            if st and st["score"]["done"]:
                run(["new-rubber"])
            ok, msg = run(["deal"])
        else:
            return self.send({"ok": False, "error": "Nie ma takiej akcji."}, code=404)
        self.send({"ok": ok, "error": None if ok else msg.replace("BŁĄD: ", "")})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8765"))
    print(f"Stolik: http://localhost:{port}/", flush=True)
    ThreadingHTTPServer(("0.0.0.0", port), H).serve_forever()
