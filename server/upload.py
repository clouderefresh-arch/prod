#!/usr/bin/env python3
"""Take large showreel files and publish them on the Rama site."""

import cgi
import json
import os
import re
import subprocess
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import quote

ROOT = Path(os.environ.get("RAMA_ROOT", "/var/www/rama"))
TOKEN = Path(os.environ.get("RAMA_TOKEN_FILE", "/etc/rama/upload.token")).read_text(encoding="utf-8").strip()
MAX_BYTES = 2 * 1024 * 1024 * 1024
FIXED = {"timati-reel.mp4", "timati-danke.mp4", "fashion-mgl.mp4", "dod.mp4", "showreel.mp4", "logo.png", "rama.html", "index.html", "reels.json"}

PAGE = """<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Загрузить ролик — Рама</title>
  <style>
    body { margin: 0; background: #121212; color: #fff; font: 16px/1.45 Manrope, sans-serif; }
    main { width: min(640px, calc(100% - 40px)); margin: 48px auto; }
    h1 { margin: 0 0 12px; font-size: 28px; font-weight: 500; }
    p { color: rgba(255,255,255,.78); }
    form { display: grid; gap: 16px; margin-top: 28px; }
    label { display: grid; gap: 8px; }
    input[type="file"] { color: #fff; }
    button { width: fit-content; border: 0; border-radius: 999px; padding: 12px 18px; background: #8ad34e; color: #121212; font: inherit; cursor: pointer; }
    .note { margin-top: 28px; color: #8ad34e; }
    a { color: #8ad34e; }
  </style>
</head>
<body>
  <main>
    <h1>Ролик на сайт</h1>
    <p>Файл до 2 ГБ. GitHub такой размер не примет, здесь примет. После загрузки ролик сразу открывается по ссылке.</p>
    <form method="post" enctype="multipart/form-data">
      <label>Видео mp4<input name="file" type="file" accept="video/mp4,.mp4" required /></label>
      <label><input type="radio" name="place" value="reel" checked /> В раздел «Рилсы»</label>
      <label><input type="radio" name="place" value="hero" /> На первый экран, вместо шоурила</label>
      <button type="submit">Загрузить</button>
    </form>
    __MESSAGE__
  </main>
</body>
</html>
"""


def clean_name(name: str) -> str:
    base = os.path.basename(name or "reel.mp4")
    stem, ext = os.path.splitext(base)
    stem = re.sub(r"\s+", "-", stem.strip())
    stem = re.sub(r"[^\w.-]+", "", stem, flags=re.UNICODE).strip(".-") or "reel"
    if ext.lower() != ".mp4":
        ext = ".mp4"
    return (stem + ext)[:120]


def clock(seconds: float) -> str:
    total = max(0, int(round(seconds)))
    return f"{total // 60:02d}:{total % 60:02d}"


def duration(path: Path) -> str:
    try:
        out = subprocess.check_output(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
            text=True,
            timeout=60,
        )
        return clock(float(out.strip() or 0))
    except (subprocess.SubprocessError, ValueError):
        return ""


def poster(video: Path, image: Path) -> None:
    subprocess.run(
        ["ffmpeg", "-y", "-ss", "0.4", "-i", str(video), "-frames:v", "1", "-vf", "scale=720:-1", "-q:v", "3", str(image)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        timeout=180,
        check=False,
    )


def remember(record: dict) -> None:
    path = ROOT / "reels.json"
    try:
        items = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        items = []
    if not isinstance(items, list):
        items = []
    items = [item for item in items if item.get("file") != record["file"]]
    items.append(record)
    path.write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


class Handler(BaseHTTPRequestHandler):
    def send_html(self, code: int, body: str) -> None:
        data = body.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def token_ok(self) -> bool:
        parts = self.path.split("?", 1)[0].strip("/").split("/")
        return len(parts) == 2 and parts[0] == "upload" and parts[1] == TOKEN

    def do_GET(self) -> None:
        if not self.token_ok():
            self.send_error(404)
            return
        self.send_html(200, PAGE.replace("__MESSAGE__", ""))

    def do_POST(self) -> None:
        if not self.token_ok():
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length", "0") or 0)
        if length <= 0 or length > MAX_BYTES:
            self.send_html(413, PAGE.replace("__MESSAGE__", '<p class="note">Файл пустой или больше 2 ГБ.</p>'))
            return
        form = cgi.FieldStorage(
            fp=self.rfile,
            headers=self.headers,
            environ={
                "REQUEST_METHOD": "POST",
                "CONTENT_TYPE": self.headers.get("Content-Type", ""),
                "CONTENT_LENGTH": str(length),
            },
        )
        uploaded = form["file"] if "file" in form else None
        if uploaded is None or not getattr(uploaded, "file", None):
            self.send_html(400, PAGE.replace("__MESSAGE__", '<p class="note">Выберите mp4.</p>'))
            return
        place = form.getfirst("place", "reel")
        name = "showreel.mp4" if place == "hero" else clean_name(uploaded.filename)
        if place != "hero" and name in {"rama.html", "index.html", "logo.png", "reels.json"}:
            name = "reel-" + name
        target = ROOT / name
        with target.open("wb") as handle:
            while True:
                chunk = uploaded.file.read(1024 * 1024)
                if not chunk:
                    break
                handle.write(chunk)
        image = ROOT / ("showreel.jpg" if place == "hero" else Path(name).stem + ".jpg")
        poster(target, image)
        host = self.headers.get("Host", "95.163.84.18")
        link = f"http://{host}/{quote(name)}"
        if place == "hero":
            message = f'<p class="note">Шоурил на первом экране заменён. <a href="{link}">{link}</a></p>'
        else:
            if name not in FIXED:
                title = Path(name).stem.replace("-", " ").replace("_", " ")
                remember({"id": Path(name).stem, "title": title, "time": duration(target), "file": name, "poster": image.name})
            message = f'<p class="note">Ролик на сайте. <a href="{link}">{link}</a></p>'
        self.send_html(200, PAGE.replace("__MESSAGE__", message))

    def log_message(self, fmt: str, *args) -> None:
        print("[upload]", fmt % args)


if __name__ == "__main__":
    ThreadingHTTPServer(("127.0.0.1", 8091), Handler).serve_forever()
