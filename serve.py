#!/usr/bin/env python3
"""
Lokaler Server für die GTA-VI-Fan-Seite.

Warum nicht einfach `python -m http.server`?

  * **Range-Requests (206).** `http.server` beantwortet jede Anfrage mit der
    kompletten Datei. Der Browser meldet für ein so ausgeliefertes MP4 dann
    `seekable = 0–0`; das Setzen von `currentTime` wird stillschweigend
    ignoriert und die Scroll-Videos bleiben auf dem ersten Bild stehen.
    (`main.js` fängt das über den Blob-Umweg ab — mit diesem Server braucht
    es den Umweg auf dem Handy nicht mehr.)
  * **Kein Cache.** `Cache-Control: no-store` — geänderte CSS/JS-Dateien sind
    nach einem Reload sofort da.
  * **Im WLAN erreichbar.** Bindet auf 0.0.0.0 und zeigt beim Start die
    Adresse an, unter der das Handy die Seite öffnen kann.

Aufruf:  python serve.py [--port 5174] [--no-browser] [--log PFAD] [--print-lan-ip]

Im Hintergrund wird er über `pythonw.exe` gestartet (siehe `Server starten.bat`).
Dort gibt es keine Konsole — alle Meldungen landen dann in der Logdatei.
"""

import argparse
import http.server
import os
import re
import socket
import sys
import threading
import time
import webbrowser

ROOT = os.path.dirname(os.path.abspath(__file__))
RANGE_RE = re.compile(r"bytes=(\d*)-(\d*)")


class _Slice:
    """Liest höchstens `remaining` Bytes — für die 206-Antwort."""

    def __init__(self, fp, remaining):
        self.fp = fp
        self.remaining = remaining

    def read(self, n=-1):
        if self.remaining <= 0:
            return b""
        if n is None or n < 0:
            n = self.remaining
        data = self.fp.read(min(n, self.remaining))
        self.remaining -= len(data)
        return data

    def close(self):
        self.fp.close()


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".mp4": "video/mp4",
        ".webm": "video/webm",
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".webmanifest": "application/manifest+json",
        ".json": "application/json",
        ".svg": "image/svg+xml",
        ".webp": "image/webp",
        ".avif": "image/avif",
    }

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Accept-Ranges", "bytes")
        super().end_headers()

    def send_head(self):
        rng = self.headers.get("Range")
        if not rng:
            return super().send_head()

        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()

        m = RANGE_RE.fullmatch(rng.strip())
        if not m:
            return super().send_head()

        try:
            fp = open(path, "rb")
        except OSError:
            self.send_error(404, "File not found")
            return None

        stat = os.fstat(fp.fileno())
        size = stat.st_size
        first, last = m.group(1), m.group(2)

        if first == "":
            # "bytes=-500" — die letzten 500 Bytes
            if last == "":
                fp.close()
                self.send_error(400, "Bad Range header")
                return None
            length = min(int(last), size)
            start, end = size - length, size - 1
        else:
            start = int(first)
            end = int(last) if last else size - 1
            end = min(end, size - 1)

        if size == 0 or start >= size or start > end:
            fp.close()
            self.send_response(416)
            self.send_header("Content-Range", "bytes */%d" % size)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return None

        fp.seek(start)
        self.send_response(206)
        self.send_header("Content-type", self.guess_type(path))
        self.send_header("Content-Range", "bytes %d-%d/%d" % (start, end, size))
        self.send_header("Content-Length", str(end - start + 1))
        self.send_header("Last-Modified", self.date_time_string(stat.st_mtime))
        self.end_headers()
        return _Slice(fp, end - start + 1)

    def copyfile(self, source, outputfile):
        # Ein abgebrochener Video-Stream ist der Normalfall, kein Fehler
        try:
            super().copyfile(source, outputfile)
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            pass

    def log_message(self, fmt, *args):
        msg = fmt % args
        if any(code in msg for code in (" 200 ", " 206 ", " 304 ")):
            return
        say("  %s" % msg)


# ── Ausgabe ────────────────────────────────────────────────────────────
# Unter pythonw.exe — so läuft der Server im Hintergrund — gibt es keine
# Konsole: sys.stdout und sys.stderr sind dort None und jedes nackte print()
# würde mit einem AttributeError abbrechen. Alles geht deshalb durch say(),
# das die Konsole nimmt, wenn es eine gibt, und sonst nur die Logdatei.

LOGFILE = None


def open_log(path):
    """Logdatei festlegen und bei Bedarf kürzen, damit sie nicht wächst."""
    global LOGFILE
    LOGFILE = path
    try:
        if os.path.exists(path) and os.path.getsize(path) > 256 * 1024:
            os.remove(path)
    except OSError:
        pass


def say(msg=""):
    if sys.stdout is not None:
        try:
            print(msg)
        except Exception:
            pass
    if LOGFILE:
        try:
            with open(LOGFILE, "a", encoding="utf-8") as f:
                f.write(msg + "\n")
        except OSError:
            pass


def lan_ip():
    """IP-Adresse dieses Rechners im lokalen Netz — für den Aufruf vom Handy."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1))
        return s.getsockname()[0]
    except OSError:
        return None
    finally:
        s.close()


def banner(port):
    ip = lan_ip()
    line = "  " + "-" * 56
    say()
    say("  GRAND THEFT AUTO VI - Fan-Seite")
    say("  gestartet am " + time.strftime("%d.%m.%Y um %H:%M:%S"))
    say(line)
    say("  Am PC        http://localhost:%d" % port)
    if ip:
        say("  Am Handy     http://%s:%d" % (ip, port))
        say("               (gleiches WLAN; beim ersten Start fragt die")
        say("                Windows-Firewall - 'Privates Netzwerk' zulassen)")
    else:
        say("  Am Handy     keine Netzwerkadresse gefunden")
    say(line)


def main():
    ap = argparse.ArgumentParser(add_help=True)
    ap.add_argument("--port", type=int, default=int(os.environ.get("PORT", 5174)))
    ap.add_argument("--no-browser", action="store_true")
    ap.add_argument("--log", metavar="PFAD",
                    help="Meldungen zusaetzlich in diese Datei schreiben")
    ap.add_argument("--print-lan-ip", action="store_true",
                    help="nur die WLAN-Adresse ausgeben und beenden")
    args = ap.parse_args()

    if args.print_lan_ip:
        ip = lan_ip()
        if not ip:
            return 1
        print(ip)
        return 0

    if args.log:
        open_log(args.log)

    os.chdir(ROOT)
    handler = lambda *a, **kw: Handler(*a, directory=ROOT, **kw)  # noqa: E731

    try:
        httpd = http.server.ThreadingHTTPServer(("0.0.0.0", args.port), handler)
    except OSError as e:
        say()
        say("  Port %d ist belegt - laeuft der Server schon?" % args.port)
        say("  (%s)" % e)
        if not args.no_browser:
            webbrowser.open("http://localhost:%d/" % args.port)
        return 1

    httpd.daemon_threads = True
    banner(args.port)
    if sys.stdout is not None:
        say("  Beenden mit Strg+C oder Fenster schliessen")
        say()

    if not args.no_browser:
        threading.Timer(0.6, webbrowser.open, ["http://localhost:%d/" % args.port]).start()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        say("  Server beendet.")
    finally:
        httpd.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
