"""Symulacja: losowe, ale legalne rozdania aż do końca robra. Sprawdza spójność silnika."""
import os
import random
import sys
import tempfile

os.environ["BRIDGE_STATE"] = tempfile.mkdtemp()
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bridge as b  # noqa: E402

rng = random.Random(int(sys.argv[1]) if len(sys.argv) > 1 else 1)
assert b.main(["new-rubber"]) == 0
deals = 0
while True:
    st = b.load()
    if st["score"]["done"]:
        break
    assert b.main(["deal"]) == 0
    deals += 1
    while True:
        st = b.load()
        if st["phase"] == "auction":
            calls = b.legal_calls(st, st["turn"])
            bids = [c for c in calls if c not in ("P", "X", "XX")]
            r = rng.random()
            call = "P" if r < 0.6 or not bids else rng.choice(calls[1:3]) if r < 0.7 and len(calls) > 2 else bids[rng.randrange(min(4, len(bids)))]
            assert b.main(["bid", st["turn"], call]) == 0
        elif st["phase"] == "play":
            hand = st["turn"]
            assert sum(len(h) for h in st["hands"].values()) + 4 * len(st["tricks"]) + len(st["trick"]) == 52
            assert b.main(["play", b.controller(st, hand), rng.choice(b.legal_cards(st, hand))]) == 0
        else:
            break
    st = b.load()
    if st["contract"]:
        assert st["won"]["ns"] + st["won"]["ew"] == 13
st = b.load()
print("rozdań:", deals, "zapis:", b.totals(st["score"]), "partie:", st["score"]["won"])
print(open(b.PUBLIC).read()[:300])
