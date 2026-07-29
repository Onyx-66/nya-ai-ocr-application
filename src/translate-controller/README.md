# MangaText AI — Local Translation Controller (STUB)

A self-hosted Python service that **translates manga/webtoon OCR transcripts**
using a local LLM (Ollama, vLLM, llama.cpp, etc.). When the Translation server
URL is set in the Nya Smart OCR app (**Settings → Local servers → Translation**),
the app sends the OCR text here instead of the cloud `translateChapter`
function.

> **Status: STUB.** The HTTP contract, CORS, `API_KEY` header check, and the
> exact translation prompt are all in place. The actual LLM call is left as
> `# TODO` — a human/engineer will wire it in. The stub returns the original
> text unchanged.

---

## Contract

### `GET /health`
Returns `{ "status": "ok", "stage": "translation" }`. Used by the web app's
**Test connection** button.

### `POST /translate`
JSON body:
```json
{ "text": "...", "target_language": "English" }
```

Response:
```json
{ "translated": "..." }
```

## Translation prompt / rules

The cloud `translateChapter` function uses the prompt below. It is already
embedded in `main.py` as `TRANSLATION_PROMPT_TEMPLATE`. Feed it to your local
LLM so the output structure (bubble order, markers, blank lines, SFX prefix)
matches what the web app expects:

```
You are an elite manga / manhwa / webtoon translator. Translate the following
OCR transcript from its original language into {target_language} with natural,
fluent, in-character dialogue.

PRESERVE THE STRUCTURE EXACTLY:
- Keep every line in the same order, one bubble per line.
- Keep ALL sign markers EXACTLY as they appear at the start and/or end of each
  line — including ""  //  []  ()  **  SFX:  ::  <>  ST:  OT:  TL/N: and any
  custom signs. Move them with the line; do not remove, reorder, split, or
  alter them.
- Keep "--- Page N ---" separators on their own line, unchanged.
- Keep blank lines EXACTLY where they appear in the source — do not add or
  remove empty lines.
- For "SFX:" lines, adapt the sound to a natural {target_language} equivalent
  while keeping the "SFX: " prefix.
- Match the tone of each bubble type: shouts feel forceful, thoughts feel
  internal, narration stays descriptive, system text stays terse.
- Translate names/terms consistently. If a term has no direct equivalent,
  transliterate and keep it natural.
- Do NOT add quotation marks, speaker names, translator notes, or any
  commentary.
- Output ONLY the translated transcript, nothing else.
```

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

The server starts on `http://0.0.0.0:8002`.

## Exposing from an RDP box

- **Same machine / LAN:** `http://localhost:8002`
- **Public IP:** Open TCP port `8002` in the firewall. Set `API_KEY` if public.
- **Tunnel:** `ngrok http 8002` → paste the URL into Settings.

## Wiring in a real model (TODO)

In `main.py`, replace the stub block in `POST /translate`:

```python
# TODO: Call a local LLM with `prompt`.
# Example with Ollama (install: https://ollama.com):
#   async with httpx.AsyncClient(timeout=120) as client:
#       r = await client.post("http://localhost:11434/api/generate",
#           json={"model": "qwen2.5:14b", "prompt": prompt, "stream": False})
#       translated = r.json()["response"].strip()
#
# Example with vLLM (OpenAI-compatible API):
#   from openai import AsyncOpenAI
#   client = AsyncOpenAI(base_url="http://localhost:8000/v1", api_key="none")
#   r = await client.chat.completions.create(
#       model="Qwen2.5-14B-Instruct",
#       messages=[{"role": "user", "content": prompt}],
#   )
#   translated = r.choices[0].message.content.strip()
```

Recommended models for manga/comic translation:
- **Qwen2.5 14B / 32B** — strong multilingual, good instruction following.
- **Gemini 2.0 Flash** (via API) — if you want cloud-quality without the
  Base44 cloud function.
- **NLLB / SeamlessM4T** — if you need fast, dedicated translation models.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Test connection` fails | Check firewall / tunnel, verify the server is running. |
| Translation comes back unchanged | Expected — the stub returns the original text. Wire in a real LLM. |
| LLM output drops markers | Use the exact prompt above; switch to a stronger model. |
| Timeout on long chapters | Increase the httpx/uvicorn timeout, or batch by page. |