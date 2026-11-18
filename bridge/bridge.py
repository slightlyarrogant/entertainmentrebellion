#!/usr/bin/env python3
"""Silnik brydża robrowego: rozdaje, pilnuje licytacji i rozgrywki, liczy zapis.

Każdy gracz widzi tylko to, co wolno mu widzieć:  bridge.py view <N|E|S|W>
Stan gry leży w state/game.bin (spakowany, żeby nikt nie podejrzał przypadkiem).
Po każdym ruchu powstaje state/public.json - publiczny obraz stołu dla artefaktu
(ręka S jest w nim zaszyfrowana kluczem ze state/key.json).

Komendy:
  new-rubber            nowy rober (zeruje zapis)
  deal                  następne rozdanie
  status                faza, kto na ruchu (bez kart)
  view <seat>           widok gracza
  bid <actor> <call>    P | X | XX | 1C..7NT   (także PAS, KTR, REKTR, 1BA)
  play <actor> <card>   np. SA, H10, DQ, C2  (kolor S/H/D/C + figura A K Q J T 9..2)
  say <seat> <tekst>    rozmowa przy stole (jawna)
  undo                  cofa ostatni ruch
  wait <seat> [--timeout s]  czeka, aż ruch będzie należał do gracza (RUCH / CZEKAJ / KONIEC_ROBRA)
"""
import base64
import fcntl
import hashlib
import json
import os
import secrets
import shutil
import sys
import time
import zlib

DIR = os.environ.get("BRIDGE_STATE") or os.path.join(os.path.dirname(os.path.abspath(__file__)), "state")
STATE = os.path.join(DIR, "game.bin")
PREV = os.path.join(DIR, "game.prev.bin")
PUBLIC = os.path.join(DIR, "public.json")
KEY = os.path.join(DIR, "key.json")

SEATS = "NESW"
SUITS = "SHDC"
RANKS = "AKQJT98765432"
STRAINS = ["C", "D", "H", "S", "NT"]
GLYPH = {"S": "♠", "H": "♥", "D": "♦", "C": "♣", "NT": "NT"}


class Err(Exception):
    pass


def side(seat):
    return "ns" if seat in "NS" else "ew"


def other(sd):
    return "ew" if sd == "ns" else "ns"


def nxt(seat):
    return SEATS[(SEATS.index(seat) + 1) % 4]


def partner(seat):
    return SEATS[(SEATS.index(seat) + 2) % 4]


def sort_hand(cards):
    return sorted(cards, key=lambda c: (SUITS.index(c[0]), RANKS.index(c[1])))


def show_card(c):
    return GLYPH[c[0]] + ("10" if c[1] == "T" else c[1])


def show_hand(cards):
    out = []
    for s in SUITS:
        rs = [("10" if c[1] == "T" else c[1]) for c in sort_hand(cards) if c[0] == s]
        out.append(f"{GLYPH[s]} {' '.join(rs) if rs else '-'}")
    return "   ".join(out)


def show_call(c):
    if c in ("P", "X", "XX"):
        return {"P": "pass", "X": "X", "XX": "XX"}[c]
    return c[0] + GLYPH[c[1:]]


# ---------- stan ----------

def load(path=STATE):
    if not os.path.exists(path):
        return None
    with open(path, "rb") as f:
        return json.loads(zlib.decompress(base64.b64decode(f.read())))


def save(st, backup=True):
    st["v"] += 1
    os.makedirs(DIR, exist_ok=True)
    if backup and os.path.exists(STATE):
        shutil.copy(STATE, PREV)
    with open(STATE + ".tmp", "wb") as f:
        f.write(base64.b64encode(zlib.compress(json.dumps(st).encode())))
    os.replace(STATE + ".tmp", STATE)
    export(st)


def lock():
    os.makedirs(DIR, exist_ok=True)
    f = open(os.path.join(DIR, "lock"), "w")
    fcntl.flock(f, fcntl.LOCK_EX)
    return f


def new_score():
    return {"games": [{"ns": [], "ew": []}], "above": {"ns": [], "ew": []},
            "won": {"ns": 0, "ew": 0}, "done": False}


