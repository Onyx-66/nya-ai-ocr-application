"""PaddleOCR wrapper with per-language lazy loading.

Models are heavy, so we import paddleocr lazily and cache one engine per
language. The server can therefore answer /health immediately at boot,
before any model is downloaded/loaded.
"""
import os
import logging

logger = logging.getLogger("ocr_engine")

_ocr_cache: dict = {}


def _use_gpu() -> bool:
    return os.getenv("USE_GPU", "false").strip().lower() in ("1", "true", "yes")


def get_ocr(lang: str):
    """Return a cached PaddleOCR instance for the given language code."""
    if lang not in _ocr_cache:
        from paddleocr import PaddleOCR

        logger.info("Loading PaddleOCR lang=%s gpu=%s ...", lang, _use_gpu())
        _ocr_cache[lang] = PaddleOCR(
            use_angle_cls=True,
            lang=lang,
            use_gpu=_use_gpu(),
            show_log=False,
        )
        logger.info("Loaded PaddleOCR lang=%s", lang)
    return _ocr_cache[lang]


def detect(image_bytes: bytes, lang: str):
    """Run detection on a raw image buffer.

    Returns (img_shape, raw_result) where raw_result is the PaddleOCR output:
    a list with one page element: [ [ [box], ("text", conf), ... ] ].
    """
    import cv2
    import numpy as np

    ocr = get_ocr(lang)
    arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image (unsupported or corrupt file)")
    result = ocr.ocr(img, cls=True)
    return img.shape, result