# MangaText AI — Local Typesetting Controller (STUB)

A self-hosted Python service that **renders translated text back onto cleaned
manga/webtoon panels**. When the Typesetting server URL is set in the Nya
Smart OCR app (**Settings → Local servers → Typesetting**), the app sends
each page's cleaned image and translated text items here to produce the final
image.

> **Status: STUB.** The HTTP contract, CORS, and `API_KEY` header check are
> fully implemented. The actual text rendering (font-fit, angle, alignment,
> color estimate) is left as `# TODO`. The stub returns the cleaned image
> unchanged.

> **Important:** This stage needs **bubble geometry (box)** from the OCR
> controller. The web app automatically requests `include_boxes=true` from
> the local OCR controller when a typesetting server is configured. Cloud OCR
> does not return boxes, so **typesetting only works when the local OCR
> controller is also configured**.

---

## Contract

### `GET /health`
Returns `{ "status": "ok", "stage": "typesetting" }`. Used by the web app's
**Test connection** button.

### `POST /typeset`
JSON body:
```json
{
  "cleaned_image_url": "data:image/png;base64,...",
  "items": [
    { "text": "Hello!", "type": "speech", "box": [[10,20],[80,20],[80,50],[10,50]] },
    { "text": "BOOM", "type": "sfx", "box": [[100,30],[160,30],[160,70],[100,70]] }
  ]
}
```

- `cleaned_image_url` — the image with original text removed (from the
  Cleaning controller, or the original image if cleaning was not run).
- `items` — one per bubble, in reading order. `box` is a quadrilateral
  (4 corner points) from the OCR controller.

Response:
```json
{ "output_image_url": "data:image/png;base64,..." }
```

## Reference implementation

[**BallonsTranslator**](https://github.com/dmMaze/BallonsTranslator) is the
reference implementation for the layout approach. It handles:
- **Font-fit:** dynamically adjusts font size to fill each bubble's box.
- **Angle:** rotates text to match the bubble's orientation.
- **Alignment:** centers/justifies text within the region.
- **Color estimate:** samples the surrounding pixels to match text color.

Study its `ballontranslator` module for the rendering algorithm.

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

The server starts on `http://0.0.0.0:8003`.

## Exposing from an RDP box

- **Same machine / LAN:** `http://localhost:8003`
- **Public IP:** Open TCP port `8003` in the firewall. Set `API_KEY` if public.
- **Tunnel:** `ngrok http 8003` → paste the URL into Settings.

## Wiring in a real renderer (TODO)

In `main.py`, replace the stub block in `POST /typeset`:

```python
# TODO: Render translated text onto the cleaned image.
# 1. Fetch/decode the cleaned image from req.cleaned_image_url.
# 2. For each item:
#    a. Use item.box (quadrilateral) to determine the text region.
#    b. Fit text: choose font size, wrap, angle, alignment to fill the box.
#    c. Estimate text color from surrounding pixels.
#    d. Render with PIL/Pillow ImageDraw or OpenCV putText.
# 3. Encode the result and return as output_image_url.
```

Recommended libraries:
- **Pillow (PIL)** — `ImageDraw.text`, `ImageFont.truetype`. Good for basic rendering.
- **OpenCV** — `cv2.putText` (limited, no wrapping/fitting out of the box).
- **BallonsTranslator** — full pipeline (font-fit, angle, color). Consider
  importing its rendering module directly.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Test connection` fails | Check firewall / tunnel, verify the server is running. |
| Images come back unchanged | Expected — the stub returns the cleaned image. Wire in a real renderer. |
| `box` is null in items | Cloud OCR doesn't return boxes. Configure the local OCR controller too. |
| Text overflows bubbles | Implement font-fit logic (see BallonsTranslator reference). |