def new_state():
    return {"v": 0, "secret": secrets.token_hex(16), "deal": 0, "dealer": None, "phase": "idle",
            "hands": {}, "orig": {}, "auction": [], "contract": None, "turn": None,
            "trick": [], "tricks": [], "won": {"ns": 0, "ew": 0}, "result": None,
            "score": new_score(), "rubbers": [], "log": []}


def need(st):
    if st is None:
        raise Err("Brak gry. Zacznij od: new-rubber")
    return st


# ---------- szyfrowanie ręki S dla artefaktu ----------

def encrypt(secret, v, text):
    data = text.encode()
    out = bytearray()
    for i in range(0, len(data), 32):
        ks = hashlib.sha256(f"{secret}|{v}|{i // 32}".encode()).digest()
        out += bytes(a ^ b for a, b in zip(data[i:i + 32], ks))
    return out.hex()


def totals(score):
    t = {}
    for sd in ("ns", "ew"):
        t[sd] = sum(e["pts"] for e in score["above"][sd]) + sum(e["pts"] for g in score["games"] for e in g[sd])
    return t


def public(st):
    c = st["contract"]
    dummy = partner(c["declarer"]) if c else None
    exposed = bool(c) and (len(st["tricks"]) > 0 or len(st["trick"]) > 0)
    pub = {
        "v": st["v"], "deal": st["deal"], "dealer": st["dealer"], "phase": st["phase"],
        "vul": {sd: st["score"]["won"][sd] > 0 for sd in ("ns", "ew")},
        "auction": st["auction"], "contract": c, "turn": st["turn"],
        "dummy": dummy if exposed else None,
        "dummyHand": st["hands"].get(dummy) if exposed else None,
        "trick": st["trick"],
        "lastTrick": st["tricks"][-1] if st["tricks"] else None,
        "won": st["won"],
        "trickWinners": [t["winner"] for t in st["tricks"]],
        "counts": {s: len(st["hands"].get(s, [])) for s in SEATS},
        "encS": encrypt(st["secret"], st["v"], json.dumps(st["hands"].get("S", []))),
        "result": st["result"],
        "hands": st["orig"] if st["phase"] == "done" else None,
        "history": st["tricks"] if st["phase"] == "done" else None,
        "score": {**st["score"], "totals": totals(st["score"])},
        "rubbers": st["rubbers"],
        "log": st["log"][-30:],
    }
    return pub


def actor_of(st):
    if st["phase"] == "auction":
        return st["turn"]
    if st["phase"] == "play":
        return controller(st, st["turn"])
    return None


def seat_json(st, seat):
    """Obraz stołu dla jednego gracza: to co jawne plus jego własna ręka i dozwolone ruchy."""
    pub = public(st)
    del pub["encS"]
    act = actor_of(st)
    pub.update(seat=seat, actor=act, hand=st["hands"].get(seat, []),
               legalCalls=None, legalCards=None)
    if act == seat and st["phase"] == "auction":
        pub["legalCalls"] = legal_calls(st, seat)
    if act == seat and st["phase"] == "play":
        pub["legalCards"] = legal_cards(st, st["turn"])
    return pub


def export(st):
    pub = public(st)
    with open(PUBLIC, "w") as f:
        json.dump(pub, f)
    with open(KEY, "w") as f:
        json.dump({"secret": st["secret"]}, f)


# ---------- licytacja ----------

def parse_call(raw):
    c = raw.upper().replace(" ", "")
    c = {"PASS": "P", "PAS": "P", "KTR": "X", "KONTRA": "X", "DBL": "X", "REKTR": "XX",
         "REKONTRA": "XX", "RDBL": "XX"}.get(c, c)
    for g, s in (("♠", "S"), ("♥", "H"), ("♦", "D"), ("♣", "C")):
        c = c.replace(g, s)
    if c in ("P", "X", "XX"):
        return c
    if len(c) >= 2 and c[0] in "1234567":
        strain = {"BA": "NT", "N": "NT"}.get(c[1:], c[1:])
        if strain in STRAINS:
            return c[0] + strain
    raise Err(f"Nie rozumiem odzywki: {raw}")


def auction_info(auction):
    last, dbl = None, 0
    for a in auction:
        if a["call"] == "X":
            dbl = 1
        elif a["call"] == "XX":
            dbl = 2
        elif a["call"] != "P":
            last, dbl = a, 0
    return last, dbl


