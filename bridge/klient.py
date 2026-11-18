#!/usr/bin/env python3
"""Klient stołu z linii komend - dla gracza, który nie ma podpiętego konektora MCP.

  klient.py sit W <hasło>          zajmij miejsce; wypisze żeton (zapamiętaj, nie zapisuj do pliku)
  klient.py wait [sekundy]         czekaj na swoją kolej (np. wait 540): RUCH / CZEKAJ / KONIEC_ROBRA
  klient.py view                   Twój widok stołu
  klient.py bid 1NT | play SA | say "tekst" | deal

Adres stołu: zmienna BRYDZ_URL (albo --url). Żeton: zmienna BRYDZ_ZETON (albo --zeton).
"""
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request


def call(url, path, token=None, body=None, query=None):
    q = dict(query or {})
    if token:
        q["k"] = token
    full = url.rstrip("/") + path + ("?" + urllib.parse.urlencode(q) if q else "")
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(full, data=data, headers={"Content-Type": "application/json"})
    # połączenie przez tunel bywa zrywane; odczyty i czekanie można bezpiecznie ponawiać
    last = None
    for attempt in range(6 if body is None else 1):
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                return json.load(r)
        except (urllib.error.URLError, ConnectionError, TimeoutError) as e:
            last = e
            time.sleep(2 + 3 * attempt)
    return {"ok": False, "error": f"Stół nie odpowiada ({last}). Spróbuj ponownie za chwilę."}


def main(argv):
    opts = {"--url": os.environ.get("BRYDZ_URL", "http://localhost:8765"), "--zeton": os.environ.get("BRYDZ_ZETON")}
    args = []
    it = iter(argv)
    for a in it:
        if a in opts:
            opts[a] = next(it)
        else:
            args.append(a)
    if not args:
        print(__doc__)
        return 0
    url, token, cmd = opts["--url"], opts["--zeton"], args[0]
    if cmd == "sit":
        res = call(url, "/api/sit", body={"seat": args[1], "password": args[2]})
    elif cmd == "view":
        res = call(url, "/api/view", token)
    elif cmd == "wait":
        # serwer trzyma połączenie najwyżej 50 s, więc dłuższe czekanie składamy z kilku zapytań
        left = float(args[1]) if len(args) > 1 else 45
        while True:
            res = call(url, "/api/wait", token, query={"s": str(min(left, 45))})
            left -= 45
            if not res.get("ok") or res["result"] != "CZEKAJ" or left <= 0:
                break
    elif cmd == "bid":
        res = call(url, "/api/bid", token, body={"call": args[1]})
    elif cmd == "play":
        res = call(url, "/api/play", token, body={"card": args[1]})
    elif cmd == "say":
        res = call(url, "/api/say", token, body={"text": " ".join(args[1:])})
    elif cmd == "deal":
        res = call(url, "/api/deal", token, body={})
    else:
        print(__doc__)
        return 1
    print(res["result"] if res.get("ok") else "ODMOWA: " + res.get("error", "?"))
    return 0 if res.get("ok") else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
