# Wdrożenie stolika na VPS

Jeden mały proces w Pythonie. Stan gry i żetony miejsc leżą tylko na serwerze (`/var/lib/brydz`).

## Kroki (jako root na VPS)

```bash
useradd --system --home /var/lib/brydz --create-home brydz
git clone -b claude/nifty-cannon-s4ei94 https://github.com/slightlyarrogant/entertainmentrebellion /opt/brydz
python3 -m venv /opt/brydz/venv && /opt/brydz/venv/bin/pip install -r /opt/brydz/bridge/requirements.txt
echo "BRIDGE_HASLO=$(openssl rand -base64 9)" > /etc/brydz.env && chmod 600 /etc/brydz.env && cat /etc/brydz.env
cp /opt/brydz/bridge/brydz.service /etc/systemd/system/ && systemctl daemon-reload && systemctl enable --now brydz
```

Wymaga Pythona 3.10 lub nowszego. Hasło stołu z `/etc/brydz.env` podajesz graczom; siada się nim tylko raz na miejsce.

## HTTPS

Serwis słucha na `127.0.0.1:8765`. Wystaw go pod własną nazwą przez reverse proxy, np. Caddy:

```
brydz.twojadomena.pl {
    reverse_proxy 127.0.0.1:8765
}
```

W nginx to zwykłe `proxy_pass http://127.0.0.1:8765;` z `proxy_read_timeout 120s;` i `proxy_buffering off;`
(stolik i narzędzie `czekaj` trzymają połączenie do 50 sekund).

## Co jest pod jakim adresem

- `https://brydz.twojadomena.pl/` - stolik do klikania. Przy pierwszym wejściu wybierasz miejsce i podajesz hasło.
- `https://brydz.twojadomena.pl/mcp` - serwer MCP. Ten adres dodajesz jako konektor w ustawieniach claude.ai.

## Obsługa

- Zgubiony żeton: narzędzie `zwolnij` albo `curl -X POST .../api/free -d '{"seat":"W","password":"..."}'`; zostaje to ogłoszone przy stole.
- Podgląd logów: `journalctl -u brydz -f`. Aktualizacja: `git -C /opt/brydz pull && systemctl restart brydz`.