def legal_calls(st, seat):
    last, dbl = auction_info(st["auction"])
    out = ["P"]
    if last and dbl == 0 and side(last["seat"]) != side(seat):
        out.append("X")
    if last and dbl == 1 and side(last["seat"]) == side(seat):
        out.append("XX")
    floor = (int(last["call"][0]), STRAINS.index(last["call"][1:])) if last else (0, 9)
    for lv in range(1, 8):
        for i, s in enumerate(STRAINS):
            if (lv, i) > floor:
                out.append(f"{lv}{s}")
    return out


def cmd_bid(st, actor, raw):
    if st["phase"] != "auction":
        raise Err("Teraz nie ma licytacji.")
    if actor != st["turn"]:
        raise Err(f"Nie twoja kolej - licytuje {st['turn']}.")
    call = parse_call(raw)
    if call not in legal_calls(st, actor):
        raise Err(f"Odzywka {call} jest teraz niedozwolona.")
    st["auction"].append({"seat": actor, "call": call})
    calls = [a["call"] for a in st["auction"]]
    last, dbl = auction_info(st["auction"])
    msg = f"{actor}: {show_call(call)}."
    if len(calls) == 4 and not last:
        st["phase"], st["turn"] = "done", None
        st["result"] = {"text": "Cztery pasy - rozdanie bez zapisu.", "ns": 0, "ew": 0}
        msg += " Cztery pasy, rozdanie bez zapisu."
    elif last and len(calls) >= 4 and calls[-3:] == ["P", "P", "P"]:
        strain = last["call"][1:]
        decl = next(a["seat"] for a in st["auction"]
                    if side(a["seat"]) == side(last["seat"]) and a["call"] not in ("P", "X", "XX")
                    and a["call"][1:] == strain)
        st["contract"] = {"level": int(last["call"][0]), "strain": strain, "dbl": dbl, "declarer": decl}
        st["phase"], st["turn"] = "play", nxt(decl)
        msg += (f" Koniec licytacji: {contract_text(st['contract'])}. "
                f"Wist: {st['turn']}. Dziadek: {partner(decl)}.")
    else:
        st["turn"] = nxt(actor)
        msg += f" Teraz licytuje {st['turn']}."
    return msg


def contract_text(c):
    return f"{c['level']}{GLYPH[c['strain']]}{['', ' X', ' XX'][c['dbl']]} gra {c['declarer']}"


# ---------- rozgrywka ----------

def parse_card(raw):
    c = raw.upper().replace(" ", "")
    for g, s in (("♠", "S"), ("♥", "H"), ("♦", "D"), ("♣", "C")):
        c = c.replace(g, s)
    if len(c) >= 2 and c[0] in SUITS:
        r = {"10": "T", "D": "Q", "W": "J"}.get(c[1:], c[1:])
        if len(r) == 1 and r in RANKS:
            return c[0] + r
    raise Err(f"Nie rozumiem karty: {raw} (pisz np. SA, H10, DQ, C2)")


def controller(st, hand):
    c = st["contract"]
    return c["declarer"] if c and hand == partner(c["declarer"]) else hand


def legal_cards(st, hand):
    cards = st["hands"][hand]
    if st["trick"]:
        lead = st["trick"][0]["card"][0]
        follow = [c for c in cards if c[0] == lead]
        if follow:
            return follow
    return list(cards)


