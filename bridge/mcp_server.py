#!/usr/bin/env python3
"""Stół brydżowy jako serwer: narzędzia MCP dla graczy-agentów i strona WWW dla ludzi.

Stan gry żyje tylko tutaj. Każdy gracz siada sam (usiadz / formularz na stronie) i dostaje
żeton swojego miejsca; każda odpowiedź serwera pokazuje wyłącznie to, co temu miejscu wolno widzieć.

Uruchomienie:  BRIDGE_HASLO=... PORT=8765 python3 mcp_server.py
  MCP:    http://host:8765/mcp
  Stolik: http://host:8765/
"""
import asyncio
import contextlib
import io
import json
import os
import secrets
import threading

from fastmcp import FastMCP
from starlette.requests import Request
from starlette.responses import HTMLResponse, JSONResponse

import bridge as b

HERE = os.path.dirname(os.path.abspath(__file__))
TOKENS = os.path.join(b.DIR, "tokens.json")
LOCK = threading.Lock()

os.makedirs(b.DIR, exist_ok=True)
PASSWORD = os.environ.get("BRIDGE_HASLO")
if not PASSWORD:
    pw_file = os.path.join(b.DIR, "haslo.txt")
    if not os.path.exists(pw_file):
        with open(pw_file, "w") as f:
            f.write(secrets.token_urlsafe(9))
    PASSWORD = open(pw_file).read().strip()


class Refused(Exception):
    pass


def run(argv):
    """Wykonuje komendę silnika; zwraca jej komunikat albo zgłasza odmowę."""
    out = io.StringIO()
    with LOCK, contextlib.redirect_stdout(out):
        code = b.main(argv)
    msg = out.getvalue().strip()
    if code != 0:
        raise Refused(msg.replace("BŁĄD: ", ""))
    return msg


def tokens():
    if not os.path.exists(TOKENS):
        return {}
    with open(TOKENS) as f:
        return json.load(f)


def save_tokens(t):
    with open(TOKENS + ".tmp", "w") as f:
        json.dump(t, f)
    os.replace(TOKENS + ".tmp", TOKENS)


def seat_of(token):
    for seat, t in tokens().items():
        if token and secrets.compare_digest(t, str(token)):
            return seat
    raise Refused("Nieznany żeton. Najpierw usiądź przy stole.")


def check_password(password):
    if not secrets.compare_digest(PASSWORD, str(password or "")):
        raise Refused("Złe hasło stołu.")


def sit(seat, password):
    seat = str(seat).upper()
    check_password(password)
    if seat not in list(b.SEATS):
        raise Refused("Miejsce to N, E, S albo W.")
    with LOCK:
        t = tokens()
        if seat in t:
            raise Refused(f"Miejsce {seat} jest już zajęte.")
        t[seat] = secrets.token_urlsafe(18)
        save_tokens(t)
    run(["say", seat, "siada do stołu."])
    return t[seat]


def free(seat, password):
    seat = str(seat).upper()
    check_password(password)
    with LOCK:
        t = tokens()
        if t.pop(seat, None) is None:
            raise Refused(f"Miejsce {seat} jest wolne.")
        save_tokens(t)
    run(["say", seat, "miejsce zwolnione - można usiąść ponownie."])
    return f"Miejsce {seat} zwolnione."


def deal():
    st = b.load()
    if st["score"]["done"]:
        run(["new-rubber"])
    return run(["deal"])


async def wait_turn(seat, seconds):
    end = asyncio.get_event_loop().time() + max(1, min(float(seconds), 50))
    while True:
        st = b.load()
        if b.actor_of(st) == seat:
            return "RUCH"
        if st["score"]["done"] and st["phase"] == "done":
            return "KONIEC_ROBRA"
        if asyncio.get_event_loop().time() > end:
            return "CZEKAJ"
        await asyncio.sleep(0.4)


if b.load() is None:
    run(["new-rubber"])

mcp = FastMCP("Stolik brydzowy", instructions=(
    "Stół do brydża robrowego. Najpierw usiadz(miejsce, haslo) - dostaniesz żeton, który podajesz w każdym "
    "kolejnym wywołaniu i którego nikomu nie zdradzasz. Pętla gry: czekaj -> stol -> licytuj albo zagraj."))


def guarded(fn):
    try:
        return fn()
    except Refused as e:
        return f"ODMOWA: {e}"


@mcp.tool
def usiadz(miejsce: str, haslo: str) -> str:
    """Zajmij miejsce przy stole (N, E, S albo W). Zwraca żeton miejsca - wydawany tylko raz, zachowaj go dla siebie."""
    return guarded(lambda: "Żeton: " + sit(miejsce, haslo))


@mcp.tool
def zwolnij(miejsce: str, haslo: str) -> str:
    """Zwolnij miejsce (np. gdy gracz zgubił żeton). Zostaje to ogłoszone przy stole."""
    return guarded(lambda: free(miejsce, haslo))


