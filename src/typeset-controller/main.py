"""MangaText AI — Local Typesetting Controller (STUB).

Renders translated text back onto cleaned manga/webtoon panels. This is a
STUB — layout logic (font-fit, angle, alignment, color estimate) and model
inference are left as TODO. The HTTP contract matches what the Nya Smart OCR
web app expects when a Typesetting server URL is set in Settings.

Contract:  POST /typeset  { cleaned_image_url, items: [{ text, type, box }] }
           →  { "output_image_url": "..." }

NOTE: This stage needs bubble geometry (box) from the OCR controller. The web
app requests `include_boxes=true` from the OCR controller when a typesetting
server is configured. Cloud OCR does not return boxes, so typesetting only
works with the local OCR controller.
"""
import os
import logging

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("mangatypeset")

API_KEY = os.getenv("API_KEY", "").strip()
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8003"))

app = FastAPI(title="MangaText AI Local Typesetting Controller", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _check_key(x_api_key: str | None):
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")


class TypesetItem(BaseModel):
    text: str
    type: str = "speech"
    box: list | None = None  # [[x1,y1],[x2,y2],[x3,y3],[x4,y4]] from OCR


class TypesetRequest(BaseModel):
    cleaned_image_url: str
    items: list[TypesetItem] = []


@app.get("/health")
def health():
    return {"status": "ok", "stage": "typesetting"}


@app.post("/typeset")
async def typeset(req: TypesetRequest, x_api_key: str | None = Header(None)):
    _check_key(x_api_key)
    if not req.cleaned_image_url:
        raise HTTPException(status_code=400, detail="cleaned_image_url is required")

    # TODO: Render translated text onto the cleaned image.
    # For each item in req.items:
    #   - Fetch/decode the cleaned image (from req.cleaned_image_url).
    #   - Use item.box (quadrilateral) to determine the text region.
    #   - Fit text: choose font size, wrap, angle, alignment to fill the box.
    #   - Estimate text color from the surrounding image pixels.
    #   - Render with PIL/Pillow or OpenCV.
    # Reference implementation: BallonsTranslator (github.com/dmMaze/BallonsTranslator)
    #
    # For now, return the cleaned image unchanged.
    output_image_url = req.cleaned_image_url

    return {"output_image_url": output_image_url}


if __name__ == "__main__":
    import uvicorn

    logger.info("Starting Typesetting Controller on %s:%s", HOST, PORT)
    uvicorn.run(app, host=HOST, port=PORT)