def cmd_play(st, actor, raw):
    if st["phase"] != "play":
        raise Err("Teraz nie ma rozgrywki.")
    hand = st["turn"]
    if controller(st, hand) != actor:
        raise Err(f"Nie twoja kolej - gra ręka {hand} (zagrywa {controller(st, hand)}).")
    card = parse_card(raw)
    if card not in st["hands"][hand]:
        raise Err(f"Ręka {hand} nie ma karty {show_card(card)}.")
    if card not in legal_cards(st, hand):
        raise Err("Trzeba dołożyć do koloru.")
    st["hands"][hand].remove(card)
    st["trick"].append({"seat": hand, "card": card})
    msg = f"{hand}: {show_card(card)}."
    if len(st["trick"]) < 4:
        st["turn"] = nxt(hand)
    else:
        trump, lead = st["contract"]["strain"], st["trick"][0]["card"][0]

        def power(p):
            s, r = p["card"]
            return (2 if s == trump else 1 if s == lead else 0, -RANKS.index(r))
        win = max(st["trick"], key=power)["seat"]
        st["won"][side(win)] += 1
        st["tricks"].append({"cards": st["trick"], "winner": win})
        st["trick"], st["turn"] = [], win
        msg += f" Lewę bierze {win} (NS {st['won']['ns']} : EW {st['won']['ew']})."
        if len(st["tricks"]) == 13:
            return msg + " " + finish(st)
    t = st["turn"]
    msg += f" Teraz gra ręka {t}" + (f" (zagrywa {controller(st, t)})." if controller(st, t) != t else ".")
    return msg


def finish(st):
    c = st["contract"]
    ds = side(c["declarer"])
    sc = st["score"]
    vul = sc["won"][ds] > 0
    got = st["won"][ds]
    target = 6 + c["level"]
    mult = [1, 2, 4][c["dbl"]]
    name = f"{c['level']}{GLYPH[c['strain']]}{['', 'x', 'xx'][c['dbl']]} {c['declarer']}"
    below, above_d, above_o = 0, [], []
    if got >= target:
        per = 20 if c["strain"] in "CD" else 30
        below = (per * c["level"] + (10 if c["strain"] == "NT" else 0)) * mult
        over = got - target
        if over:
            each = per if c["dbl"] == 0 else (100 if not vul else 200) * (c["dbl"])
            above_d.append({"pts": over * each, "label": f"nadróbki +{over}"})
        if c["dbl"]:
            above_d.append({"pts": 50 * c["dbl"], "label": "za kontrę"})
        if c["level"] == 6:
            above_d.append({"pts": 750 if vul else 500, "label": "szlemik"})
        if c["level"] == 7:
            above_d.append({"pts": 1500 if vul else 1000, "label": "szlem"})
        text = f"{name}: swoje" + (f" +{over}" if over else "") + f" ({got} lew)"
    else:
        n = target - got
        if c["dbl"] == 0:
            pts = n * (100 if vul else 50)
        else:
            pts = (200 + 300 * (n - 1)) if vul else ([100, 300, 500][n - 1] if n <= 3 else 500 + 300 * (n - 3))
            pts *= c["dbl"]
        above_o.append({"pts": pts, "label": f"wpadka {name} bez {n}"})
        text = f"{name}: bez {n} ({got} lew)"
    # honory
    for seat in SEATS:
        h = st["orig"][seat]
        if c["strain"] == "NT":
            if all(s + "A" in h for s in SUITS):
                (above_d if side(seat) == ds else above_o).append({"pts": 150, "label": "4 asy"})
        else:
            k = sum(1 for r in "AKQJT" if c["strain"] + r in h)
            if k >= 4:
                (above_d if side(seat) == ds else above_o).append(
                    {"pts": 150 if k == 5 else 100, "label": f"{k} honory"})
    os_ = other(ds)
    sc["above"][ds] += above_d
    sc["above"][os_] += above_o
    if below:
        g = sc["games"][-1]
        g[ds].append({"pts": below, "label": name})
        if sum(e["pts"] for e in g[ds]) >= 100:
            sc["won"][ds] += 1
            text += " - partia!"
            if sc["won"][ds] == 2:
                bonus = 700 if sc["won"][os_] == 0 else 500
                sc["above"][ds].append({"pts": bonus, "label": "rober"})
                sc["done"] = True
                t = totals(sc)
                st["rubbers"].append(t)
                text += f" Koniec robra: NS {t['ns']} : EW {t['ew']}."
            else:
                sc["games"].append({"ns": [], "ew": []})
    pts = {ds: below + sum(e["pts"] for e in above_d), os_: sum(e["pts"] for e in above_o)}
    st["result"] = {"text": text, **pts}
    st["phase"], st["turn"] = "done", None
    return f"Koniec rozdania. {text}. Zapis: NS +{pts['ns']}, EW +{pts['ew']}."


# ---------- komendy ----------

