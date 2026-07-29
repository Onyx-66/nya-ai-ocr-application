"""MangaText AI — Local Cleaning Controller (STUB).

Removes original text from manga/webtoon panels (inpainting) so translated
text can be retyped onto a clean image. This is a STUB — model inference
(LaMa, lama-cleaner, etc.) is left as TODO. The HTTP contract matches what
the Nya Smart OCR web app expects when a Cleaning server URL is set in
Settings.

Contract:  POST /clean  →  { "cleaned_image_url": "..." }
"""
import os
import logging
import base64

import httpx
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("mangaclean")

API_KEY = os.getenv("API_KEY", "").strip()
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8001"))

app = FastAPI(title="MangaText AI Local Cleaning Controller", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _check_key(x_api_key: str | None):
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")


@app.get("/health")
def health():
    return {"status": "ok", "stage": "cleaning"}


@app.post("/clean")
async def clean(
    image: UploadFile | None = File(None),
    image_url: str | None = Form(None),
    x_api_key: str | None = Header(None),
):
    _check_key(x_api_key)

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

    # TODO: Run text removal / inpainting model (e.g. LaMa, lama-cleaner).
    # The input `data` is raw image bytes (jpg/png/webp). Detect text regions
    # (you can use the OCR controller's box output or your own detection),
    # inpaint them, and return the cleaned image.
    #
    # For now, return the original image unchanged as a base64 data URL.
    b64 = base64.b64encode(data).decode("ascii")
    cleaned_image_url = f"data:image/png;base64,{b64}"

    return {"cleaned_image_url": cleaned_image_url}


if __name__ == "__main__":
    import uvicorn

    logger.info("Starting Cleaning Controller on %s:%s", HOST, PORT)
    uvicorn.run(app, host=HOST, port=PORT)