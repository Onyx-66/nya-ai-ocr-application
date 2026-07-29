"""MangaText AI — Local OCR Controller.

A self-hosted FastAPI service that extracts manga/webtoon text using PaddleOCR
and returns the exact contract the Nya Smart OCR web app expects:

    POST /ocr  ->  { "pages": [ { "items": [ { "text", "type" } ] } ] }

The web app formats output and applies user markers itself, so this service
only needs to return raw classified items. See README.md for setup.
"""
import os
import logging

import httpx
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from ocr_engine import detect
from postprocess import classify, sort_reading_order

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)
logger = logging.getLogger("mangaocr")

API_KEY = os.getenv("API_KEY", "").strip()
DEFAULT_LANG = os.getenv("OCR_LANG", "japan").strip() or "japan"
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
USE_GPU = os.getenv("USE_GPU", "false").strip().lower() in ("1", "true", "yes")

app = FastAPI(title="MangaText AI Local OCR Controller", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _check_key(x_api_key: str | None):
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")


def _direction_for(lang: str) -> str:
    # Japanese manga reads right-to-left; manhwa/webtoons/western read ltr.
    return "rtl" if lang == "japan" else "ltr"


@app.get("/health")
def health():
    return {"status": "ok", "lang": DEFAULT_LANG, "gpu": USE_GPU}


@app.post("/ocr")
async def ocr(
    image: UploadFile | None = File(None),
    image_url: str | None = Form(None),
    lang: str | None = Form(None),
    format: str | None = Form(None),  # accepted for compatibility; web app formats itself
    markers: str | None = Form(None),  # accepted for compatibility
    empty_line: str | None = Form(None),  # accepted for compatibility
    include_boxes: str | None = Form(None),  # when 'true', include bubble geometry in items
    x_api_key: str | None = Header(None),
):
    _check_key(x_api_key)
    use_lang = (lang or DEFAULT_LANG).strip() or DEFAULT_LANG

    # Resolve the image bytes: prefer a direct file upload, fall back to a URL.
    if image is not None and image.filename:
        data = await image.read()
    elif image_url:
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                r = await client.get(image_url)
                r.raise_for_status()
                data = r.content
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to fetch image_url: {e}")
    else:
        raise HTTPException(status_code=400, detail="Provide 'image' file or 'image_url'")

    try:
        img_shape, raw = detect(data, use_lang)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("OCR failed")
        raise HTTPException(status_code=500, detail=f"OCR error: {e}")

    # PaddleOCR returns one page element per image: [ [ [box], (text, conf), ... ] ]
    items = []
    page = raw[0] if raw and len(raw) else None
    if page:
        for entry in page:
            box, txt_conf = entry[0], entry[1]
            if isinstance(txt_conf, (list, tuple)) and len(txt_conf) >= 2:
                text = (txt_conf[0] or "").strip()
                conf = float(txt_conf[1])
            else:
                text = str(txt_conf).strip()
                conf = 1.0
            if not text:
                continue
            items.append({"box": box, "text": text, "confidence": conf})

    direction = _direction_for(use_lang)
    items = sort_reading_order(items, direction=direction)
    items = classify(items, img_shape)

    # The web app consumes text + type. When include_boxes is set (typesetting
    # pipeline), also include the bubble geometry so the typeset controller can
    # render text back into each region.
    want_boxes = (include_boxes or "").strip().lower() in ("1", "true", "yes")
    if want_boxes:
        clean = [{"text": it["text"], "type": it["type"], "box": it["box"]} for it in items]
    else:
        clean = [{"text": it["text"], "type": it["type"]} for it in items]

    return {"pages": [{"items": clean}], "count": len(clean), "lang": use_lang, "direction": direction}


if __name__ == "__main__":
    import uvicorn

    logger.info("Starting MangaText AI OCR Controller on %s:%s (lang=%s, gpu=%s)", HOST, PORT, DEFAULT_LANG, USE_GPU)
    uvicorn.run(app, host=HOST, port=PORT)