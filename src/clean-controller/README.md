# MangaText AI — Local Cleaning Controller (STUB)

A self-hosted Python service that **removes original text from manga/webtoon
panels** (inpainting), producing clean images ready for retyping. When the
Cleaning server URL is set in the Nya Smart OCR app (**Settings → Local
servers → Cleaning**), the app sends each page image here after OCR and before
typesetting.

> **Status: STUB.** The HTTP contract, CORS, and `API_KEY` header check are
> fully implemented. The actual inpainting model (LaMa, lama-cleaner, etc.) is
> left as `# TODO` — a human/engineer will wire it in. The stub returns the
> original image unchanged.

---

## Contract

### `GET /health`
Returns `{ "status": "ok", "stage": "cleaning" }`. Used by the web app's
**Test connection** button.

### `POST /clean`
Multipart form:
- `image` (file) — the page image. **Or**
- `image_url` (string) — a public URL to fetch the image from.

Response:
```json
{ "cleaned_image_url": "data:image/png;base64,..." }
```

The URL can be a data URL (base64) or a hosted URL — the web app accepts both.

## Setup

1. **Python 3.10 or 3.11.**
2. Create a venv and install:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate          # Windows
   # source .venv/bin/activate     # Linux/macOS
   pip install -r requirements.txt
   ```
3. Configure (optional):
   ```bash
   copy .env.example .env          # Windows
   # cp .env.example .env          # Linux/macOS
   ```
4. Run:
   ```bash
   python main.py
   ```
   Or double-click `start.bat` on Windows.

The server starts on `http://0.0.0.0:8001`.

## Exposing from an RDP box

The web app (in the browser) must reach this server over HTTP. Pick one:

- **Same machine / LAN:** `http://localhost:8001`
- **Public IP:** Open TCP port `8001` in Windows Defender Firewall → Inbound
  Rules. Use `http://<PUBLIC-IP>:8001`. Set `API_KEY` if on a public IP.
- **Tunnel (no static IP):** `ngrok http 8001` → paste the ngrok URL into
  Settings. Cloudflare Tunnel is a free alternative with stable domains.

## Wiring in a real model (TODO)

In `main.py`, replace the stub block in `POST /clean`:

```python
# TODO: Run text removal / inpainting model.
# 1. Decode `data` (raw image bytes) with cv2.imdecode / PIL.Image.open.
# 2. Detect text regions (use the OCR controller's box output, or run your
#    own text detection: CRAFT, DBNet, etc.).
# 3. Inpaint (LaMa, lama-cleaner, cv2.inpaint for simple cases).
# 4. Encode the result and return as cleaned_image_url.
```

Recommended libraries:
- [simple-lama-inpainting](https://github.com/enesmsahin/simple-lama-inpainting) — LaMa model, pip-installable.
- [lama-cleaner](https://github.com/Sanster/lama-cleaner) — standalone server with a UI.
- OpenCV `cv2.inpaint` — fast but lower quality (telea/navier-stokes).

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Test connection` fails | Check firewall / tunnel, verify the server is running. |
| Images come back unchanged | Expected — the stub returns the original image. Wire in a real model. |
| `Could not fetch image_url` | The URL is not publicly reachable. Use a file upload instead, or host the image. |