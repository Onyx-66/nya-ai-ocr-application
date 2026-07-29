"""MangaText AI — Local Translation Controller (STUB).

Translates manga/webtoon OCR transcripts using a local LLM (Ollama, vLLM,
etc.). This is a STUB — model inference is left as TODO. The HTTP contract
matches what the Nya Smart OCR web app expects when a Translation server URL
is set in Settings.

Contract:  POST /translate  { text, target_language }  →  { "translated": "..." }
"""
import os
import logging

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("mangatl")

API_KEY = os.getenv("API_KEY", "").strip()
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8002"))

app = FastAPI(title="MangaText AI Local Translation Controller", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _check_key(x_api_key: str | None):
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")


class TranslateRequest(BaseModel):
    text: str
    target_language: str = "English"


# The exact translation prompt/rules the cloud function uses. Feed this to
# your local LLM so output structure matches the web app's expectations.
TRANSLATION_PROMPT_TEMPLATE = """You are an elite manga / manhwa / webtoon translator. Translate the following OCR transcript from its original language into {target_language} with natural, fluent, in-character dialogue.

PRESERVE THE STRUCTURE EXACTLY:
- Keep every line in the same order, one bubble per line.
- Keep ALL sign markers EXACTLY as they appear at the start and/or end of each line — including ""  //  []  ()  **  SFX:  ::  <>  ST:  OT:  TL/N: and any custom signs. Move them with the line; do not remove, reorder, split, or alter them.
- Keep "--- Page N ---" separators on their own line, unchanged.
- Keep blank lines EXACTLY where they appear in the source — do not add or remove empty lines.
- For "SFX:" lines, adapt the sound to a natural {target_language} equivalent while keeping the "SFX: " prefix.
- Match the tone of each bubble type: shouts feel forceful, thoughts feel internal, narration stays descriptive, system text stays terse.
- Translate names/terms consistently. If a term has no direct equivalent, transliterate and keep it natural.
- Do NOT add quotation marks, speaker names, translator notes, or any commentary.
- Output ONLY the translated transcript, nothing else.

TRANSCRIPT:
{text}"""


@app.get("/health")
def health():
    return {"status": "ok", "stage": "translation"}


@app.post("/translate")
async def translate(req: TranslateRequest, x_api_key: str | None = Header(None)):
    _check_key(x_api_key)
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="No text provided")
    if not req.target_language:
        raise HTTPException(status_code=400, detail="A target language is required")

    prompt = TRANSLATION_PROMPT_TEMPLATE.format(
        target_language=req.target_language,
        text=req.text,
    )

    # TODO: Call a local LLM (Ollama, vLLM, llama.cpp server, etc.) with `prompt`.
    # Example with Ollama:
    #   import httpx
    #   async with httpx.AsyncClient(timeout=120) as client:
    #       r = await client.post("http://localhost:11434/api/generate",
    #           json={"model": "qwen2.5:14b", "prompt": prompt, "stream": False})
    #       translated = r.json()["response"].strip()
    #
    # For now, return the original text unchanged.
    translated = req.text

    return {"translated": translated}


if __name__ == "__main__":
    import uvicorn

    logger.info("Starting Translation Controller on %s:%s", HOST, PORT)
    uvicorn.run(app, host=HOST, port=PORT)