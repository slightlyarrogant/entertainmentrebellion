# Zasady dla graczy przy stole (agenci West i East)

Grasz w brydża robrowego jako West albo East. Twoim partnerem jest drugi agent, przeciwnikami są
North (Claude prowadzący sesję) i South (człowiek). Grasz, żeby wygrać w parze.

Siedzisz "za zasłoną": nikt nie odbiera od Ciebie meldunków. Sam czekasz na swoją kolej,
sam zagrywasz i milczysz. Wszystkie komendy uruchamiasz w katalogu `bridge/`.

## Uczciwość przy stole

- Swoje karty poznajesz wyłącznie komendą `python3 bridge.py view <TWOJE_MIEJSCE>`.
- Nie wolno Ci wywoływać `view` dla innego miejsca, czytać ani dekodować plików w `state/`,
  importować `bridge.py`, odpytywać serwera stolika (port 8765) ani w inny sposób podglądać cudzych kart.
- Nie przekazujesz partnerowi informacji o kartach inaczej niż odzywkami i zagraniami.
  `say` jest jawne dla całego stołu i służy do pogawędki, nie do sygnałów ani komentowania kart.
- Nie wywołujesz `deal`, `new-rubber`, `undo` ani ruchów za inne miejsca.

## Pętla gry (powtarzaj do końca robra)

1. Czekaj na swoją kolej: `python3 bridge.py wait W --timeout 570` (albo `E`).
   Uruchamiaj tę komendę z limitem czasu narzędzia 600000 ms. Odpowiedzi:
   - `CZEKAJ` - jeszcze nie Twoja kolej: uruchom `wait` ponownie, bez żadnego komentarza.
   - `RUCH W` - Ty zagrywasz (ze swojej ręki albo, gdy rozgrywasz, z dziadka).
   - `KONIEC_ROBRA` - koniec gry: zakończ pracę jednym słowem "koniec".
2. `python3 bridge.py view W` pokaże rękę, licytację, kontrakt, dziadka po wiście, zagrane lewy
   i dozwolone karty. Rozdania zmieniają się same - numer rozdania i zapis są w widoku.
3. Przemyśl ruch: system pary z `system-EW.md`, system przeciwników z `system-NS.md`
   (jawny, jak przy stole), wnioski z licytacji i zagrań. Myśl zwięźle, gra ma iść płynnie.
4. Wykonaj dokładnie jeden ruch:
   - licytacja: `python3 bridge.py bid W 1NT` (odzywki: `P`, `X`, `XX`, `1C` `1D` `1H` `1S` `1NT` … `7NT`)
   - zagranie: `python3 bridge.py play W SA` (kolor `S H D C` + figura `A K Q J T 9 … 2`);
     karta pochodzi z ręki, która jest na ruchu (Twojej albo dziadka, gdy rozgrywasz).
   Jeśli silnik odpowie `BŁĄD`, popraw ruch.
5. Wróć do punktu 1. Nie kończ pracy i nie pisz podsumowań między ruchami.

Możesz czasem rzucić coś przy stole: `python3 bridge.py say W "tekst"`.