@mcp.tool
def stol(zeton: str) -> str:
    """Twój widok stołu: własna ręka, licytacja, kontrakt, dziadek po wiście, zagrane lewy, dozwolone karty, zapis."""
    return guarded(lambda: b.cmd_view(b.load(), seat_of(zeton)))


@mcp.tool
async def czekaj(zeton: str, sekundy: float = 45) -> str:
    """Czekaj na swoją kolej (najwyżej 50 s). Wynik: RUCH (Ty zagrywasz), CZEKAJ (wywołaj ponownie) albo KONIEC_ROBRA."""
    try:
        return await wait_turn(seat_of(zeton), sekundy)
    except Refused as e:
        return f"ODMOWA: {e}"


@mcp.tool
def licytuj(zeton: str, odzywka: str) -> str:
    """Zalicytuj: P, X, XX albo 1C..7NT (C trefl, D karo, H kier, S pik, NT bez atu)."""
    return guarded(lambda: run(["bid", seat_of(zeton), odzywka]))


@mcp.tool
def zagraj(zeton: str, karta: str) -> str:
    """Zagraj kartę z ręki, która jest na ruchu (Twojej albo dziadka, gdy rozgrywasz). Zapis: kolor S/H/D/C i figura, np. SA, H10, DQ, C2."""
    return guarded(lambda: run(["play", seat_of(zeton), karta]))


@mcp.tool
def powiedz(zeton: str, tekst: str) -> str:
    """Powiedz coś przy stole (jawne dla wszystkich). Nie służy do przekazywania informacji o kartach."""
    return guarded(lambda: run(["say", seat_of(zeton), tekst]))


@mcp.tool
def rozdaj(zeton: str) -> str:
    """Rozdaj następne rozdanie (po skończonym robrze zaczyna nowy)."""
    def go():
        seat_of(zeton)
        return deal()
    return guarded(go)


# ---------- HTTP: strona stolika i prosty interfejs dla klienta z linii komend ----------

def token_from(request: Request, body=None):
    return request.query_params.get("k") or request.headers.get("x-zeton") or (body or {}).get("k")


async def body_of(request: Request):
    try:
        return await request.json()
    except Exception:
        return {}


def answer(fn):
    try:
        return JSONResponse({"ok": True, "result": fn()})
    except Refused as e:
        return JSONResponse({"ok": False, "error": str(e)})


@mcp.custom_route("/", methods=["GET"])
async def page(request: Request):
    with open(os.path.join(HERE, "table.html"), encoding="utf-8") as f:
        return HTMLResponse(f.read(), headers={"Cache-Control": "no-store"})


@mcp.custom_route("/api/state", methods=["GET"])
async def api_state(request: Request):
    try:
        seat = seat_of(token_from(request))
    except Refused as e:
        return JSONResponse({"ok": False, "error": str(e), "taken": sorted(tokens())}, status_code=401)
    seen = int(request.query_params.get("v", "-1"))
    for _ in range(100):
        st = b.load()
        if st["v"] != seen:
            break
        await asyncio.sleep(0.25)
    return JSONResponse(b.seat_json(st, seat), headers={"Cache-Control": "no-store"})


@mcp.custom_route("/api/sit", methods=["POST"])
async def api_sit(request: Request):
    body = await body_of(request)
    return answer(lambda: sit(body.get("seat", ""), body.get("password", "")))


@mcp.custom_route("/api/free", methods=["POST"])
async def api_free(request: Request):
    body = await body_of(request)
    return answer(lambda: free(body.get("seat", ""), body.get("password", "")))


@mcp.custom_route("/api/view", methods=["GET"])
async def api_view(request: Request):
    return answer(lambda: b.cmd_view(b.load(), seat_of(token_from(request))))


@mcp.custom_route("/api/wait", methods=["GET"])
async def api_wait(request: Request):
    try:
        seat = seat_of(token_from(request))
    except Refused as e:
        return JSONResponse({"ok": False, "error": str(e)})
    return JSONResponse({"ok": True, "result": await wait_turn(seat, request.query_params.get("s", "45"))})


@mcp.custom_route("/api/{action}", methods=["POST"])
async def api_act(request: Request):
    body = await body_of(request)
    action = request.path_params["action"]

    def go():
        seat = seat_of(token_from(request, body))
        if action == "bid":
            return run(["bid", seat, str(body.get("call", ""))])
        if action == "play":
            return run(["play", seat, str(body.get("card", ""))])
        if action == "say":
            return run(["say", seat, str(body.get("text", ""))])
        if action == "deal":
            return deal()
        raise Refused("Nie ma takiej akcji.")
    return answer(go)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8765"))
    print(f"Hasło stołu: {PASSWORD}", flush=True)
    mcp.run(transport="http", host=os.environ.get("HOST", "0.0.0.0"), port=port)
