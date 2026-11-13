# Local file server for browser uploads (Drive / ok.ru) of approved clips (permanent since 2026-11-12; it was lost with a .tmp cleanup).
#   python tools/stream/upload_server.py <port> <root folder>      e.g. 8791 "C:\Users\mshms\Videos\جاهز\دروس"
# GET /list → [{sub, name, size}] of every .mp4 under root (sub = relative folder, "" for root); GET /up.html → the ok.ru helper page;
# GET /<sub>/<name> with a Range header (8 MB chunks: a full GET fails from Chrome). CORS + private-network headers for https pages.
import http.server, os, socketserver, sys, urllib.parse, json
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8791
ROOT = os.path.abspath(sys.argv[2]) if len(sys.argv) > 2 else os.path.abspath(".")
HERE = os.path.dirname(os.path.abspath(__file__))
def files():
    out = []
    for d, _, fs in os.walk(ROOT):
        for n in sorted(fs):
            if n.lower().endswith(".mp4"):
                sub = os.path.relpath(d, ROOT).replace(os.sep, "/")
                out.append({"sub": "" if sub == "." else sub, "name": n, "size": os.path.getsize(os.path.join(d, n))})
    return out
class H(http.server.BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*"); self.send_header("Access-Control-Allow-Private-Network", "true")
        self.send_header("Access-Control-Allow-Headers", "*"); self.send_header("Access-Control-Expose-Headers", "Content-Length, Content-Range")
    def do_OPTIONS(self):
        self.send_response(204); self._cors(); self.end_headers()
    def _bytes(self, b, ctype):
        self.send_response(200); self._cors(); self.send_header("Content-Type", ctype); self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        p = urllib.parse.unquote(self.path.split("?")[0])
        if p == "/":   # (2026-11-13) watch page for the tunnel link: every clip under root, playable with seeking (Range)
            items = "".join(f'<h3>{(x["sub"] + " / ") if x["sub"] else ""}{x["name"][:-4]}</h3><video controls preload="metadata" src="/{urllib.parse.quote(x["sub"] + "/" if x["sub"] else "")}{urllib.parse.quote(x["name"])}"></video>' for x in files())
            return self._bytes(('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>جاهز</title><body dir="rtl" style="font:16px sans-serif;background:#111;color:#eee;margin:0 auto;max-width:900px;padding:12px">' + items + '<style>video{width:100%;max-height:80vh;background:#000;margin-bottom:24px}</style></body>').encode("utf8"), "text/html; charset=utf-8")
        if p == "/up.html": return self._bytes(open(os.path.join(HERE, "upload_helper.html"), "rb").read(), "text/html; charset=utf-8")
        if p == "/list": return self._bytes(json.dumps(files(), ensure_ascii=False).encode("utf8"), "application/json; charset=utf-8")
        rel = p.lstrip("/")
        f = os.path.normpath(os.path.join(ROOT, rel.replace("/", os.sep)))
        if ".." in rel or not os.path.isfile(f):
            self.send_response(404); self._cors(); self.end_headers(); return
        size = os.path.getsize(f); start, end = 0, size - 1
        rng = self.headers.get("Range")
        if rng and rng.startswith("bytes="):
            a, _, b = rng[6:].partition("-"); start = int(a or 0); end = min(int(b), size - 1) if b else size - 1
        self.send_response(206 if rng else 200); self._cors()
        self.send_header("Content-Type", "video/mp4"); self.send_header("Accept-Ranges", "bytes"); self.send_header("Content-Length", str(end - start + 1))
        if rng: self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.end_headers()
        with open(f, "rb") as fh:
            fh.seek(start); left = end - start + 1
            while left > 0:
                chunk = fh.read(min(1 << 20, left))
                if not chunk: break
                try: self.wfile.write(chunk)
                except Exception: break
                left -= len(chunk)
    def log_message(self, *a): pass
class S(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
S(("127.0.0.1", PORT), H).serve_forever()
