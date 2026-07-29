# MangaText AI — Local OCR Controller

A self-hosted Python service that performs **free, high-speed OCR** for the
Nya Smart OCR web app using [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR).
Run it on your own RDP/PC; point the web app at it from **Settings → Local OCR
server**. When the URL is set, the app routes pages here instead of the cloud
LLM — so processing is free and fast. When the URL is empty, the app falls
back to the cloud OCR automatically.

> **Trade-off:** PaddleOCR is extremely fast and free, but it tags bubble
> types (speech / sfx / box …) using geometry heuristics rather than a vision
> LLM. Classification is therefore less precise than the cloud path. You can
> switch back to cloud OCR at any time by clearing the Local OCR server URL.

---

## 1. Requirements

- **Python 3.10 or 3.11** (3.12 works too, but PaddleOCR is best-tested on 3.10/3.11).
- **Windows (RDP) or Linux.** macOS works with CPU only.
- ~3 GB free disk for the model cache (downloaded automatically on first run).
- A CPU is fine. A CUDA GPU is optional (see *GPU* below).

## 2. Install

Open a terminal **in this `ocr-controller` folder** and run:

```bash
# (recommended) create an isolated environment
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux/macOS

pip install -r requirements.txt
```

> **Windows note:** `paddlepaddle` ships prebuilt wheels for Windows. If pip
> fails to find a wheel, make sure your Python is 3.10 or 3.11 (64-bit) and
> that pip is up to date: `python -m pip install --upgrade pip`.

## 3. Configure (optional)

```bash
copy .env.example .env          # Windows
# cp .env.example .env          # Linux/macOS
```

Edit `.env` to set the source language (`OCR_LANG`, default `japan`), the port
(default `8000`), and an optional `API_KEY` shared secret. Supported language
codes include: `japan`, `korean`, `en`, `ch`, `french`, `german`, `italian`,
`russian`, … (full list in the PaddleOCR docs).

## 4. Run

```bash
python main.py
```

You should see:

```
Starting MangaText AI OCR Controller on 0.0.0.0:8000 (lang=japan, gpu=False)
INFO:     Uvicorn running on http://0.0.0.0:8000
```

The first request downloads the model (~100 MB) and can take 30–60 s.
Subsequent requests run in well under a second per page on a modern CPU.

On Windows you can also double-click **`start.bat`**.

### Keep it running in the background (RDP)

Use a process manager so the server survives a disconnected RDP session:

```bash
pip install uvicorn
# Run detached with nohup-style background:
start /b python main.py            # Windows (simple)
# nohup python main.py &            # Linux
```

For production reliability use **NSSM** (Windows) or **systemd** (Linux) to
install `python main.py` as a service that auto-restarts. See
[NSSM usage](https://nssm.cc/usage).

## 5. Expose the server to the web app

The web app (hosted on Base44) runs in the browser and must be able to reach
this server over HTTP. Pick one:

### Option A — Same machine / LAN
If the browser is on the same machine as the server, the URL is simply:
```
http://localhost:8000
```

### Option B — Public IP (RDP with a static IP)
1. Open **Windows Defender Firewall → Advanced settings → Inbound Rules → New Rule**.
2. Rule type: **Port**, TCP, **8000**, **Allow**.
3. Use the server's public IP: `http://<YOUR-PUBLIC-IP>:8000`.

> ⚠️ Binding to `0.0.0.0` with no `API_KEY` exposes the server to anyone who
> knows the IP. Set `API_KEY` in `.env` (and send it from the app) if the
> server is on a public IP.

### Option C — Tunnel (no static IP, recommended)
Use a tunnel when your RDP machine has no stable public IP. With
[ngrok](https://ngrok.com/):

```bash
ngrok http 8000
```

Copy the generated `https://xxxx.ngrok-free.app` URL into the web app
**Settings → Local OCR server** field.

Cloudflare Tunnel (`cloudflared`) is a free alternative with stable domains.

## 6. Connect the web app

1. Open the Nya Smart OCR app → **Settings → Local OCR server**.
2. Paste the server URL (e.g. `http://1.2.3.4:8000` or the ngrok URL).
3. Click **Save**, then **Test connection** — it should say *Server reachable*.
4. Run OCR in the workspace. Pages are now processed on your machine.

To go back to the cloud OCR, clear the URL and save.

## 7. GPU (optional, much faster)

1. Install CUDA 11.8 (or 12.x) toolkit on the machine.
2. Replace the CPU paddle package:
   ```bash
   pip uninstall paddlepaddle
   pip install paddlepaddle-gpu==2.6.1 -f https://www.paddlepaddle.org.cn/whl/linux/mkl/avx/stable.html
   ```
   (Use the Windows CUDA wheel URL from the PaddlePaddle install page that
   matches your CUDA version.)
3. Set `USE_GPU=true` in `.env`.
4. Restart the server. `/health` will report `gpu: true`.

A mid-range GPU typically brings a 40-page chapter down to ~15–25 s.

## 8. Troubleshooting

| Symptom | Fix |
|---|---|
| `Could not decode image` | The uploaded file is corrupt or not an image (jpg/png/webp/bmp). |
| Browser console: CORS error | The server already enables `*` origins. If you set `API_KEY`, ensure the app sends the header. |
| First request is slow | PaddleOCR downloads models on first use. Wait for the "Loaded PaddleOCR" log line. |
| `Test connection` fails from the app but works locally | The RDP port is firewalled or the tunnel is down. Re-check the firewall rule / ngrok process. |
| `No module named 'paddleocr'` | Activate the venv (`.venv\Scripts\activate`) before running `python main.py`. |
| OCR accuracy is low | Try a different `OCR_LANG`. Heavily stylized manga SFX is hard for any OCR engine. |

## 9. API reference

### `GET /health`
Returns `{ "status": "ok", "lang": "...", "gpu": false }`. Used by the
web app's **Test connection** button.

### `POST /ocr`
Multipart form:
- `image` (file) — the page image. **Or**
- `image_url` (string) — a public URL to fetch the image from.
- `lang` (string, optional) — overrides `OCR_LANG` for this request.
- `format`, `markers`, `empty_line` — accepted for compatibility; ignored
  (the web app formats output and applies markers itself).

Response:
```json
{
  "pages": [ { "items": [ { "text": "...", "type": "speech" } ] } ],
  "count": 12,
  "lang": "japan",
  "direction": "rtl"
}
```

`type` is one of: `speech`, `sfx`, `smalltext`, `outertext` (heuristic).
Items the heuristic cannot classify fall back to `speech`.