def cmd_deal(st):
    if st["phase"] in ("auction", "play"):
        raise Err("Rozdanie jeszcze trwa.")
    if st["score"]["done"]:
        raise Err("Rober skończony. Zacznij nowy: new-rubber")
    deck = [s + r for s in SUITS for r in RANKS]
    secrets.SystemRandom().shuffle(deck)
    st["deal"] += 1
    st["dealer"] = nxt(st["dealer"]) if st["dealer"] else secrets.choice(SEATS)
    st["hands"] = {s: sort_hand(deck[i * 13:(i + 1) * 13]) for i, s in enumerate(SEATS)}
    st["orig"] = {s: list(h) for s, h in st["hands"].items()}
    st.update(auction=[], contract=None, trick=[], tricks=[], won={"ns": 0, "ew": 0}, result=None,
              phase="auction", turn=st["dealer"])
    return f"Rozdanie {st['deal']}. Rozdawał {st['dealer']} i on zaczyna licytację."


def cmd_view(st, seat):
    c = st["contract"]
    sc = st["score"]
    L = [f"=== Rozdanie {st['deal']} | rozdawał {st['dealer']} | po partii: "
         f"NS {'tak' if sc['won']['ns'] else 'nie'}, EW {'tak' if sc['won']['ew'] else 'nie'} ===",
         f"Jesteś {seat} (partner: {partner(seat)}). Faza: {st['phase']}."]
    if st["phase"] == "idle":
        return "\n".join(L)
    L.append(f"Twoja ręka: {show_hand(st['hands'][seat])}")
    if st["auction"]:
        L.append("Licytacja: " + "  ".join(f"{a['seat']}:{show_call(a['call'])}" for a in st["auction"]))
    if c:
        dummy = partner(c["declarer"])
        L.append(f"Kontrakt: {contract_text(c)}. Dziadek: {dummy}.")
        if (st["tricks"] or st["trick"]) and dummy != seat and st["phase"] == "play":
            L.append(f"Dziadek ({dummy}): {show_hand(st['hands'][dummy])}")
        L.append(f"Lewy: NS {st['won']['ns']}, EW {st['won']['ew']}")
        for i, t in enumerate(st["tricks"], 1):
            L.append(f"  {i:2}. " + " ".join(f"{p['seat']}:{show_card(p['card'])}" for p in t["cards"])
                     + f"  -> {t['winner']}")
        if st["trick"]:
            L.append("Bieżąca lewa: " + " ".join(f"{p['seat']}:{show_card(p['card'])}" for p in st["trick"]))
    if st["phase"] == "done":
        L.append("Wynik: " + st["result"]["text"])
        for s in SEATS:
            L.append(f"  {s}: {show_hand(st['orig'][s])}")
    elif st["phase"] == "auction":
        L.append(f"Na ruchu: {st['turn']}." + (" TWOJA KOLEJ." if st["turn"] == seat else ""))
    else:
        t = st["turn"]
        who = controller(st, t)
        L.append(f"Na ruchu: ręka {t} (zagrywa {who}).")
        if who == seat and (t == seat or st["tricks"] or st["trick"]):
            L.append(f"TWOJA KOLEJ. Dozwolone karty z ręki {t}: "
                     + " ".join(show_card(x) for x in legal_cards(st, t)))
    t = totals(sc)
    part = sc["games"][-1]
    L.append(f"Zapis: NS {t['ns']} / EW {t['ew']}; partie NS {sc['won']['ns']} : EW {sc['won']['ew']}; "
             f"częściówka NS {sum(e['pts'] for e in part['ns'])}, EW {sum(e['pts'] for e in part['ew'])}")
    if st["log"]:
        L.append("Rozmowa przy stole: " + " | ".join(f"{m['seat']}: {m['text']}" for m in st["log"][-6:]))
    return "\n".join(L)


def cmd_status(st):
    if st["phase"] == "auction":
        return f"faza=auction turn={st['turn']} actor={st['turn']} deal={st['deal']}"
    if st["phase"] == "play":
        return (f"faza=play turn={st['turn']} actor={controller(st, st['turn'])} deal={st['deal']} "
                f"kontrakt=\"{contract_text(st['contract'])}\" lewy=NS{st['won']['ns']}:EW{st['won']['ew']}")
    return f"faza={st['phase']} deal={st['deal']}" + (f" wynik=\"{st['result']['text']}\"" if st["result"] else "")


