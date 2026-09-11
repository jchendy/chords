#!/usr/bin/env python3
"""The dev server, which is python -m http.server with one thing fixed.

http.server sends no Cache-Control at all, and a browser given no instructions
caches heuristically — roughly a tenth of the time since the file was last
modified. On a folder of static files you are editing every few minutes that
means the page you reload is quietly the page you had before, and you end up
debugging a version of the code that no longer exists on disk. Everything here
is served no-store, so a reload is always a reload.

    python3 serve.py [port]          # 127.0.0.1 only, which is the default
    python3 serve.py [port] --lan    # ...and from a phone on the same wifi

--lan serves the whole folder to anything on the network, .git included.
"""
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()

    def log_message(self, fmt, *args):        # one line per request is plenty
        sys.stderr.write('%s %s\n' % (self.address_string(), fmt % args))


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('-')]
    port = int(args[0]) if args else 8777
    host = '' if '--lan' in sys.argv else '127.0.0.1'
    where = 'this machine' if host else 'anything on this network'
    print(f'serving {sys.path[0] or "."} to {where} on port {port}, nothing cached')
    ThreadingHTTPServer((host, port), NoCache).serve_forever()