def cmd_wait(args):
    """Czeka, aż ruch będzie należał do któregoś z podanych graczy (albo rober się skończy)."""
    seats = [a.upper() for a in args if a.upper() in list(SEATS)]
    timeout = float(args[args.index("--timeout") + 1]) if "--timeout" in args else 570
    end = time.time() + timeout
    while True:
        st = load()
        if st:
            a = actor_of(st)
            if a in seats:
                print(f"RUCH {a}")
                return 0
            if st["score"]["done"] and st["phase"] == "done":
                print("KONIEC_ROBRA")
                return 0
        if time.time() > end:
            print("CZEKAJ")
            return 0
        time.sleep(0.5)


def cmd_wait_change(args):
    """Czeka, aż stan stołu zmieni się względem wersji v i uspokoi; wypisuje nową wersję."""
    seen = int(args[0]) if args else -1
    end = time.time() + 570
    while time.time() < end:
        st = load()
        if st and st["v"] != seen:
            for _ in range(6):
                time.sleep(0.7)
                again = load()
                if again["v"] == st["v"]:
                    break
                st = again
            # migawka pod własną nazwą: plik, którego nikt już nie nadpisze w trakcie wysyłki
            snap_dir = os.path.join(DIR, "push")
            os.makedirs(snap_dir, exist_ok=True)
            for old in os.listdir(snap_dir):
                if os.path.getmtime(os.path.join(snap_dir, old)) < time.time() - 120:
                    os.remove(os.path.join(snap_dir, old))
            snap = os.path.join(snap_dir, f"stol-{st['v']}.json")
            with open(snap, "w") as f:
                json.dump(public(st), f)
            print(f"ZMIANA {st['v']} {snap}")
            return 0
        time.sleep(0.4)
    print(f"CZEKAJ {seen}")
    return 0


def main(argv):
    if not argv:
        print(__doc__)
        return 0
    cmd, args = argv[0], argv[1:]
    seat = args[0].upper() if args else None
    if cmd == "wait":
        return cmd_wait(args)
    if cmd == "wait-change":
        return cmd_wait_change(args)
    lk = lock()
    try:
        if cmd == "new-rubber":
            old = load()
            st = new_state()
            if old:
                st.update(v=old["v"], secret=old["secret"], rubbers=old["rubbers"], dealer=old["dealer"])
            save(st)
            print("Nowy rober. Rozdaj: deal")
            return 0
        st = need(load())
        if cmd == "undo":
            prev = load(PREV)
            if not prev:
                raise Err("Nie ma czego cofać.")
            prev["v"] = st["v"]
            save(prev, backup=False)
            os.remove(PREV)
            print("Cofnięto. " + cmd_status(prev))
            return 0
        if cmd == "status":
            print(cmd_status(st))
            return 0
        if cmd == "deal":
            out = cmd_deal(st)
        elif cmd in ("view", "bid", "play", "say"):
            if seat not in list(SEATS):
                raise Err("Podaj miejsce: N, E, S albo W.")
            if cmd == "view":
                print(cmd_view(st, seat))
                return 0
            if len(args) < 2:
                raise Err("Brakuje argumentu.")
            if cmd == "bid":
                out = cmd_bid(st, seat, args[1])
            elif cmd == "play":
                out = cmd_play(st, seat, args[1])
                # ostatnia karta w ręce schodzi sama. Singiel w kolorze przy pełniejszej ręce już nie:
                # natychmiastowe dołożenie zdradzałoby wszystkim rozkład tej ręki.
                while st["phase"] == "play" and len(st["hands"][st["turn"]]) == 1:
                    hand = st["turn"]
                    out += " [sama] " + cmd_play(st, controller(st, hand), legal_cards(st, hand)[0])
            else:
                st["log"].append({"seat": seat, "text": " ".join(args[1:])[:300]})
                out = "Powiedziane."
        else:
            raise Err(f"Nieznana komenda: {cmd}")
        save(st)
        print(out)
        return 0
    except Err as e:
        print(f"BŁĄD: {e}")
        return 1
    finally:
        lk.close()


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
